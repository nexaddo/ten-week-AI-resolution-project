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
  type TestCaseTemplate,
  type InsertTestCaseTemplate,
  type TestCaseConfiguration,
  type InsertTestCaseConfiguration,
  type ModelFavorite,
  type InsertModelFavorite,
  type ToolFavorite,
  type InsertToolFavorite,
  resolutions,
  milestones,
  checkIns,
  aiInsights,
  aiModelUsage,
  promptTests,
  promptTestResults,
  testCaseTemplates,
  testCaseConfigurations,
  modelFavorites,
  toolFavorites,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, gte, lte, inArray, or, isNull } from "drizzle-orm";

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

  // Test Case Templates
  getTestCaseTemplates(userId?: string): Promise<TestCaseTemplate[]>;
  getTestCaseTemplate(id: string): Promise<TestCaseTemplate | undefined>;
  createTestCaseTemplate(template: InsertTestCaseTemplate): Promise<TestCaseTemplate>;
  updateTestCaseTemplate(id: string, template: Partial<InsertTestCaseTemplate>, userId?: string): Promise<TestCaseTemplate | undefined>;
  deleteTestCaseTemplate(id: string, userId?: string): Promise<boolean>;

  // Test Case Configurations
  getTestCaseConfiguration(promptTestId: string): Promise<TestCaseConfiguration | undefined>;
  createTestCaseConfiguration(config: InsertTestCaseConfiguration): Promise<TestCaseConfiguration>;

  // Model Favorites
  getModelFavorites(userId: string): Promise<ModelFavorite[]>;
  createModelFavorite(favorite: InsertModelFavorite): Promise<ModelFavorite>;
  deleteModelFavorite(id: string, userId: string): Promise<boolean>;

  // Tool Favorites
  getToolFavorites(userId: string): Promise<ToolFavorite[]>;
  createToolFavorite(favorite: InsertToolFavorite): Promise<ToolFavorite>;
  deleteToolFavorite(id: string, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private resolutions: Map<string, Resolution>;
  private milestones: Map<string, Milestone>;
  private checkIns: Map<string, CheckIn>;
  private aiInsights: Map<string, AiInsight>;
  private aiModelUsage: Map<string, AiModelUsage>;
  private promptTests: Map<string, PromptTest>;
  private promptTestResults: Map<string, PromptTestResult>;
  private testCaseTemplates: Map<string, TestCaseTemplate>;
  private testCaseConfigurations: Map<string, TestCaseConfiguration>;
  private modelFavorites: Map<string, ModelFavorite>;
  private toolFavorites: Map<string, ToolFavorite>;

  constructor() {
    this.resolutions = new Map();
    this.milestones = new Map();
    this.checkIns = new Map();
    this.aiInsights = new Map();
    this.aiModelUsage = new Map();
    this.promptTests = new Map();
    this.promptTestResults = new Map();
    this.testCaseTemplates = new Map();
    this.testCaseConfigurations = new Map();
    this.modelFavorites = new Map();
    this.toolFavorites = new Map();
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

    // Debug logging
    console.log(`[AI Stats Debug] Total aiModelUsage entries: ${results.length}`);
    console.log(`[AI Stats Debug] Total checkIns: ${this.checkIns.size}`);
    console.log(`[AI Stats Debug] Total resolutions: ${this.resolutions.size}`);
    console.log(`[AI Stats Debug] Filter userId: ${filters?.userId}`);

    // Filter by userId (need to join with checkIns and resolutions)
    if (filters?.userId) {
      const userResolutions = Array.from(this.resolutions.values()).filter(r => r.userId === filters.userId);
      console.log(`[AI Stats Debug] User's resolutions: ${userResolutions.length}`);

      const userCheckInIds = new Set(
        Array.from(this.checkIns.values())
          .filter((c) => {
            const resolution = this.resolutions.get(c.resolutionId);
            return resolution?.userId === filters.userId;
          })
          .map((c) => c.id)
      );
      console.log(`[AI Stats Debug] User's checkIn IDs: ${Array.from(userCheckInIds).join(', ')}`);

      results = results.filter((u) => userCheckInIds.has(u.checkInId));
      console.log(`[AI Stats Debug] Filtered results: ${results.length}`);
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
      results = results.filter((u) => u.createdAt >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      results = results.filter((u) => u.createdAt <= new Date(filters.endDate!));
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

  // Test Case Templates
  async getTestCaseTemplates(userId?: string): Promise<TestCaseTemplate[]> {
    return Array.from(this.testCaseTemplates.values()).filter(
      t => t.isBuiltIn || t.userId === userId
    );
  }

  async getTestCaseTemplate(id: string): Promise<TestCaseTemplate | undefined> {
    return this.testCaseTemplates.get(id);
  }

  async createTestCaseTemplate(template: InsertTestCaseTemplate): Promise<TestCaseTemplate> {
    const id = randomUUID();
    const newTemplate: TestCaseTemplate = {
      ...template,
      id,
      createdAt: new Date(),
    };
    this.testCaseTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateTestCaseTemplate(
    id: string,
    template: Partial<InsertTestCaseTemplate>,
    userId?: string
  ): Promise<TestCaseTemplate | undefined> {
    const existing = this.testCaseTemplates.get(id);
    if (!existing) return undefined;
    if (!existing.isBuiltIn && existing.userId !== userId) return undefined;

    const updated: TestCaseTemplate = { ...existing, ...template };
    this.testCaseTemplates.set(id, updated);
    return updated;
  }

  async deleteTestCaseTemplate(id: string, userId?: string): Promise<boolean> {
    const existing = this.testCaseTemplates.get(id);
    if (!existing) return false;
    if (existing.isBuiltIn) return false; // Can't delete built-in templates
    if (existing.userId !== userId) return false;

    return this.testCaseTemplates.delete(id);
  }

  // Test Case Configurations
  async getTestCaseConfiguration(promptTestId: string): Promise<TestCaseConfiguration | undefined> {
    return Array.from(this.testCaseConfigurations.values()).find(
      c => c.promptTestId === promptTestId
    );
  }

  async createTestCaseConfiguration(config: InsertTestCaseConfiguration): Promise<TestCaseConfiguration> {
    const id = randomUUID();
    const newConfig: TestCaseConfiguration = {
      ...config,
      id,
      createdAt: new Date(),
    };
    this.testCaseConfigurations.set(id, newConfig);
    return newConfig;
  }

  // Model Favorites
  async getModelFavorites(userId: string): Promise<ModelFavorite[]> {
    return Array.from(this.modelFavorites.values()).filter(f => f.userId === userId);
  }

  async createModelFavorite(favorite: InsertModelFavorite): Promise<ModelFavorite> {
    const id = randomUUID();
    const newFavorite: ModelFavorite = {
      ...favorite,
      id,
      createdAt: new Date(),
    };
    this.modelFavorites.set(id, newFavorite);
    return newFavorite;
  }

  async deleteModelFavorite(id: string, userId: string): Promise<boolean> {
    const existing = this.modelFavorites.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.modelFavorites.delete(id);
  }

  // Tool Favorites
  async getToolFavorites(userId: string): Promise<ToolFavorite[]> {
    return Array.from(this.toolFavorites.values()).filter(f => f.userId === userId);
  }

  async createToolFavorite(favorite: InsertToolFavorite): Promise<ToolFavorite> {
    const id = randomUUID();
    const newFavorite: ToolFavorite = {
      ...favorite,
      id,
      createdAt: new Date(),
    };
    this.toolFavorites.set(id, newFavorite);
    return newFavorite;
  }

  async deleteToolFavorite(id: string, userId: string): Promise<boolean> {
    const existing = this.toolFavorites.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.toolFavorites.delete(id);
  }
}

// Database-backed storage implementation using Drizzle ORM
export class DbStorage implements IStorage {
  // Resolutions (user-scoped)
  async getResolutions(userId: string): Promise<Resolution[]> {
    return await db.select().from(resolutions).where(eq(resolutions.userId, userId));
  }

  async getResolution(id: string, userId: string): Promise<Resolution | undefined> {
    const [resolution] = await db
      .select()
      .from(resolutions)
      .where(and(eq(resolutions.id, id), eq(resolutions.userId, userId)));
    return resolution;
  }

  async createResolution(insertResolution: InsertResolution & { userId: string }): Promise<Resolution> {
    const [resolution] = await db
      .insert(resolutions)
      .values({
        ...insertResolution,
        progress: insertResolution.progress ?? 0,
        status: insertResolution.status ?? "not_started",
      })
      .returning();
    return resolution;
  }

  async updateResolution(id: string, updates: Partial<InsertResolution>, userId: string): Promise<Resolution | undefined> {
    const [updated] = await db
      .update(resolutions)
      .set(updates)
      .where(and(eq(resolutions.id, id), eq(resolutions.userId, userId)))
      .returning();
    return updated;
  }

  async deleteResolution(id: string, userId: string): Promise<boolean> {
    // First check if the resolution exists and belongs to the user
    const resolution = await this.getResolution(id, userId);
    if (!resolution) return false;

    // Delete related milestones
    await db.delete(milestones).where(eq(milestones.resolutionId, id));
    
    // Delete related check-ins and their AI insights/usage
    const relatedCheckIns = await db
      .select({ id: checkIns.id })
      .from(checkIns)
      .where(eq(checkIns.resolutionId, id));
    
    const checkInIds = relatedCheckIns.map(c => c.id);
    if (checkInIds.length > 0) {
      await db.delete(aiInsights).where(inArray(aiInsights.checkInId, checkInIds));
      await db.delete(aiModelUsage).where(inArray(aiModelUsage.checkInId, checkInIds));
      await db.delete(checkIns).where(eq(checkIns.resolutionId, id));
    }
    
    // Delete the resolution
    const [deleted] = await db.delete(resolutions).where(eq(resolutions.id, id)).returning();
    return deleted !== undefined;
  }

  // Milestones
  async getMilestones(resolutionId: string): Promise<Milestone[]> {
    return await db.select().from(milestones).where(eq(milestones.resolutionId, resolutionId));
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db
      .insert(milestones)
      .values({
        ...insertMilestone,
        completed: insertMilestone.completed ?? false,
      })
      .returning();
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const [updated] = await db
      .update(milestones)
      .set(updates)
      .where(eq(milestones.id, id))
      .returning();
    return updated;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const [deleted] = await db.delete(milestones).where(eq(milestones.id, id)).returning();
    return deleted !== undefined;
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone;
  }

  // Check-ins
  async getCheckIns(userId: string): Promise<CheckIn[]> {
    // Get check-ins for resolutions owned by this user
    const userResolutions = await db
      .select({ id: resolutions.id })
      .from(resolutions)
      .where(eq(resolutions.userId, userId));
    
    const resolutionIds = userResolutions.map(r => r.id);
    if (resolutionIds.length === 0) return [];
    
    return await db
      .select()
      .from(checkIns)
      .where(inArray(checkIns.resolutionId, resolutionIds));
  }

  async getCheckInsByResolution(resolutionId: string): Promise<CheckIn[]> {
    return await db.select().from(checkIns).where(eq(checkIns.resolutionId, resolutionId));
  }

  async getCheckIn(id: string): Promise<CheckIn | undefined> {
    const [checkIn] = await db.select().from(checkIns).where(eq(checkIns.id, id));
    return checkIn;
  }

  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values(insertCheckIn).returning();
    return checkIn;
  }

  // AI Insights
  async getAiInsightsByCheckIn(checkInId: string): Promise<AiInsight[]> {
    return await db.select().from(aiInsights).where(eq(aiInsights.checkInId, checkInId));
  }

  async createAiInsight(insertAiInsight: InsertAiInsight): Promise<AiInsight> {
    const [insight] = await db.insert(aiInsights).values(insertAiInsight).returning();
    return insight;
  }

  // AI Model Usage
  async getAiModelUsageByCheckIn(checkInId: string): Promise<AiModelUsage[]> {
    return await db.select().from(aiModelUsage).where(eq(aiModelUsage.checkInId, checkInId));
  }

  async getAiModelUsageStats(filters?: {
    userId?: string;
    modelName?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AiModelUsage[]> {
    let query = db.select().from(aiModelUsage);
    
    // Build conditions array
    const conditions = [];
    
    // Filter by userId (need to join with checkIns and resolutions)
    if (filters?.userId) {
      const userResolutions = await db
        .select({ id: resolutions.id })
        .from(resolutions)
        .where(eq(resolutions.userId, filters.userId));
      
      const resolutionIds = userResolutions.map(r => r.id);
      if (resolutionIds.length === 0) return [];
      
      const userCheckIns = await db
        .select({ id: checkIns.id })
        .from(checkIns)
        .where(inArray(checkIns.resolutionId, resolutionIds));
      
      const checkInIds = userCheckIns.map(c => c.id);
      if (checkInIds.length === 0) return [];
      
      conditions.push(inArray(aiModelUsage.checkInId, checkInIds));
    }
    
    // Filter by model name
    if (filters?.modelName) {
      conditions.push(eq(aiModelUsage.modelName, filters.modelName));
    }
    
    // Filter by provider
    if (filters?.provider) {
      conditions.push(eq(aiModelUsage.provider, filters.provider));
    }
    
    // Filter by date range
    if (filters?.startDate) {
      conditions.push(gte(aiModelUsage.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(aiModelUsage.createdAt, new Date(filters.endDate)));
    }
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  }

  async createAiModelUsage(insertAiModelUsage: InsertAiModelUsage): Promise<AiModelUsage> {
    const [usage] = await db.insert(aiModelUsage).values(insertAiModelUsage).returning();
    return usage;
  }

  // Prompt Tests
  async getPromptTests(userId: string): Promise<PromptTest[]> {
    return await db.select().from(promptTests).where(eq(promptTests.userId, userId));
  }

  async getPromptTest(id: string, userId: string): Promise<PromptTest | undefined> {
    const [test] = await db
      .select()
      .from(promptTests)
      .where(and(eq(promptTests.id, id), eq(promptTests.userId, userId)));
    return test;
  }

  async createPromptTest(insertPromptTest: InsertPromptTest & { userId: string }): Promise<PromptTest> {
    const [test] = await db.insert(promptTests).values(insertPromptTest).returning();
    return test;
  }

  async deletePromptTest(id: string, userId: string): Promise<boolean> {
    const test = await this.getPromptTest(id, userId);
    if (!test) return false;
    
    // Delete related results
    await db.delete(promptTestResults).where(eq(promptTestResults.promptTestId, id));
    
    // Delete the test
    const [deleted] = await db.delete(promptTests).where(eq(promptTests.id, id)).returning();
    return deleted !== undefined;
  }

  // Prompt Test Results
  async getPromptTestResults(promptTestId: string): Promise<PromptTestResult[]> {
    return await db
      .select()
      .from(promptTestResults)
      .where(eq(promptTestResults.promptTestId, promptTestId));
  }

  async createPromptTestResult(insertResult: InsertPromptTestResult): Promise<PromptTestResult> {
    const [result] = await db.insert(promptTestResults).values(insertResult).returning();
    return result;
  }

  async updatePromptTestResult(
    id: string,
    updates: { userRating?: number; userComment?: string }
  ): Promise<PromptTestResult | undefined> {
    const [updated] = await db
      .update(promptTestResults)
      .set(updates)
      .where(eq(promptTestResults.id, id))
      .returning();
    return updated;
  }

  // Test Case Templates
  async getTestCaseTemplates(userId?: string): Promise<TestCaseTemplate[]> {
    if (userId) {
      return await db
        .select()
        .from(testCaseTemplates)
        .where(
          // Get built-in templates or user's own templates
          or(
            eq(testCaseTemplates.isBuiltIn, true),
            eq(testCaseTemplates.userId, userId)
          )
        );
    }
    // Return only built-in templates if no userId provided
    return await db
      .select()
      .from(testCaseTemplates)
      .where(eq(testCaseTemplates.isBuiltIn, true));
  }

  async getTestCaseTemplate(id: string): Promise<TestCaseTemplate | undefined> {
    const [template] = await db
      .select()
      .from(testCaseTemplates)
      .where(eq(testCaseTemplates.id, id));
    return template;
  }

  async createTestCaseTemplate(insertTemplate: InsertTestCaseTemplate): Promise<TestCaseTemplate> {
    const [template] = await db.insert(testCaseTemplates).values(insertTemplate).returning();
    return template;
  }

  async updateTestCaseTemplate(
    id: string,
    template: Partial<InsertTestCaseTemplate>,
    userId?: string
  ): Promise<TestCaseTemplate | undefined> {
    // Check ownership before updating
    const existing = await this.getTestCaseTemplate(id);
    if (!existing) return undefined;
    if (existing.isBuiltIn) return undefined; // Can't update built-in templates
    if (userId && existing.userId !== userId) return undefined;

    const [updated] = await db
      .update(testCaseTemplates)
      .set(template)
      .where(eq(testCaseTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteTestCaseTemplate(id: string, userId?: string): Promise<boolean> {
    // Check ownership before deleting
    const existing = await this.getTestCaseTemplate(id);
    if (!existing) return false;
    if (existing.isBuiltIn) return false; // Can't delete built-in templates
    if (userId && existing.userId !== userId) return false;

    await db.delete(testCaseTemplates).where(eq(testCaseTemplates.id, id));
    return true;
  }

  // Test Case Configurations
  async getTestCaseConfiguration(promptTestId: string): Promise<TestCaseConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(testCaseConfigurations)
      .where(eq(testCaseConfigurations.promptTestId, promptTestId));
    return config;
  }

  async createTestCaseConfiguration(insertConfig: InsertTestCaseConfiguration): Promise<TestCaseConfiguration> {
    const [config] = await db.insert(testCaseConfigurations).values(insertConfig).returning();
    return config;
  }

  // Model Favorites
  async getModelFavorites(userId: string): Promise<ModelFavorite[]> {
    return await db
      .select()
      .from(modelFavorites)
      .where(eq(modelFavorites.userId, userId));
  }

  async createModelFavorite(insertFavorite: InsertModelFavorite): Promise<ModelFavorite> {
    const [favorite] = await db.insert(modelFavorites).values(insertFavorite).returning();
    return favorite;
  }

  async deleteModelFavorite(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(modelFavorites)
      .where(and(eq(modelFavorites.id, id), eq(modelFavorites.userId, userId)));
    return true;
  }

  // Tool Favorites
  async getToolFavorites(userId: string): Promise<ToolFavorite[]> {
    return await db
      .select()
      .from(toolFavorites)
      .where(eq(toolFavorites.userId, userId));
  }

  async createToolFavorite(insertFavorite: InsertToolFavorite): Promise<ToolFavorite> {
    const [favorite] = await db.insert(toolFavorites).values(insertFavorite).returning();
    return favorite;
  }

  async deleteToolFavorite(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(toolFavorites)
      .where(and(eq(toolFavorites.id, id), eq(toolFavorites.userId, userId)));
    return true;
  }
}

export const storage = new DbStorage();
