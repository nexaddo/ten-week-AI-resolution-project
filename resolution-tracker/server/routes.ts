import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { modelMapStorage } from "./modelMapStorage";
import {
  insertResolutionSchema,
  insertMilestoneSchema,
  insertCheckInSchema,
  insertPromptTestSchema,
  insertPromptTemplateSchema,
  insertUserFavoriteSchema,
  insertTestCaseTemplateSchema,
  insertTestCaseConfigurationSchema,
  insertModelFavoriteSchema,
  insertToolFavoriteSchema,
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
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Middleware to check if user is admin
async function isAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    next();
  } catch (error) {
    log(`Admin check failed: ${error}`);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
}

// Middleware to track API performance metrics
function apiMetricsMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to log metrics
  res.end = function(...args: any[]) {
    const responseTime = Date.now() - startTime;
    const userId = req.user?.claims?.sub || null;
    
    // Log the metric asynchronously (don't block response)
    storage.logApiMetric({
      userId,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTimeMs: responseTime,
    }).catch((err) => log(`Failed to log API metric: ${err}`));
    
    // Call original end function
    return originalEnd.apply(res, args);
  };
  
  next();
}

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
  
  // Apply performance tracking to all API routes
  app.use("/api", apiMetricsMiddleware);

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
      
      // Log activity
      await storage.logUserActivity({
        userId,
        action: "resolution_created",
        entityType: "resolution",
        entityId: resolution.id,
        metadata: JSON.stringify({ title: resolution.title, category: resolution.category }),
      });
      
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

      // Log activity
      await storage.logUserActivity({
        userId,
        action: "check_in_added",
        entityType: "check_in",
        entityId: checkIn.id,
        metadata: JSON.stringify({ resolutionId: parsed.resolutionId }),
      });

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

  // ============================================
  // MODEL MAP ROUTES
  // ============================================

  // AI Models (global catalog)
  app.get("/api/model-map/models", async (_req, res) => {
    try {
      const models = await modelMapStorage.getAiModels();
      res.json(models);
    } catch (error) {
      log(`Failed to fetch AI models: ${error}`);
      res.status(500).json({ error: "Failed to fetch AI models" });
    }
  });

  app.get("/api/model-map/models/:id", async (req, res) => {
    try {
      const model = await modelMapStorage.getAiModel(req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      log(`Failed to fetch AI model: ${error}`);
      res.status(500).json({ error: "Failed to fetch AI model" });
    }
  });

  // AI Tools (global catalog)
  app.get("/api/model-map/tools", async (_req, res) => {
    try {
      const tools = await modelMapStorage.getAiTools();
      res.json(tools);
    } catch (error) {
      log(`Failed to fetch AI tools: ${error}`);
      res.status(500).json({ error: "Failed to fetch AI tools" });
    }
  });

  app.get("/api/model-map/tools/:id", async (req, res) => {
    try {
      const tool = await modelMapStorage.getAiTool(req.params.id);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      res.json(tool);
    } catch (error) {
      log(`Failed to fetch AI tool: ${error}`);
      res.status(500).json({ error: "Failed to fetch AI tool" });
    }
  });

  // User Models (user-specific selections)
  app.get("/api/model-map/user/models", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const includeStats = req.query.includeStats === "true";
      const userModels = await modelMapStorage.getUserModels(userId);

      if (!includeStats) {
        return res.json(userModels);
      }

      // Calculate stats for each model from test results
      const tests = await modelMapStorage.getModelTests(userId);
      const userModelsWithStats = await Promise.all(
        userModels.map(async (um) => {
          // Get all results for this model across all tests
          let modelResults: any[] = [];
          for (const test of tests) {
            const testResults = await modelMapStorage.getModelTestResults(test.id);
            modelResults.push(...testResults.filter(r => r.modelId === um.modelId));
          }

          // Calculate stats from completed, rated results
          const ratedResults = modelResults.filter(r =>
            r.status === "completed" && (r.userRating !== null || r.accuracyRating !== null)
          );

          const stats = ratedResults.length > 0
            ? {
                testCount: ratedResults.length,
                avgOverall: Math.round(
                  ratedResults.reduce((sum, r) => sum + (r.userRating ?? 0), 0) / ratedResults.length
                ),
                avgAccuracy: Math.round(
                  ratedResults.reduce((sum, r) => sum + (r.accuracyRating ?? 0), 0) / ratedResults.length * 10
                ) / 10,
                avgStyle: Math.round(
                  ratedResults.reduce((sum, r) => sum + (r.styleRating ?? 0), 0) / ratedResults.length * 10
                ) / 10,
              }
            : {
                testCount: 0,
                avgOverall: 0,
                avgAccuracy: 0,
                avgStyle: 0,
              };

          return { ...um, stats };
        })
      );

      res.json(userModelsWithStats);
    } catch (error) {
      log(`Failed to fetch user models: ${error}`);
      res.status(500).json({ error: "Failed to fetch user models" });
    }
  });

  app.post("/api/model-map/user/models", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { modelId, notes } = req.body;
      const userModel = await modelMapStorage.addUserModel({ userId, modelId, notes });
      res.status(201).json(userModel);
    } catch (error) {
      log(`Failed to add user model: ${error}`);
      res.status(500).json({ error: "Failed to add user model" });
    }
  });

  app.delete("/api/model-map/user/models/:modelId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const deleted = await modelMapStorage.removeUserModel(userId, req.params.modelId);
      if (!deleted) {
        return res.status(404).json({ error: "User model not found" });
      }
      res.status(204).send();
    } catch (error) {
      log(`Failed to remove user model: ${error}`);
      res.status(500).json({ error: "Failed to remove user model" });
    }
  });

  // User Tools (user-specific selections)
  app.get("/api/model-map/user/tools", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const includeStats = req.query.includeStats === "true";
      const userTools = await modelMapStorage.getUserTools(userId);

      if (!includeStats) {
        return res.json(userTools);
      }

      // Calculate stats for each tool from test results
      const tests = await modelMapStorage.getModelTests(userId);
      const userToolsWithStats = await Promise.all(
        userTools.map(async (ut) => {
          // Get all results for this tool across all tests
          let toolResults: any[] = [];
          for (const test of tests) {
            const testResults = await modelMapStorage.getModelTestResults(test.id);
            toolResults.push(...testResults.filter(r => r.toolId === ut.toolId));
          }

          // Calculate stats from completed, rated results
          const ratedResults = toolResults.filter(r =>
            r.status === "completed" && (r.userRating !== null || r.accuracyRating !== null)
          );

          const stats = ratedResults.length > 0
            ? {
                testCount: ratedResults.length,
                avgOverall: Math.round(
                  ratedResults.reduce((sum, r) => sum + (r.userRating ?? 0), 0) / ratedResults.length
                ),
                avgAccuracy: Math.round(
                  ratedResults.reduce((sum, r) => sum + (r.accuracyRating ?? 0), 0) / ratedResults.length * 10
                ) / 10,
                avgStyle: Math.round(
                  ratedResults.reduce((sum, r) => sum + (r.styleRating ?? 0), 0) / ratedResults.length * 10
                ) / 10,
              }
            : {
                testCount: 0,
                avgOverall: 0,
                avgAccuracy: 0,
                avgStyle: 0,
              };

          return { ...ut, stats };
        })
      );

      res.json(userToolsWithStats);
    } catch (error) {
      log(`Failed to fetch user tools: ${error}`);
      res.status(500).json({ error: "Failed to fetch user tools" });
    }
  });

  app.post("/api/model-map/user/tools", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { toolId, notes } = req.body;
      const userTool = await modelMapStorage.addUserTool({ userId, toolId, notes });
      res.status(201).json(userTool);
    } catch (error) {
      log(`Failed to add user tool: ${error}`);
      res.status(500).json({ error: "Failed to add user tool" });
    }
  });

  app.delete("/api/model-map/user/tools/:toolId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const deleted = await modelMapStorage.removeUserTool(userId, req.params.toolId);
      if (!deleted) {
        return res.status(404).json({ error: "User tool not found" });
      }
      res.status(204).send();
    } catch (error) {
      log(`Failed to remove user tool: ${error}`);
      res.status(500).json({ error: "Failed to remove user tool" });
    }
  });

  // Use Cases
  app.get("/api/model-map/use-cases", async (req, res) => {
    try {
      const { category, curated } = req.query;
      const filters: { category?: string; isCurated?: boolean } = {};
      if (category && typeof category === "string") {
        filters.category = category;
      }
      if (curated === "true") {
        filters.isCurated = true;
      }
      const useCases = await modelMapStorage.getUseCases(filters);
      res.json(useCases);
    } catch (error) {
      log(`Failed to fetch use cases: ${error}`);
      res.status(500).json({ error: "Failed to fetch use cases" });
    }
  });

  app.get("/api/model-map/use-cases/:id", async (req, res) => {
    try {
      const useCase = await modelMapStorage.getUseCase(req.params.id);
      if (!useCase) {
        return res.status(404).json({ error: "Use case not found" });
      }
      res.json(useCase);
    } catch (error) {
      log(`Failed to fetch use case: ${error}`);
      res.status(500).json({ error: "Failed to fetch use case" });
    }
  });

  app.post("/api/model-map/use-cases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { title, description, category, promptTemplate, variables } = req.body;
      const useCase = await modelMapStorage.createUseCase({
        title,
        description,
        category,
        promptTemplate,
        variables,
        authorId: userId,
        isCurated: false,
        isPublic: true,
      });
      res.status(201).json(useCase);
    } catch (error) {
      log(`Failed to create use case: ${error}`);
      res.status(500).json({ error: "Failed to create use case" });
    }
  });

  app.put("/api/model-map/use-cases/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const useCase = await modelMapStorage.getUseCase(req.params.id);
      if (!useCase) {
        return res.status(404).json({ error: "Use case not found" });
      }
      if (useCase.authorId !== userId) {
        return res.status(403).json({ error: "Not authorized to edit this use case" });
      }
      const updated = await modelMapStorage.updateUseCase(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      log(`Failed to update use case: ${error}`);
      res.status(500).json({ error: "Failed to update use case" });
    }
  });

  app.delete("/api/model-map/use-cases/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const deleted = await modelMapStorage.deleteUseCase(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Use case not found or not authorized" });
      }
      res.status(204).send();
    } catch (error) {
      log(`Failed to delete use case: ${error}`);
      res.status(500).json({ error: "Failed to delete use case" });
    }
  });

  // User Use Cases (favorites)
  app.get("/api/model-map/user/use-cases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const userUseCases = await modelMapStorage.getUserUseCases(userId);
      res.json(userUseCases);
    } catch (error) {
      log(`Failed to fetch user use cases: ${error}`);
      res.status(500).json({ error: "Failed to fetch user use cases" });
    }
  });

  app.post("/api/model-map/user/use-cases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { useCaseId } = req.body;
      const userUseCase = await modelMapStorage.addUserUseCase({ userId, useCaseId });
      res.status(201).json(userUseCase);
    } catch (error) {
      log(`Failed to add user use case: ${error}`);
      res.status(500).json({ error: "Failed to add user use case" });
    }
  });

  app.delete("/api/model-map/user/use-cases/:useCaseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const deleted = await modelMapStorage.removeUserUseCase(userId, req.params.useCaseId);
      if (!deleted) {
        return res.status(404).json({ error: "User use case not found" });
      }
      res.status(204).send();
    } catch (error) {
      log(`Failed to remove user use case: ${error}`);
      res.status(500).json({ error: "Failed to remove user use case" });
    }
  });

  // Model Tests
  app.get("/api/model-map/tests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const includeResults = req.query.includeResults === "true";
      const tests = await modelMapStorage.getModelTests(userId);

      if (includeResults) {
        // Fetch results for each test and include use case info
        const testsWithResults = await Promise.all(
          tests.map(async (test) => {
            const results = await modelMapStorage.getModelTestResults(test.id);
            const useCase = test.useCaseId
              ? await modelMapStorage.getUseCase(test.useCaseId)
              : null;
            return {
              ...test,
              results,
              useCase: useCase ? { category: useCase.category } : null,
            };
          })
        );
        return res.json(testsWithResults);
      }

      res.json(tests);
    } catch (error) {
      log(`Failed to fetch model tests: ${error}`);
      res.status(500).json({ error: "Failed to fetch model tests" });
    }
  });

  app.get("/api/model-map/tests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const test = await modelMapStorage.getModelTest(req.params.id, userId);
      if (!test) {
        return res.status(404).json({ error: "Model test not found" });
      }
      res.json(test);
    } catch (error) {
      log(`Failed to fetch model test: ${error}`);
      res.status(500).json({ error: "Failed to fetch model test" });
    }
  });

  app.post("/api/model-map/tests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { title, useCaseId, prompt, systemPrompt } = req.body;
      
      const test = await modelMapStorage.createModelTest({
        userId,
        title: title || "Untitled Test",
        useCaseId: useCaseId || null,
        prompt,
        systemPrompt: systemPrompt || null,
        status: "pending",
      });
      res.status(201).json(test);
    } catch (error) {
      log(`Failed to create model test: ${error}`);
      res.status(500).json({ error: "Failed to create model test" });
    }
  });

  app.delete("/api/model-map/tests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const deleted = await modelMapStorage.deleteModelTest(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Model test not found" });
      }
      res.status(204).send();
    } catch (error) {
      log(`Failed to delete model test: ${error}`);
      res.status(500).json({ error: "Failed to delete model test" });
    }
  });

  // Model Test Results
  app.get("/api/model-map/tests/:testId/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const test = await modelMapStorage.getModelTest(req.params.testId, userId);
      if (!test) {
        return res.status(404).json({ error: "Model test not found" });
      }
      const results = await modelMapStorage.getModelTestResults(req.params.testId);
      res.json(results);
    } catch (error) {
      log(`Failed to fetch model test results: ${error}`);
      res.status(500).json({ error: "Failed to fetch model test results" });
    }
  });

  app.post("/api/model-map/tests/:testId/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const test = await modelMapStorage.getModelTest(req.params.testId, userId);
      if (!test) {
        return res.status(404).json({ error: "Model test not found" });
      }
      const result = await modelMapStorage.createModelTestResult({
        testId: req.params.testId,
        ...req.body,
      });
      res.status(201).json(result);
    } catch (error) {
      log(`Failed to create model test result: ${error}`);
      res.status(500).json({ error: "Failed to create model test result" });
    }
  });

  app.patch("/api/model-map/tests/:testId/results/:resultId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { userRating, userNotes, accuracyRating, styleRating, speedRating, xFactor, status } = req.body;
      const result = await modelMapStorage.updateModelTestResult(req.params.resultId, {
        userRating,
        userNotes,
        accuracyRating,
        styleRating,
        speedRating,
        xFactor,
        status,
      });
      if (!result) {
        return res.status(404).json({ error: "Model test result not found" });
      }

      // Get the test and check if all results are completed
      const test = await modelMapStorage.getModelTestById(result.testId);
      if (test) {
        const allResults = await modelMapStorage.getModelTestResults(test.id);
        const allCompleted = allResults.every(r => r.status === "completed" || r.userRating);

        // Update test status to completed if all results are done
        if (allCompleted && test.status === "pending") {
          await modelMapStorage.updateModelTest(test.id, { status: "completed" });
        }

        // Generate/update recommendations if test has rated results
        if (allCompleted && test.useCaseId) {
          const ratedResults = allResults.filter(r => r.userRating);
          if (ratedResults.length > 0) {
            const useCase = await modelMapStorage.getUseCase(test.useCaseId);
            if (useCase) {
              const avgRating = Math.round(
                ratedResults.reduce((sum, r) => sum + (r.userRating || 0), 0) / ratedResults.length
              );

              // Find best model/tool from results
              const bestResult = ratedResults.reduce((best, r) =>
                (r.userRating || 0) > (best.userRating || 0) ? r : best
              );

              if (bestResult.modelId) {
                await modelMapStorage.updateRecommendation(
                  userId,
                  useCase.category,
                  bestResult.modelId,
                  avgRating
                );
              }
            }
          }
        }
      }

      res.json(result);
    } catch (error) {
      log(`Failed to update model test result: ${error}`);
      res.status(500).json({ error: "Failed to update model test result" });
    }
  });

  // Direct test result update endpoint (alternative path)
  app.patch("/api/model-map/test-results/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { userRating, userNotes, accuracyRating, styleRating, speedRating, xFactor, status } = req.body;
      const result = await modelMapStorage.updateModelTestResult(req.params.id, {
        userRating,
        userNotes,
        accuracyRating,
        styleRating,
        speedRating,
        xFactor,
        status,
      });
      if (!result) {
        return res.status(404).json({ error: "Model test result not found" });
      }

      // Get the test and check if all results are completed
      const test = await modelMapStorage.getModelTestById(result.testId);
      if (test) {
        const allResults = await modelMapStorage.getModelTestResults(test.id);
        const allCompleted = allResults.every(r => r.status === "completed" || r.userRating);

        // Update test status to completed if all results are done
        if (allCompleted && test.status === "pending") {
          await modelMapStorage.updateModelTest(test.id, { status: "completed" });
        }

        // Generate/update recommendations if test has rated results
        if (allCompleted && test.useCaseId) {
          const ratedResults = allResults.filter(r => r.userRating);
          if (ratedResults.length > 0) {
            const useCase = await modelMapStorage.getUseCase(test.useCaseId);
            if (useCase) {
              const avgRating = Math.round(
                ratedResults.reduce((sum, r) => sum + (r.userRating || 0), 0) / ratedResults.length
              );

              // Find best model/tool from results
              const bestResult = ratedResults.reduce((best, r) =>
                (r.userRating || 0) > (best.userRating || 0) ? r : best
              );

              if (bestResult.modelId) {
                await modelMapStorage.updateRecommendation(
                  userId,
                  useCase.category,
                  bestResult.modelId,
                  avgRating
                );
              }
            }
          }
        }
      }

      res.json(result);
    } catch (error) {
      log(`Failed to update model test result: ${error}`);
      res.status(500).json({ error: "Failed to update model test result" });
    }
  });

  // Model Recommendations
  app.get("/api/model-map/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const recommendations = await modelMapStorage.getUserRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      log(`Failed to fetch recommendations: ${error}`);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // ============================================
  // PROMPT TEMPLATE ROUTES (from prompt-playground-enhanced)
  // ============================================

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

      // Group by category and model
      const categoryMap: Record<string, Record<string, any[]>> = {};

      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const results = allResults[i];
        const category = test.category || "general";
        if (!categoryMap[category]) {
          categoryMap[category] = {};
        }

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

  // Test Case Templates
  app.get("/api/test-case-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getTestCaseTemplates(userId);
      res.json(templates);
    } catch (error) {
      log(`Failed to get test case templates: ${error}`);
      res.status(500).json({ error: "Failed to get test case templates" });
    }
  });

  app.get("/api/test-case-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const template = await storage.getTestCaseTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      // Non-built-in templates should only be accessible to their creator
      if (!template.isBuiltIn && template.userId !== userId) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      log(`Failed to get test case template: ${error}`);
      res.status(500).json({ error: "Failed to get test case template" });
    }
  });

  app.post("/api/test-case-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertTestCaseTemplateSchema.parse({
        ...req.body,
        isBuiltIn: false, // User-created templates are never built-in
        userId,
      });

      const template = await storage.createTestCaseTemplate(parsed);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to create test case template: ${error}`);
      res.status(500).json({ error: "Failed to create test case template" });
    }
  });

  app.patch("/api/test-case-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertTestCaseTemplateSchema.partial().parse(req.body);
      const updated = await storage.updateTestCaseTemplate(req.params.id, parsed, userId);

      if (!updated) {
        return res.status(404).json({ error: "Template not found or unauthorized" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to update test case template: ${error}`);
      res.status(500).json({ error: "Failed to update test case template" });
    }
  });

  app.delete("/api/test-case-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteTestCaseTemplate(req.params.id, userId);

      if (!deleted) {
        return res.status(404).json({ error: "Template not found or unauthorized" });
      }

      res.status(204).send();
    } catch (error) {
      log(`Failed to delete test case template: ${error}`);
      res.status(500).json({ error: "Failed to delete test case template" });
    }
  });

  // Test Case Configurations
  app.get("/api/test-case-configurations/:promptTestId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Verify user owns the prompt test
      const test = await storage.getPromptTest(req.params.promptTestId, userId);
      if (!test) {
        return res.status(404).json({ error: "Test configuration not found" });
      }
      const config = await storage.getTestCaseConfiguration(req.params.promptTestId);
      res.json(config);
    } catch (error) {
      log(`Failed to get test case configuration: ${error}`);
      res.status(500).json({ error: "Failed to get test case configuration" });
    }
  });

  app.post("/api/test-case-configurations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertTestCaseConfigurationSchema.parse(req.body);
      // Verify user owns the prompt test before creating config
      const test = await storage.getPromptTest(parsed.promptTestId, userId);
      if (!test) {
        return res.status(404).json({ error: "Prompt test not found" });
      }
      const config = await storage.createTestCaseConfiguration(parsed);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to create test case configuration: ${error}`);
      res.status(500).json({ error: "Failed to create test case configuration" });
    }
  });

  // Model Favorites
  app.get("/api/model-favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getModelFavorites(userId);
      res.json(favorites);
    } catch (error) {
      log(`Failed to get model favorites: ${error}`);
      res.status(500).json({ error: "Failed to get model favorites" });
    }
  });

  app.post("/api/model-favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertModelFavoriteSchema.parse({ ...req.body, userId });
      const favorite = await storage.createModelFavorite(parsed);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to create model favorite: ${error}`);
      res.status(500).json({ error: "Failed to create model favorite" });
    }
  });

  app.delete("/api/model-favorites/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteModelFavorite(req.params.id, userId);

      if (!deleted) {
        return res.status(404).json({ error: "Favorite not found" });
      }

      res.status(204).send();
    } catch (error) {
      log(`Failed to delete model favorite: ${error}`);
      res.status(500).json({ error: "Failed to delete model favorite" });
    }
  });

  // Tool Favorites
  app.get("/api/tool-favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getToolFavorites(userId);
      res.json(favorites);
    } catch (error) {
      log(`Failed to get tool favorites: ${error}`);
      res.status(500).json({ error: "Failed to get tool favorites" });
    }
  });

  app.post("/api/tool-favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertToolFavoriteSchema.parse({ ...req.body, userId });
      const favorite = await storage.createToolFavorite(parsed);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      log(`Failed to create tool favorite: ${error}`);
      res.status(500).json({ error: "Failed to create tool favorite" });
    }
  });

  app.delete("/api/tool-favorites/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteToolFavorite(req.params.id, userId);

      if (!deleted) {
        return res.status(404).json({ error: "Favorite not found" });
      }

      res.status(204).send();
    } catch (error) {
      log(`Failed to delete tool favorite: ${error}`);
      res.status(500).json({ error: "Failed to delete tool favorite" });
    }
  });

  // Model Performance Analytics
  app.get("/api/model-analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all prompt test results for this user
      const tests = await storage.getPromptTests(userId);
      const allResults = await Promise.all(
        tests.map(test => storage.getPromptTestResults(test.id))
      );
      
      // Flatten results
      const results = allResults.flat();
      
      // Group by model and calculate stats
      const modelStats = new Map<string, {
        modelName: string;
        provider: string;
        totalTests: number;
        successCount: number;
        avgLatency: number;
        totalCost: number;
        avgRating: number;
        ratingCount: number;
      }>();
      
      for (const result of results) {
        const key = `${result.provider}-${result.modelName}`;
        const stats = modelStats.get(key) || {
          modelName: result.modelName,
          provider: result.provider,
          totalTests: 0,
          successCount: 0,
          avgLatency: 0,
          totalCost: 0,
          avgRating: 0,
          ratingCount: 0,
        };
        
        stats.totalTests++;
        if (result.status === 'success') stats.successCount++;
        stats.avgLatency += result.latencyMs;
        const estimatedCost = Number.parseFloat(result.estimatedCost);
        if (!Number.isNaN(estimatedCost)) {
          stats.totalCost += estimatedCost;
        }
        if (result.userRating) {
          stats.avgRating += result.userRating;
          stats.ratingCount++;
        }
        
        modelStats.set(key, stats);
      }
      
      // Calculate averages
      const analytics = Array.from(modelStats.values()).map(stats => ({
        ...stats,
        avgLatency: stats.totalTests > 0 ? Math.round(stats.avgLatency / stats.totalTests) : 0,
        successRate: stats.totalTests > 0 ? (stats.successCount / stats.totalTests) * 100 : 0,
        avgRating: stats.ratingCount > 0 ? stats.avgRating / stats.ratingCount : 0,
      }));
      
      res.json(analytics);
    } catch (error) {
      log(`Failed to get model analytics: ${error}`);
      res.status(500).json({ error: "Failed to get model analytics" });
    }
  });

  // Analytics routes (protected)
  
  // Get analytics stats - user can see their own, admins can see all
  app.get("/api/analytics/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      // If user is admin and no specific user requested, show global stats
      const targetUserId = user?.role === "admin" && !req.query.userId ? undefined : userId;
      
      const stats = await storage.getAnalyticsStats(targetUserId);
      res.json(stats);
    } catch (error) {
      log(`Failed to fetch analytics stats: ${error}`);
      res.status(500).json({ error: "Failed to fetch analytics stats" });
    }
  });

  // Get user activity log
  app.get("/api/analytics/activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const activities = await storage.getUserActivityLog(userId, limit);
      res.json(activities);
    } catch (error) {
      log(`Failed to fetch activity log: ${error}`);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  // Get API performance metrics
  app.get("/api/analytics/performance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      // Only admins can see all performance metrics, regular users see their own
      const targetUserId = user?.role === "admin" && !req.query.userId ? undefined : userId;
      
      const metrics = await storage.getApiMetrics({ userId: targetUserId });
      res.json(metrics);
    } catch (error) {
      log(`Failed to fetch performance metrics: ${error}`);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  // Get page view statistics
  app.get("/api/analytics/pageviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      // Only admins can see all page views, regular users see their own
      const targetUserId = user?.role === "admin" && !req.query.userId ? undefined : userId;
      
      const stats = await storage.getPageViewStats({ userId: targetUserId });
      res.json(stats);
    } catch (error) {
      log(`Failed to fetch page view stats: ${error}`);
      res.status(500).json({ error: "Failed to fetch page view stats" });
    }
  });

  // Log page view (called from frontend)
  app.post("/api/analytics/pageview", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { path, referrer } = req.body;
      
      await storage.logPageView({
        userId,
        path,
        referrer: referrer || null,
        userAgent: req.get('user-agent') || null,
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      log(`Failed to log page view: ${error}`);
      res.status(500).json({ error: "Failed to log page view" });
    }
  });

  // Get current user info including role
  app.get("/api/user/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      log(`Failed to fetch user info: ${error}`);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  });

  return httpServer;
}
