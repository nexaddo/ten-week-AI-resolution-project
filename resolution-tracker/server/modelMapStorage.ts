import {
  type AiModel,
  type InsertAiModel,
  type AiTool,
  type InsertAiTool,
  type UserModel,
  type InsertUserModel,
  type UserTool,
  type InsertUserTool,
  type UseCase,
  type InsertUseCase,
  type UserUseCase,
  type InsertUserUseCase,
  type ModelTest,
  type InsertModelTest,
  type ModelTestResult,
  type InsertModelTestResult,
  type ModelRecommendation,
  type InsertModelRecommendation,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IModelMapStorage {
  // AI Models (global)
  getAiModels(): Promise<AiModel[]>;
  getAiModel(id: string): Promise<AiModel | undefined>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  updateAiModel(id: string, updates: Partial<InsertAiModel>): Promise<AiModel | undefined>;
  
  // AI Tools (global)
  getAiTools(): Promise<AiTool[]>;
  getAiTool(id: string): Promise<AiTool | undefined>;
  createAiTool(tool: InsertAiTool): Promise<AiTool>;
  updateAiTool(id: string, updates: Partial<InsertAiTool>): Promise<AiTool | undefined>;
  
  // User Models (user-scoped)
  getUserModels(userId: string): Promise<(UserModel & { model: AiModel })[]>;
  addUserModel(data: InsertUserModel): Promise<UserModel>;
  removeUserModel(userId: string, modelId: string): Promise<boolean>;
  
  // User Tools (user-scoped)
  getUserTools(userId: string): Promise<(UserTool & { tool: AiTool })[]>;
  addUserTool(data: InsertUserTool): Promise<UserTool>;
  removeUserTool(userId: string, toolId: string): Promise<boolean>;
  
  // Use Cases
  getUseCases(filters?: { category?: string; isCurated?: boolean; authorId?: string }): Promise<UseCase[]>;
  getUseCase(id: string): Promise<UseCase | undefined>;
  createUseCase(useCase: InsertUseCase): Promise<UseCase>;
  updateUseCase(id: string, updates: Partial<InsertUseCase>): Promise<UseCase | undefined>;
  deleteUseCase(id: string, authorId: string): Promise<boolean>;
  
  // User Use Cases (favorites)
  getUserUseCases(userId: string): Promise<(UserUseCase & { useCase: UseCase })[]>;
  addUserUseCase(data: InsertUserUseCase): Promise<UserUseCase>;
  removeUserUseCase(userId: string, useCaseId: string): Promise<boolean>;
  
  // Model Tests
  getModelTests(userId: string): Promise<ModelTest[]>;
  getModelTest(id: string, userId: string): Promise<ModelTest | undefined>;
  getModelTestById(id: string): Promise<ModelTest | undefined>;
  createModelTest(test: InsertModelTest & { userId: string }): Promise<ModelTest>;
  updateModelTest(id: string, updates: { status?: string }): Promise<ModelTest | undefined>;
  deleteModelTest(id: string, userId: string): Promise<boolean>;
  
  // Model Test Results
  getModelTestResults(testId: string): Promise<(ModelTestResult & { model: AiModel; tool: AiTool | null })[]>;
  createModelTestResult(result: InsertModelTestResult): Promise<ModelTestResult>;
  updateModelTestResult(id: string, updates: { userRating?: number; userNotes?: string }): Promise<ModelTestResult | undefined>;
  
  // Model Recommendations
  getUserRecommendations(userId: string): Promise<(ModelRecommendation & { model: AiModel })[]>;
  updateRecommendation(userId: string, category: string, modelId: string, rating: number): Promise<ModelRecommendation>;
}

export class ModelMapMemStorage implements IModelMapStorage {
  private aiModels: Map<string, AiModel> = new Map();
  private aiTools: Map<string, AiTool> = new Map();
  private userModels: Map<string, UserModel> = new Map();
  private userTools: Map<string, UserTool> = new Map();
  private useCases: Map<string, UseCase> = new Map();
  private userUseCases: Map<string, UserUseCase> = new Map();
  private modelTests: Map<string, ModelTest> = new Map();
  private modelTestResults: Map<string, ModelTestResult> = new Map();
  private modelRecommendations: Map<string, ModelRecommendation> = new Map();

  constructor() {
    this.seedDefaultModels();
    this.seedDefaultTools();
    this.seedDefaultUseCases();
  }

  private seedDefaultModels() {
    const defaultModels: Omit<AiModel, "id" | "createdAt">[] = [
      { name: "Claude 4.5 Sonnet", shortName: "C4", provider: "Anthropic", modelId: "claude-sonnet-4-20250514", description: "Fast, intelligent model for everyday tasks", capabilities: ["text", "code", "vision"], isFavorite: true, isActive: true },
      { name: "Claude Opus 4.5", shortName: "CO", provider: "Anthropic", modelId: "claude-opus-4-20250514", description: "Most capable model for complex tasks", capabilities: ["text", "code", "vision"], isFavorite: false, isActive: true },
      { name: "GPT-4o", shortName: "4O", provider: "OpenAI", modelId: "gpt-4o", description: "OpenAI's flagship multimodal model", capabilities: ["text", "code", "vision", "audio"], isFavorite: true, isActive: true },
      { name: "GPT-4 Turbo", shortName: "4T", provider: "OpenAI", modelId: "gpt-4-turbo", description: "Fast GPT-4 with vision capabilities", capabilities: ["text", "code", "vision"], isFavorite: false, isActive: true },
      { name: "Gemini 2.5 Pro", shortName: "G2P", provider: "Google", modelId: "gemini-2.5-pro", description: "Google's most capable model", capabilities: ["text", "code", "vision"], isFavorite: false, isActive: true },
      { name: "Gemini 2.5 Flash", shortName: "G2F", provider: "Google", modelId: "gemini-2.5-flash", description: "Fast and efficient model", capabilities: ["text", "code", "vision"], isFavorite: false, isActive: true },
      { name: "DeepSeek v3.2", shortName: "DV", provider: "DeepSeek", modelId: "deepseek-chat", description: "Cost-effective reasoning model", capabilities: ["text", "code"], isFavorite: false, isActive: true },
      { name: "o1", shortName: "O1", provider: "OpenAI", modelId: "o1", description: "OpenAI reasoning model", capabilities: ["text", "code"], isFavorite: false, isActive: true },
      { name: "o3-mini", shortName: "O3", provider: "OpenAI", modelId: "o3-mini", description: "Efficient reasoning model", capabilities: ["text", "code"], isFavorite: false, isActive: true },
    ];

    defaultModels.forEach((model) => {
      const id = randomUUID();
      this.aiModels.set(id, { ...model, id, createdAt: new Date() });
    });
  }

  private seedDefaultTools() {
    const defaultTools: Omit<AiTool, "id" | "createdAt">[] = [
      { name: "Cursor", shortName: "CU", provider: "Cursor", description: "AI-powered code editor", url: "https://cursor.sh", category: "IDE", isActive: true },
      { name: "GitHub Copilot", shortName: "CP", provider: "GitHub", description: "AI pair programmer", url: "https://github.com/features/copilot", category: "IDE", isActive: true },
      { name: "v0", shortName: "V0", provider: "Vercel", description: "AI UI component generator", url: "https://v0.dev", category: "Code Gen", isActive: true },
      { name: "Bolt", shortName: "BL", provider: "StackBlitz", description: "AI full-stack app builder", url: "https://bolt.new", category: "Code Gen", isActive: true },
      { name: "Midjourney", shortName: "MJ", provider: "Midjourney", description: "AI image generation", url: "https://midjourney.com", category: "Design", isActive: true },
      { name: "DALL-E 3", shortName: "DE", provider: "OpenAI", description: "AI image generation", url: "https://openai.com/dall-e-3", category: "Design", isActive: true },
      { name: "Eleven v3", shortName: "EV", provider: "ElevenLabs", description: "AI voice synthesis", url: "https://elevenlabs.io", category: "Audio", isActive: true },
      { name: "Perplexity", shortName: "PX", provider: "Perplexity", description: "AI search and research", url: "https://perplexity.ai", category: "Research", isActive: true },
    ];

    defaultTools.forEach((tool) => {
      const id = randomUUID();
      this.aiTools.set(id, { ...tool, id, createdAt: new Date() });
    });
  }

  private seedDefaultUseCases() {
    const defaultUseCases: Omit<UseCase, "id" | "createdAt" | "updatedAt">[] = [
      {
        title: "Earnings Call Translation",
        description: "Read between the lines of corporate communication. Tests the model's ability to identify hedging language, risk signals, and forward-looking statements.",
        category: "Strategic Analysis",
        promptTemplate: `Analyze the following earnings call transcript excerpt:

[PASTE TRANSCRIPT]

Please identify:
1. Hedging language or uncertainty signals
2. Forward-looking statements and their confidence level
3. Key risk factors mentioned or implied
4. Changes in tone compared to previous guidance
5. What management is NOT saying that might be important`,
        variables: ["PASTE TRANSCRIPT"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Competitive Landscape Brief",
        description: "Synthesize recent competitor announcements, earnings reports, or product updates into a sharp 1-page strategic brief.",
        category: "Strategic Analysis",
        promptTemplate: `Create a competitive landscape brief based on the following information about [COMPANY/INDUSTRY]:

[PASTE RECENT NEWS, ANNOUNCEMENTS, OR DATA]

Structure your brief as:
1. Executive Summary (2-3 sentences)
2. Key Competitive Moves (bullet points)
3. Market Positioning Changes
4. Threats to Watch
5. Opportunities Identified
6. Recommended Actions`,
        variables: ["COMPANY/INDUSTRY", "PASTE RECENT NEWS, ANNOUNCEMENTS, OR DATA"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Trend Skepticism Check",
        description: "Present a popular take or emerging trend. Ask the model to steelman the opposition, identify cracks in the thesis, and surface overlooked risks.",
        category: "Strategic Analysis",
        promptTemplate: `The following trend/thesis is widely accepted:

[DESCRIBE THE TREND OR THESIS]

Please provide:
1. The strongest arguments AGAINST this thesis (steelman the opposition)
2. Cracks or weaknesses in the underlying assumptions
3. Overlooked risks or second-order effects
4. Historical parallels where similar thinking was wrong
5. What would need to be true for this thesis to fail?`,
        variables: ["DESCRIBE THE TREND OR THESIS"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "LinkedIn Post with Constraints",
        description: "Test if the model can follow specific formatting rules (character limit, no emojis, plain language) while maintaining engagement and message clarity.",
        category: "Writing",
        promptTemplate: `Write a LinkedIn post about:

[TOPIC]

Constraints:
- Maximum 1,300 characters
- No emojis
- Plain language (no jargon)
- Must include a hook in the first line
- End with a question or call to action
- Avoid clichés like "game-changer" or "excited to announce"`,
        variables: ["TOPIC"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Email Thread Untangling",
        description: "Paste a real email thread (remove sensitive info). Ask the model to extract decisions made, action items, and subtle tensions.",
        category: "Writing",
        promptTemplate: `Here is a work email thread (cleaned of sensitive info):

[PASTE THE EMAIL THREAD]

Please analyze this thread and extract:
1. Decisions made (explicit or implicit)
2. Action items and who owns them
3. Any tensions, misalignments, or passive-aggression between participants
4. Your recommendation for what the next message should accomplish

Be specific. Quote the thread where relevant.`,
        variables: ["PASTE THE EMAIL THREAD"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Podcast Episode Outline",
        description: "Describe a topic and target length. Ask the model to generate a structured podcast outline including segment timing.",
        category: "Writing",
        promptTemplate: `Create a podcast episode outline for:

Topic: [TOPIC]
Target Length: [DURATION, e.g., 45 minutes]
Audience: [TARGET AUDIENCE]
Tone: [CASUAL/PROFESSIONAL/EDUCATIONAL]

Include:
1. Cold open hook (30 seconds)
2. Introduction segment with timing
3. Main segments with bullet points and suggested duration
4. Transition language between segments
5. Closing and call-to-action
6. Potential guest questions if applicable`,
        variables: ["TOPIC", "DURATION, e.g., 45 minutes", "TARGET AUDIENCE", "CASUAL/PROFESSIONAL/EDUCATIONAL"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Code Review Buddy",
        description: "Paste a code snippet and ask for a thorough review covering bugs, performance, security, and style.",
        category: "Code",
        promptTemplate: `Please review the following code:

\`\`\`[LANGUAGE]
[PASTE CODE]
\`\`\`

Provide feedback on:
1. Potential bugs or edge cases
2. Performance issues or optimization opportunities
3. Security vulnerabilities
4. Code style and readability
5. Suggested improvements with code examples
6. Overall assessment (scale 1-10 with justification)`,
        variables: ["LANGUAGE", "PASTE CODE"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Regex Generator & Explainer",
        description: "Describe a pattern you need to match. Ask the model to generate the regex and explain each component.",
        category: "Code",
        promptTemplate: `I need a regular expression that matches:

[DESCRIBE WHAT YOU WANT TO MATCH]

Examples that should match:
[LIST EXAMPLES]

Examples that should NOT match:
[LIST NON-MATCHING EXAMPLES]

Please provide:
1. The regex pattern
2. Line-by-line explanation of each component
3. Test cases with expected results
4. Edge cases to be aware of
5. Alternative approaches if applicable`,
        variables: ["DESCRIBE WHAT YOU WANT TO MATCH", "LIST EXAMPLES", "LIST NON-MATCHING EXAMPLES"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "API Documentation Generator",
        description: "Provide function signatures or endpoint specs. Ask the model to generate comprehensive documentation.",
        category: "Code",
        promptTemplate: `Generate API documentation for the following:

\`\`\`
[PASTE FUNCTION SIGNATURES OR ENDPOINT SPECS]
\`\`\`

Include:
1. Overview/purpose
2. Parameters/arguments with types and descriptions
3. Return values
4. Example usage (with code)
5. Error cases and how to handle them
6. Related endpoints/functions
7. Rate limits or performance considerations (if applicable)`,
        variables: ["PASTE FUNCTION SIGNATURES OR ENDPOINT SPECS"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Research Paper Summarizer",
        description: "Paste an abstract or paper excerpt. Ask the model to summarize findings, methodology, and implications.",
        category: "Research",
        promptTemplate: `Summarize the following research:

[PASTE ABSTRACT OR PAPER EXCERPT]

Provide:
1. Key findings in plain language (2-3 sentences)
2. Methodology overview
3. Main limitations acknowledged
4. Practical implications
5. Questions this raises for future research
6. How this connects to [RELEVANT FIELD/YOUR INTEREST]`,
        variables: ["PASTE ABSTRACT OR PAPER EXCERPT", "RELEVANT FIELD/YOUR INTEREST"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
      {
        title: "Meeting Notes to Action Items",
        description: "Paste messy meeting notes. Ask the model to extract structured action items with owners and deadlines.",
        category: "Automation",
        promptTemplate: `Convert these meeting notes into structured action items:

[PASTE MEETING NOTES]

Output format:
1. Meeting Summary (2-3 sentences)
2. Key Decisions Made
3. Action Items Table:
   | Action | Owner | Deadline | Priority | Dependencies |
4. Open Questions/Parking Lot
5. Next Meeting Topics`,
        variables: ["PASTE MEETING NOTES"],
        isCurated: true,
        authorId: null,
        isPublic: true,
      },
    ];

    defaultUseCases.forEach((useCase) => {
      const id = randomUUID();
      const now = new Date();
      this.useCases.set(id, { ...useCase, id, createdAt: now, updatedAt: now });
    });
  }

  // AI Models
  async getAiModels(): Promise<AiModel[]> {
    return Array.from(this.aiModels.values()).filter(m => m.isActive);
  }

  async getAiModel(id: string): Promise<AiModel | undefined> {
    return this.aiModels.get(id);
  }

  async createAiModel(model: InsertAiModel): Promise<AiModel> {
    const id = randomUUID();
    const aiModel: AiModel = {
      ...model,
      id,
      shortName: model.shortName ?? null,
      description: model.description ?? null,
      capabilities: model.capabilities ?? null,
      isFavorite: model.isFavorite ?? false,
      isActive: model.isActive ?? true,
      createdAt: new Date(),
    };
    this.aiModels.set(id, aiModel);
    return aiModel;
  }

  async updateAiModel(id: string, updates: Partial<InsertAiModel>): Promise<AiModel | undefined> {
    const existing = this.aiModels.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.aiModels.set(id, updated);
    return updated;
  }

  // AI Tools
  async getAiTools(): Promise<AiTool[]> {
    return Array.from(this.aiTools.values()).filter(t => t.isActive);
  }

  async getAiTool(id: string): Promise<AiTool | undefined> {
    return this.aiTools.get(id);
  }

  async createAiTool(tool: InsertAiTool): Promise<AiTool> {
    const id = randomUUID();
    const aiTool: AiTool = {
      ...tool,
      id,
      shortName: tool.shortName ?? null,
      description: tool.description ?? null,
      url: tool.url ?? null,
      category: tool.category ?? null,
      isActive: tool.isActive ?? true,
      createdAt: new Date(),
    };
    this.aiTools.set(id, aiTool);
    return aiTool;
  }

  async updateAiTool(id: string, updates: Partial<InsertAiTool>): Promise<AiTool | undefined> {
    const existing = this.aiTools.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.aiTools.set(id, updated);
    return updated;
  }

  // User Models
  async getUserModels(userId: string): Promise<(UserModel & { model: AiModel })[]> {
    const userModels = Array.from(this.userModels.values()).filter(um => um.userId === userId);
    return userModels.map(um => {
      const model = this.aiModels.get(um.modelId)!;
      return { ...um, model };
    }).filter(um => um.model);
  }

  async addUserModel(data: InsertUserModel): Promise<UserModel> {
    // Check if already exists
    const existing = Array.from(this.userModels.values()).find(
      um => um.userId === data.userId && um.modelId === data.modelId
    );
    if (existing) return existing;

    const id = randomUUID();
    const userModel: UserModel = {
      ...data,
      id,
      notes: data.notes ?? null,
      createdAt: new Date(),
    };
    this.userModels.set(id, userModel);
    return userModel;
  }

  async removeUserModel(userId: string, modelId: string): Promise<boolean> {
    const entry = Array.from(this.userModels.entries()).find(
      ([_, um]) => um.userId === userId && um.modelId === modelId
    );
    if (!entry) return false;
    return this.userModels.delete(entry[0]);
  }

  // User Tools
  async getUserTools(userId: string): Promise<(UserTool & { tool: AiTool })[]> {
    const userTools = Array.from(this.userTools.values()).filter(ut => ut.userId === userId);
    return userTools.map(ut => {
      const tool = this.aiTools.get(ut.toolId)!;
      return { ...ut, tool };
    }).filter(ut => ut.tool);
  }

  async addUserTool(data: InsertUserTool): Promise<UserTool> {
    const existing = Array.from(this.userTools.values()).find(
      ut => ut.userId === data.userId && ut.toolId === data.toolId
    );
    if (existing) return existing;

    const id = randomUUID();
    const userTool: UserTool = {
      ...data,
      id,
      notes: data.notes ?? null,
      createdAt: new Date(),
    };
    this.userTools.set(id, userTool);
    return userTool;
  }

  async removeUserTool(userId: string, toolId: string): Promise<boolean> {
    const entry = Array.from(this.userTools.entries()).find(
      ([_, ut]) => ut.userId === userId && ut.toolId === toolId
    );
    if (!entry) return false;
    return this.userTools.delete(entry[0]);
  }

  // Use Cases
  async getUseCases(filters?: { category?: string; isCurated?: boolean; authorId?: string }): Promise<UseCase[]> {
    let useCases = Array.from(this.useCases.values());
    if (filters?.category) {
      useCases = useCases.filter(uc => uc.category === filters.category);
    }
    if (filters?.isCurated !== undefined) {
      useCases = useCases.filter(uc => uc.isCurated === filters.isCurated);
    }
    if (filters?.authorId) {
      useCases = useCases.filter(uc => uc.authorId === filters.authorId);
    }
    return useCases;
  }

  async getUseCase(id: string): Promise<UseCase | undefined> {
    return this.useCases.get(id);
  }

  async createUseCase(useCase: InsertUseCase): Promise<UseCase> {
    const id = randomUUID();
    const now = new Date();
    const newUseCase: UseCase = {
      ...useCase,
      id,
      description: useCase.description,
      variables: useCase.variables ?? null,
      isCurated: useCase.isCurated ?? false,
      authorId: useCase.authorId ?? null,
      isPublic: useCase.isPublic ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.useCases.set(id, newUseCase);
    return newUseCase;
  }

  async updateUseCase(id: string, updates: Partial<InsertUseCase>): Promise<UseCase | undefined> {
    const existing = this.useCases.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.useCases.set(id, updated);
    return updated;
  }

  async deleteUseCase(id: string, authorId: string): Promise<boolean> {
    const useCase = this.useCases.get(id);
    if (!useCase || useCase.authorId !== authorId) return false;
    return this.useCases.delete(id);
  }

  // User Use Cases (favorites)
  async getUserUseCases(userId: string): Promise<(UserUseCase & { useCase: UseCase })[]> {
    const userUseCases = Array.from(this.userUseCases.values()).filter(uuc => uuc.userId === userId);
    return userUseCases.map(uuc => {
      const useCase = this.useCases.get(uuc.useCaseId)!;
      return { ...uuc, useCase };
    }).filter(uuc => uuc.useCase);
  }

  async addUserUseCase(data: InsertUserUseCase): Promise<UserUseCase> {
    const existing = Array.from(this.userUseCases.values()).find(
      uuc => uuc.userId === data.userId && uuc.useCaseId === data.useCaseId
    );
    if (existing) return existing;

    const id = randomUUID();
    const userUseCase: UserUseCase = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.userUseCases.set(id, userUseCase);
    return userUseCase;
  }

  async removeUserUseCase(userId: string, useCaseId: string): Promise<boolean> {
    const entry = Array.from(this.userUseCases.entries()).find(
      ([_, uuc]) => uuc.userId === userId && uuc.useCaseId === useCaseId
    );
    if (!entry) return false;
    return this.userUseCases.delete(entry[0]);
  }

  // Model Tests
  async getModelTests(userId: string): Promise<ModelTest[]> {
    return Array.from(this.modelTests.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getModelTest(id: string, userId: string): Promise<ModelTest | undefined> {
    const test = this.modelTests.get(id);
    if (test && test.userId === userId) return test;
    return undefined;
  }

  async getModelTestById(id: string): Promise<ModelTest | undefined> {
    return this.modelTests.get(id);
  }

  async createModelTest(test: InsertModelTest & { userId: string }): Promise<ModelTest> {
    const id = randomUUID();
    const modelTest: ModelTest = {
      ...test,
      id,
      useCaseId: test.useCaseId ?? null,
      systemPrompt: test.systemPrompt ?? null,
      status: test.status ?? "pending",
      createdAt: new Date(),
    };
    this.modelTests.set(id, modelTest);
    return modelTest;
  }

  async updateModelTest(id: string, updates: { status?: string }): Promise<ModelTest | undefined> {
    const existing = this.modelTests.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.modelTests.set(id, updated);
    return updated;
  }

  async deleteModelTest(id: string, userId: string): Promise<boolean> {
    const test = this.modelTests.get(id);
    if (!test || test.userId !== userId) return false;
    
    // Delete related results
    Array.from(this.modelTestResults.entries()).forEach(([resultId, result]) => {
      if (result.testId === id) {
        this.modelTestResults.delete(resultId);
      }
    });
    
    return this.modelTests.delete(id);
  }

  // Model Test Results
  async getModelTestResults(testId: string): Promise<(ModelTestResult & { model: AiModel; tool: AiTool | null })[]> {
    const results = Array.from(this.modelTestResults.values()).filter(r => r.testId === testId);
    return results
      .map(r => {
        const model = this.aiModels.get(r.modelId);
        if (!model) return undefined;
        const tool = r.toolId ? this.aiTools.get(r.toolId) ?? null : null;
        return { ...r, model, tool };
      })
      .filter((r): r is ModelTestResult & { model: AiModel; tool: AiTool | null } => r !== undefined);
  }

  async createModelTestResult(result: InsertModelTestResult): Promise<ModelTestResult> {
    const id = randomUUID();
    const testResult: ModelTestResult = {
      ...result,
      id,
      toolId: result.toolId ?? null,
      output: result.output ?? null,
      promptTokens: result.promptTokens ?? null,
      completionTokens: result.completionTokens ?? null,
      totalTokens: result.totalTokens ?? null,
      latencyMs: result.latencyMs ?? null,
      estimatedCost: result.estimatedCost ?? null,
      errorMessage: result.errorMessage ?? null,
      userRating: result.userRating ?? null,
      accuracyRating: result.accuracyRating ?? null,
      styleRating: result.styleRating ?? null,
      speedRating: result.speedRating ?? null,
      xFactor: result.xFactor ?? null,
      userNotes: result.userNotes ?? null,
      status: result.status ?? "pending",
      createdAt: new Date(),
    };
    this.modelTestResults.set(id, testResult);
    return testResult;
  }

  async updateModelTestResult(
    id: string,
    updates: {
      userRating?: number;
      userNotes?: string;
      accuracyRating?: number;
      styleRating?: number;
      speedRating?: string;
      xFactor?: number;
      status?: string;
    }
  ): Promise<ModelTestResult | undefined> {
    const existing = this.modelTestResults.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      userRating: updates.userRating !== undefined ? updates.userRating : existing.userRating,
      userNotes: updates.userNotes !== undefined ? updates.userNotes : existing.userNotes,
      accuracyRating: updates.accuracyRating !== undefined ? updates.accuracyRating : existing.accuracyRating,
      styleRating: updates.styleRating !== undefined ? updates.styleRating : existing.styleRating,
      speedRating: updates.speedRating !== undefined ? updates.speedRating : existing.speedRating,
      xFactor: updates.xFactor !== undefined ? updates.xFactor : existing.xFactor,
      status: updates.status !== undefined ? updates.status : existing.status,
    };
    this.modelTestResults.set(id, updated);
    return updated;
  }

  // Model Recommendations
  async getUserRecommendations(userId: string): Promise<(ModelRecommendation & { model: AiModel })[]> {
    const recs = Array.from(this.modelRecommendations.values()).filter(r => r.userId === userId);
    return recs.map(r => {
      const model = this.aiModels.get(r.recommendedModelId)!;
      return { ...r, model };
    }).filter(r => r.model);
  }

  async updateRecommendation(userId: string, category: string, modelId: string, rating: number): Promise<ModelRecommendation> {
    const existing = Array.from(this.modelRecommendations.entries()).find(
      ([_, r]) => r.userId === userId && r.category === category
    );

    if (existing) {
      const [id, rec] = existing;
      const totalRating = (rec.avgRating || 0) * rec.totalTests + rating;
      const newTotal = rec.totalTests + 1;
      const updated: ModelRecommendation = {
        ...rec,
        recommendedModelId: modelId,
        avgRating: Math.round(totalRating / newTotal),
        totalTests: newTotal,
        updatedAt: new Date(),
      };
      this.modelRecommendations.set(id, updated);
      return updated;
    }

    const id = randomUUID();
    const newRec: ModelRecommendation = {
      id,
      userId,
      category,
      recommendedModelId: modelId,
      avgRating: rating,
      totalTests: 1,
      notes: null,
      updatedAt: new Date(),
    };
    this.modelRecommendations.set(id, newRec);
    return newRec;
  }
}

export const modelMapStorage = new ModelMapMemStorage();
