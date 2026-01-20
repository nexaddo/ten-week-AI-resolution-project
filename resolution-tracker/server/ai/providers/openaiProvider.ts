import OpenAI from "openai";
import type {
  AIProvider,
  AIAnalysisRequest,
  AIProviderResponse,
  AIAnalysisResult,
} from "../types";
import { buildAnalysisPrompt } from "../prompts";
import { calculateCost } from "../costCalculator";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = "gpt-4o") {
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
    this.modelName = modelName;
  }

  getName(): string {
    return this.modelName;
  }

  getProvider(): string {
    return "openai";
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIProviderResponse> {
    if (!this.client) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = buildAnalysisPrompt(request);
    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI coach analyzing progress check-ins. Respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const latencyMs = Date.now() - startTime;

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }

      // Parse JSON response
      const result = JSON.parse(content) as AIAnalysisResult;

      // Validate required fields
      if (!result.insight || !result.sentiment) {
        throw new Error("Missing required fields in response");
      }

      // Calculate cost
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
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
        provider: "openai",
        endpoint: "/v1/chat/completions",
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      throw new Error(
        `OpenAI API error after ${latencyMs}ms: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
