import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { modelMapStorage } from "./modelMapStorage";
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
      const userModels = await modelMapStorage.getUserModels(userId);
      res.json(userModels);
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
      const userTools = await modelMapStorage.getUserTools(userId);
      res.json(userTools);
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
      const tests = await modelMapStorage.getModelTests(userId);
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
      const { userRating, userNotes } = req.body;
      const result = await modelMapStorage.updateModelTestResult(req.params.resultId, { userRating, userNotes });
      if (!result) {
        return res.status(404).json({ error: "Model test result not found" });
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

  return httpServer;
}
