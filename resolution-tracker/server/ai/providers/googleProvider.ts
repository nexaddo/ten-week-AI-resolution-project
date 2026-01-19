import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type {
  AIProvider,
  AIAnalysisRequest,
  AIProviderResponse,
  AIAnalysisResult,
} from "../types";
import { buildAnalysisPrompt } from "../prompts";
import { calculateCost } from "../costCalculator";

export class GoogleProvider implements AIProvider {
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = "gemini-pro") {
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
    this.modelName = modelName;
  }

  getName(): string {
    return this.modelName;
  }

  getProvider(): string {
    return "google";
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIProviderResponse> {
    if (!this.client) {
      throw new Error("Google AI API key not configured");
    }

    const prompt = buildAnalysisPrompt(request);
    const startTime = Date.now();

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              insight: {
                type: SchemaType.STRING,
                description: "A brief, encouraging analysis of their progress (2-3 sentences)",
              },
              suggestion: {
                type: SchemaType.STRING,
                description: "One specific, actionable recommendation (1-2 sentences)",
              },
              sentiment: {
                type: SchemaType.STRING,
                description: "The overall tone of the check-in: positive, neutral, negative, or mixed",
              },
            },
            required: ["insight", "suggestion", "sentiment"],
          },
        },
      });

      const response = await model.generateContent(prompt);
      const latencyMs = Date.now() - startTime;

      const text = response.response.text();
      const result = JSON.parse(text) as AIAnalysisResult;

      // Validate required fields
      if (!result.insight || !result.sentiment) {
        throw new Error("Missing required fields in response");
      }

      // Google doesn't always provide token counts, estimate based on text length
      // Rough estimate: ~4 characters per token
      const estimatedPromptTokens = Math.ceil(prompt.length / 4);
      const estimatedCompletionTokens = Math.ceil(text.length / 4);
      const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

      // Try to get actual token counts if available
      const promptTokens = response.response.usageMetadata?.promptTokenCount || estimatedPromptTokens;
      const completionTokens = response.response.usageMetadata?.candidatesTokenCount || estimatedCompletionTokens;

      const estimatedCost = calculateCost(this.modelName, promptTokens, completionTokens);

      return {
        result,
        metrics: {
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
          estimatedCost,
        },
        modelName: this.modelName,
        provider: "google",
        endpoint: "/v1beta/models/generateContent",
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      throw new Error(
        `Google AI error after ${latencyMs}ms: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
