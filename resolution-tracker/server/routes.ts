import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertResolutionSchema, insertMilestoneSchema, insertCheckInSchema, insertPromptTestSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth_integrations/auth";
import rateLimit from "express-rate-limit";
import { AIOrchestrator } from "./ai/orchestrator";
import { PromptTester } from "./ai/promptTester";
import type { ModelSelectionStrategy } from "./ai/types";
import { log } from "./index";
import { pool } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (must be before other routes)
  await setupAuth(app);

  // Rate limiter for milestone-related routes to mitigate abuse
  const milestoneLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });
  registerAuthRoutes(app);

  // Health check endpoint (public, for monitoring)
  app.get("/api/health", async (_req, res) => {
    try {
      // Check database connection with a simple query that doesn't require user context
      await pool.query("SELECT 1");
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Resolutions CRUD (protected routes)
  app.get("/api/resolutions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resolutions = await storage.getResolutions(userId);
      res.json(resolutions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resolutions" });
    }
  });

  app.get("/api/resolutions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resolution = await storage.getResolution(req.params.id, userId);
      if (!resolution) {
        return res.status(404).json({ error: "Resolution not found" });
      }
      res.json(resolution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resolution" });
    }
  });

  app.post("/api/resolutions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertResolutionSchema.parse(req.body);
      const resolution = await storage.createResolution({ ...parsed, userId });
      res.status(201).json(resolution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create resolution" });
    }
  });

  app.patch("/api/resolutions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = insertResolutionSchema.partial().parse(req.body);
      const resolution = await storage.updateResolution(req.params.id, updates, userId);
      if (!resolution) {
        return res.status(404).json({ error: "Resolution not found" });
      }
      res.json(resolution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update resolution" });
    }
  });

  app.delete("/api/resolutions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteResolution(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Resolution not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resolution" });
    }
  });

  // Milestones CRUD (protected)
  app.get("/api/resolutions/:resolutionId/milestones", milestoneLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Verify the resolution belongs to the authenticated user
      const resolution = await storage.getResolution(req.params.resolutionId, userId);
      if (!resolution) {
        return res.status(404).json({ error: "Resolution not found" });
      }
      const milestones = await storage.getMilestones(req.params.resolutionId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones", milestoneLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertMilestoneSchema.parse(req.body);
      // Verify the resolution belongs to the authenticated user
      const resolution = await storage.getResolution(parsed.resolutionId, userId);
      if (!resolution) {
        return res.status(403).json({ error: "Unauthorized: Resolution not found or does not belong to user" });
      }
      const milestone = await storage.createMilestone(parsed);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  app.patch("/api/milestones/:id", milestoneLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // First get the milestone to find its associated resolution
      const existingMilestone = await storage.getMilestone(req.params.id);
      if (!existingMilestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      // Verify the resolution belongs to the authenticated user
      const resolution = await storage.getResolution(existingMilestone.resolutionId, userId);
      if (!resolution) {
        return res.status(403).json({ error: "Unauthorized: Resolution does not belong to user" });
      }
      const updates = insertMilestoneSchema.partial().parse(req.body);
      const milestone = await storage.updateMilestone(req.params.id, updates);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  app.delete("/api/milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // First get the milestone to find its associated resolution
      const existingMilestone = await storage.getMilestone(req.params.id);
      if (!existingMilestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      // Verify the resolution belongs to the authenticated user
      const resolution = await storage.getResolution(existingMilestone.resolutionId, userId);
      if (!resolution) {
        return res.status(403).json({ error: "Unauthorized: Resolution does not belong to user" });
      }
      const deleted = await storage.deleteMilestone(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // Check-ins (protected)
  app.get("/api/check-ins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const checkIns = await storage.getCheckIns(userId);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  app.get("/api/resolutions/:resolutionId/check-ins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Verify the resolution belongs to the authenticated user
      const resolution = await storage.getResolution(req.params.resolutionId, userId);
      if (!resolution) {
        return res.status(404).json({ error: "Resolution not found" });
      }
      const checkIns = await storage.getCheckInsByResolution(req.params.resolutionId);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  app.post("/api/check-ins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertCheckInSchema.parse(req.body);
      // Verify the resolution belongs to the authenticated user
      const resolution = await storage.getResolution(parsed.resolutionId, userId);
      if (!resolution) {
        return res.status(403).json({ error: "Unauthorized: Resolution not found or does not belong to user" });
      }
      const checkIn = await storage.createCheckIn(parsed);

      // Trigger AI analysis asynchronously (non-blocking)
      if (process.env.AI_ENABLE_ANALYSIS !== "false") {
        const orchestrator = new AIOrchestrator(storage);
        const historicalCheckIns = await storage.getCheckInsByResolution(resolution.id);

        orchestrator.analyzeCheckInAsync(
          checkIn.id,
          {
            checkInNote: checkIn.note,
            resolutionContext: {
              title: resolution.title,
              description: resolution.description,
              category: resolution.category,
              currentProgress: resolution.progress,
              targetDate: resolution.targetDate,
            },
            historicalCheckIns: historicalCheckIns.slice(-5).map((c) => ({
              note: c.note,
              date: c.date,
            })),
          },
          (process.env.AI_STRATEGY as ModelSelectionStrategy) || "all"
        );
      }

      res.status(201).json(checkIn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create check-in" });
    }
  });

  // AI Insights endpoints
  app.get("/api/check-ins/:checkInId/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const checkIn = await storage.getCheckIn(req.params.checkInId);

      if (!checkIn) {
        return res.status(404).json({ error: "Check-in not found" });
      }

      // Verify ownership through resolution
      const resolution = await storage.getResolution(checkIn.resolutionId, userId);
      if (!resolution) {
        return res.status(404).json({ error: "Not found" });
      }

      const insights = await storage.getAiInsightsByCheckIn(req.params.checkInId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  // Get model usage statistics for user
  app.get("/api/ai/model-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getAiModelUsageStats({ userId });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get aggregated model comparison metrics
  app.get("/api/ai/model-comparison", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allUsage = await storage.getAiModelUsageStats({ userId });

      // Aggregate by model
      const modelGroups = allUsage.reduce((acc, usage) => {
        if (!acc[usage.modelName]) {
          acc[usage.modelName] = [];
        }
        acc[usage.modelName].push(usage);
        return acc;
      }, {} as Record<string, typeof allUsage>);

      const comparison = Object.entries(modelGroups).map(([modelName, usages]) => {
        const totalCalls = usages.length;
        const successfulCalls = usages.filter((u) => u.status === "success").length;
        const failedCalls = totalCalls - successfulCalls;
        const avgLatency = usages.reduce((sum, u) => sum + u.latencyMs, 0) / totalCalls;
        const totalCost = usages
          .reduce((sum, u) => sum + parseFloat(u.estimatedCost), 0)
          .toFixed(6);
        const avgTokens = usages.reduce((sum, u) => sum + u.totalTokens, 0) / totalCalls;

        return {
          modelName,
          provider: usages[0].provider,
          totalCalls,
          successfulCalls,
          failedCalls,
          successRate: ((successfulCalls / totalCalls) * 100).toFixed(2),
          avgLatency: Math.round(avgLatency),
          totalCost,
          avgTokens: Math.round(avgTokens),
        };
      });

      res.json(comparison);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comparison" });
    }
  });

  // Prompt Testing endpoints
  app.post("/api/prompt-tests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertPromptTestSchema.parse(req.body);

      const promptTest = await storage.createPromptTest({
        ...parsed,
        userId,
      });

      // Run the prompt against all AI models asynchronously
      const tester = new PromptTester(storage);
      tester.testPrompt(promptTest.id, {
        prompt: promptTest.prompt,
        systemPrompt: promptTest.systemPrompt || undefined,
      });

      res.status(201).json(promptTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to create prompt test: ${error}`);
      res.status(500).json({ error: "Failed to create prompt test" });
    }
  });

  app.get("/api/prompt-tests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tests = await storage.getPromptTests(userId);
      res.json(tests);
    } catch (error) {
      log(`Failed to fetch prompt tests: ${error}`);
      res.status(500).json({ error: "Failed to fetch prompt tests" });
    }
  });

  app.get("/api/prompt-tests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const test = await storage.getPromptTest(req.params.id, userId);

      if (!test) {
        return res.status(404).json({ error: "Prompt test not found" });
      }

      res.json(test);
    } catch (error) {
      log(`Failed to fetch prompt test: ${error}`);
      res.status(500).json({ error: "Failed to fetch prompt test" });
    }
  });

  app.get("/api/prompt-tests/:id/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const test = await storage.getPromptTest(req.params.id, userId);

      if (!test) {
        return res.status(404).json({ error: "Prompt test not found" });
      }

      const results = await storage.getPromptTestResults(req.params.id);
      res.json(results);
    } catch (error) {
      log(`Failed to fetch prompt test results: ${error}`);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  app.patch("/api/prompt-test-results/:id/rating", isAuthenticated, async (req: any, res) => {
    try {
      const { userRating, userComment } = req.body;

      if (userRating !== undefined && (userRating < 1 || userRating > 5)) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const updated = await storage.updatePromptTestResult(req.params.id, {
        userRating,
        userComment,
      });

      if (!updated) {
        return res.status(404).json({ error: "Result not found" });
      }

      res.json(updated);
    } catch (error) {
      log(`Failed to update rating: ${error}`);
      res.status(500).json({ error: "Failed to update rating" });
    }
  });

  app.delete("/api/prompt-tests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deletePromptTest(req.params.id, userId);

      if (!deleted) {
        return res.status(404).json({ error: "Prompt test not found" });
      }

      res.status(204).send();
    } catch (error) {
      log(`Failed to delete prompt test: ${error}`);
      res.status(500).json({ error: "Failed to delete prompt test" });
    }
  });

  return httpServer;
}
