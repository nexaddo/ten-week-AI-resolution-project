import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertResolutionSchema, insertMilestoneSchema, insertCheckInSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import rateLimit from "express-rate-limit";

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
      res.status(201).json(checkIn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create check-in" });
    }
  });

  return httpServer;
}
