import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { 
  insertResolutionSchema, 
  insertMilestoneSchema, 
  insertCheckInSchema, 
  insertPromptTestSchema,
  insertPromptTemplateSchema,
  insertUserFavoriteSchema,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth_integrations/auth";
import rateLimit from "express-rate-limit";
import { AIOrchestrator } from "./ai/orchestrator";
import { PromptTester } from "./ai/promptTester";
import type { ModelSelectionStrategy } from "./ai/types";
import { log } from "./index";
import { pool } from "./db";
import { promptTemplateSeeds } from "./ai/promptTemplateSeeds";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (must be before other routes)
  await setupAuth(app);

  // Global API rate limiter to prevent abuse across all endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // generous limit for general API usage
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  });

  // Apply global rate limiting to all API routes
  app.use("/api", apiLimiter);

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

  // Get configured OAuth providers (public, for login UI)
  app.get("/api/auth/providers", async (_req, res) => {
    const { getConfiguredProviders } = await import("./auth_integrations/auth/oauthAuth");
    const providers = Array.from(getConfiguredProviders());
    res.json({ providers });
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

      // Parse selected models if provided
      const selectedModels = promptTest.selectedModels 
        ? JSON.parse(promptTest.selectedModels) 
        : undefined;

      // Run the prompt against selected or all AI models asynchronously
      const tester = new PromptTester(storage);
      tester.testPrompt(
        promptTest.id, 
        {
          prompt: promptTest.prompt,
          systemPrompt: promptTest.systemPrompt || undefined,
        },
        selectedModels
      );

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

  // Prompt Template endpoints
  app.get("/api/prompt-templates", isAuthenticated, async (req: any, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = await storage.getPromptTemplates(category);
      res.json(templates);
    } catch (error) {
      log(`Failed to fetch prompt templates: ${error}`);
      res.status(500).json({ error: "Failed to fetch prompt templates" });
    }
  });

  app.get("/api/prompt-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const template = await storage.getPromptTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      log(`Failed to fetch prompt template: ${error}`);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/prompt-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertPromptTemplateSchema.parse(req.body);
      
      const template = await storage.createPromptTemplate({
        ...parsed,
        createdBy: userId,
      });

      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to create prompt template: ${error}`);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.patch("/api/prompt-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updated = await storage.updatePromptTemplate(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(updated);
    } catch (error) {
      log(`Failed to update prompt template: ${error}`);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/prompt-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deletePromptTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } catch (error) {
      log(`Failed to delete prompt template: ${error}`);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Seed prompt templates (one-time initialization)
  app.post("/api/prompt-templates/seed", isAuthenticated, async (req: any, res) => {
    try {
      const existing = await storage.getPromptTemplates();
      if (existing.length > 0) {
        return res.json({ message: "Templates already seeded", count: existing.length });
      }

      const created = await Promise.all(
        promptTemplateSeeds.map(seed => storage.createPromptTemplate(seed))
      );

      res.json({ message: "Templates seeded successfully", count: created.length });
    } catch (error) {
      log(`Failed to seed prompt templates: ${error}`);
      res.status(500).json({ error: "Failed to seed templates" });
    }
  });

  // User Favorites endpoints
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoriteType = req.query.type as string | undefined;
      const favorites = await storage.getUserFavorites(userId, favoriteType);
      res.json(favorites);
    } catch (error) {
      log(`Failed to fetch favorites: ${error}`);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertUserFavoriteSchema.parse(req.body);

      // Check if already favorited
      const existing = await storage.getFavorite(userId, parsed.favoriteType, parsed.favoriteId);
      if (existing) {
        return res.status(409).json({ error: "Already favorited" });
      }

      const favorite = await storage.createFavorite({
        ...parsed,
        userId,
      });

      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to create favorite: ${error}`);
      res.status(500).json({ error: "Failed to create favorite" });
    }
  });

  app.delete("/api/favorites/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteFavorite(req.params.id, userId);

      if (!deleted) {
        return res.status(404).json({ error: "Favorite not found" });
      }

      res.status(204).send();
    } catch (error) {
      log(`Failed to delete favorite: ${error}`);
      res.status(500).json({ error: "Failed to delete favorite" });
    }
  });

  // Model Map / Analytics endpoint
  app.get("/api/ai/model-map", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all prompt test results for the user
      const tests = await storage.getPromptTests(userId);
      const allResults = await Promise.all(
        tests.map(test => storage.getPromptTestResults(test.id))
      );
      const flatResults = allResults.flat();

      // Group by category and model
      const categoryMap: Record<string, Record<string, any[]>> = {};
      
      for (const test of tests) {
        const category = test.category || "general";
        if (!categoryMap[category]) {
          categoryMap[category] = {};
        }

        const results = await storage.getPromptTestResults(test.id);
        for (const result of results) {
          if (!categoryMap[category][result.modelName]) {
            categoryMap[category][result.modelName] = [];
          }
          categoryMap[category][result.modelName].push({
            latency: result.latencyMs,
            cost: parseFloat(result.estimatedCost),
            tokens: result.totalTokens,
            rating: result.userRating,
            status: result.status,
          });
        }
      }

      // Calculate aggregate stats for each model in each category
      const modelMap = Object.entries(categoryMap).map(([category, models]) => {
        const modelStats = Object.entries(models).map(([modelName, results]) => {
          const successfulResults = results.filter(r => r.status === "success");
          const count = results.length;
          const successCount = successfulResults.length;
          
          if (successCount === 0) {
            return {
              modelName,
              count,
              successRate: 0,
              avgLatency: 0,
              avgCost: 0,
              avgRating: null,
            };
          }

          const avgLatency = successfulResults.reduce((sum, r) => sum + r.latency, 0) / successCount;
          const avgCost = successfulResults.reduce((sum, r) => sum + r.cost, 0) / successCount;
          const ratedResults = successfulResults.filter(r => r.rating !== null);
          const avgRating = ratedResults.length > 0
            ? ratedResults.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedResults.length
            : null;

          return {
            modelName,
            count,
            successRate: (successCount / count) * 100,
            avgLatency: Math.round(avgLatency),
            avgCost: avgCost.toFixed(6),
            avgRating: avgRating ? avgRating.toFixed(1) : null,
          };
        });

        return {
          category,
          models: modelStats,
        };
      });

      res.json(modelMap);
    } catch (error) {
      log(`Failed to generate model map: ${error}`);
      res.status(500).json({ error: "Failed to generate model map" });
    }
  });

  return httpServer;
}
