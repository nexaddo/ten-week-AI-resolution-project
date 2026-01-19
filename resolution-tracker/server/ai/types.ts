// Core types for AI analysis service

export interface AIAnalysisRequest {
  checkInNote: string;
  resolutionContext: {
    title: string;
    description: string | null;
    category: string;
    currentProgress: number;
    targetDate: string | null;
  };
  historicalCheckIns?: Array<{ note: string; date: string }>;
}

export interface AIAnalysisResult {
  insight: string;
  suggestion: string | null;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
}

export interface ModelMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  estimatedCost: string;
}

export interface AIProviderResponse {
  result: AIAnalysisResult;
  metrics: ModelMetrics;
  modelName: string;
  provider: string;
  endpoint: string;
}

export interface AIProvider {
  analyze(request: AIAnalysisRequest): Promise<AIProviderResponse>;
  getName(): string;
  getProvider(): string;
  isAvailable(): boolean;
}

export type ModelSelectionStrategy = "all" | "rotate" | "single";
