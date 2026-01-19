import {
  type Resolution,
  type InsertResolution,
  type Milestone,
  type InsertMilestone,
  type CheckIn,
  type InsertCheckIn,
  type AiInsight,
  type InsertAiInsight,
  type AiModelUsage,
  type InsertAiModelUsage,
  type PromptTest,
  type InsertPromptTest,
  type PromptTestResult,
  type InsertPromptTestResult,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Resolutions (user-scoped)
  getResolutions(userId: string): Promise<Resolution[]>;
  getResolution(id: string, userId: string): Promise<Resolution | undefined>;
  createResolution(resolution: InsertResolution & { userId: string }): Promise<Resolution>;
  updateResolution(id: string, resolution: Partial<InsertResolution>, userId: string): Promise<Resolution | undefined>;
  deleteResolution(id: string, userId: string): Promise<boolean>;
  
  // Milestones
  getMilestones(resolutionId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<boolean>;
  getMilestone(id: string): Promise<Milestone | undefined>;
  
  // Check-ins
  getCheckIns(userId: string): Promise<CheckIn[]>;
  getCheckInsByResolution(resolutionId: string): Promise<CheckIn[]>;
  getCheckIn(id: string): Promise<CheckIn | undefined>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;

  // AI Insights
  getAiInsightsByCheckIn(checkInId: string): Promise<AiInsight[]>;
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;

  // AI Model Usage
  getAiModelUsageByCheckIn(checkInId: string): Promise<AiModelUsage[]>;
  getAiModelUsageStats(filters?: {
    userId?: string;
    modelName?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AiModelUsage[]>;
  createAiModelUsage(usage: InsertAiModelUsage): Promise<AiModelUsage>;

  // Prompt Tests
  getPromptTests(userId: string): Promise<PromptTest[]>;
  getPromptTest(id: string, userId: string): Promise<PromptTest | undefined>;
  createPromptTest(test: InsertPromptTest & { userId: string }): Promise<PromptTest>;
  deletePromptTest(id: string, userId: string): Promise<boolean>;

  // Prompt Test Results
  getPromptTestResults(promptTestId: string): Promise<PromptTestResult[]>;
  createPromptTestResult(result: InsertPromptTestResult): Promise<PromptTestResult>;
  updatePromptTestResult(
    id: string,
    updates: { userRating?: number; userComment?: string }
  ): Promise<PromptTestResult | undefined>;
}

export class MemStorage implements IStorage {
  private resolutions: Map<string, Resolution>;
  private milestones: Map<string, Milestone>;
  private checkIns: Map<string, CheckIn>;
  private aiInsights: Map<string, AiInsight>;
  private aiModelUsage: Map<string, AiModelUsage>;
  private promptTests: Map<string, PromptTest>;
  private promptTestResults: Map<string, PromptTestResult>;

  constructor() {
    this.resolutions = new Map();
    this.milestones = new Map();
    this.checkIns = new Map();
    this.aiInsights = new Map();
    this.aiModelUsage = new Map();
    this.promptTests = new Map();
    this.promptTestResults = new Map();
  }

  // Resolutions (user-scoped)
  async getResolutions(userId: string): Promise<Resolution[]> {
    return Array.from(this.resolutions.values()).filter(r => r.userId === userId);
  }

  async getResolution(id: string, userId: string): Promise<Resolution | undefined> {
    const resolution = this.resolutions.get(id);
    if (resolution && resolution.userId === userId) {
      return resolution;
    }
    return undefined;
  }

  async createResolution(insertResolution: InsertResolution & { userId: string }): Promise<Resolution> {
    const id = randomUUID();
    const resolution: Resolution = { 
      ...insertResolution, 
      id,
      progress: insertResolution.progress ?? 0,
      status: insertResolution.status ?? "not_started",
      description: insertResolution.description ?? null,
      targetDate: insertResolution.targetDate ?? null,
    };
    this.resolutions.set(id, resolution);
    return resolution;
  }

  async updateResolution(id: string, updates: Partial<InsertResolution>, userId: string): Promise<Resolution | undefined> {
    const existing = this.resolutions.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: Resolution = { ...existing, ...updates };
    this.resolutions.set(id, updated);
    return updated;
  }

  async deleteResolution(id: string, userId: string): Promise<boolean> {
    const existing = this.resolutions.get(id);
    if (!existing || existing.userId !== userId) return false;
    
    // Also delete related milestones and check-ins
    Array.from(this.milestones.entries()).forEach(([milestoneId, milestone]) => {
      if (milestone.resolutionId === id) {
        this.milestones.delete(milestoneId);
      }
    });
    Array.from(this.checkIns.entries()).forEach(([checkInId, checkIn]) => {
      if (checkIn.resolutionId === id) {
        this.checkIns.delete(checkInId);
      }
    });
    return this.resolutions.delete(id);
  }

  // Milestones
  async getMilestones(resolutionId: string): Promise<Milestone[]> {
    return Array.from(this.milestones.values()).filter(
      (m) => m.resolutionId === resolutionId
    );
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = randomUUID();
    const milestone: Milestone = { 
      ...insertMilestone, 
      id,
      completed: insertMilestone.completed ?? false,
      targetDate: insertMilestone.targetDate ?? null,
    };
    this.milestones.set(id, milestone);
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const existing = this.milestones.get(id);
    if (!existing) return undefined;
    
    const updated: Milestone = { ...existing, ...updates };
    this.milestones.set(id, updated);
    return updated;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    return this.milestones.delete(id);
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }

  // Check-ins
  async getCheckIns(userId: string): Promise<CheckIn[]> {
    // Get check-ins for resolutions owned by this user
    const userResolutionIds = new Set(
      Array.from(this.resolutions.values())
        .filter(r => r.userId === userId)
        .map(r => r.id)
    );
    return Array.from(this.checkIns.values()).filter(
      c => userResolutionIds.has(c.resolutionId)
    );
  }

  async getCheckInsByResolution(resolutionId: string): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values()).filter(
      (c) => c.resolutionId === resolutionId
    );
  }

  async getCheckIn(id: string): Promise<CheckIn | undefined> {
    return this.checkIns.get(id);
  }

  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = randomUUID();
    const checkIn: CheckIn = { ...insertCheckIn, id };
    this.checkIns.set(id, checkIn);
    return checkIn;
  }

  // AI Insights
  async getAiInsightsByCheckIn(checkInId: string): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).filter(
      (i) => i.checkInId === checkInId
    );
  }

  async createAiInsight(insertAiInsight: InsertAiInsight): Promise<AiInsight> {
    const id = randomUUID();
    const aiInsight: AiInsight = {
      ...insertAiInsight,
      id,
      suggestion: insertAiInsight.suggestion ?? null,
      sentiment: insertAiInsight.sentiment ?? null,
      createdAt: new Date(),
    };
    this.aiInsights.set(id, aiInsight);
    return aiInsight;
  }

  // AI Model Usage
  async getAiModelUsageByCheckIn(checkInId: string): Promise<AiModelUsage[]> {
    return Array.from(this.aiModelUsage.values()).filter(
      (u) => u.checkInId === checkInId
    );
  }

  async getAiModelUsageStats(filters?: {
    userId?: string;
    modelName?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AiModelUsage[]> {
    let results = Array.from(this.aiModelUsage.values());

    // Filter by userId (need to join with checkIns and resolutions)
    if (filters?.userId) {
      const userCheckInIds = new Set(
        Array.from(this.checkIns.values())
          .filter((c) => {
            const resolution = this.resolutions.get(c.resolutionId);
            return resolution?.userId === filters.userId;
          })
          .map((c) => c.id)
      );
      results = results.filter((u) => userCheckInIds.has(u.checkInId));
    }

    // Filter by model name
    if (filters?.modelName) {
      results = results.filter((u) => u.modelName === filters.modelName);
    }

    // Filter by provider
    if (filters?.provider) {
      results = results.filter((u) => u.provider === filters.provider);
    }

    // Filter by date range
    if (filters?.startDate) {
      results = results.filter((u) => u.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter((u) => u.createdAt <= filters.endDate!);
    }

    return results;
  }

  async createAiModelUsage(insertAiModelUsage: InsertAiModelUsage): Promise<AiModelUsage> {
    const id = randomUUID();
    const aiModelUsage: AiModelUsage = {
      ...insertAiModelUsage,
      id,
      errorMessage: insertAiModelUsage.errorMessage ?? null,
      createdAt: new Date(),
    };
    this.aiModelUsage.set(id, aiModelUsage);
    return aiModelUsage;
  }

  // Prompt Tests
  async getPromptTests(userId: string): Promise<PromptTest[]> {
    return Array.from(this.promptTests.values()).filter((t) => t.userId === userId);
  }

  async getPromptTest(id: string, userId: string): Promise<PromptTest | undefined> {
    const test = this.promptTests.get(id);
    if (test && test.userId === userId) {
      return test;
    }
    return undefined;
  }

  async createPromptTest(insertPromptTest: InsertPromptTest & { userId: string }): Promise<PromptTest> {
    const id = randomUUID();
    const promptTest: PromptTest = {
      ...insertPromptTest,
      id,
      systemPrompt: insertPromptTest.systemPrompt ?? null,
      category: insertPromptTest.category ?? null,
      createdAt: new Date(),
    };
    this.promptTests.set(id, promptTest);
    return promptTest;
  }

  async deletePromptTest(id: string, userId: string): Promise<boolean> {
    const test = this.promptTests.get(id);
    if (!test || test.userId !== userId) return false;

    // Also delete related results
    Array.from(this.promptTestResults.entries()).forEach(([resultId, result]) => {
      if (result.promptTestId === id) {
        this.promptTestResults.delete(resultId);
      }
    });

    return this.promptTests.delete(id);
  }

  // Prompt Test Results
  async getPromptTestResults(promptTestId: string): Promise<PromptTestResult[]> {
    return Array.from(this.promptTestResults.values()).filter(
      (r) => r.promptTestId === promptTestId
    );
  }

  async createPromptTestResult(insertResult: InsertPromptTestResult): Promise<PromptTestResult> {
    const id = randomUUID();
    const result: PromptTestResult = {
      ...insertResult,
      id,
      errorMessage: insertResult.errorMessage ?? null,
      userRating: insertResult.userRating ?? null,
      userComment: insertResult.userComment ?? null,
      createdAt: new Date(),
    };
    this.promptTestResults.set(id, result);
    return result;
  }

  async updatePromptTestResult(
    id: string,
    updates: { userRating?: number; userComment?: string }
  ): Promise<PromptTestResult | undefined> {
    const existing = this.promptTestResults.get(id);
    if (!existing) return undefined;

    const updated: PromptTestResult = {
      ...existing,
      userRating: updates.userRating !== undefined ? updates.userRating : existing.userRating,
      userComment: updates.userComment !== undefined ? updates.userComment : existing.userComment,
    };
    this.promptTestResults.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
