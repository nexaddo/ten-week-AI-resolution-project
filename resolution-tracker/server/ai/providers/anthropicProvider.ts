import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  AIAnalysisRequest,
  AIProviderResponse,
  AIAnalysisResult,
} from "../types";
import { buildAnalysisPrompt } from "../prompts";
import { calculateCost } from "../costCalculator";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = "claude-sonnet-4-5") {
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
    this.modelName = modelName;
  }

  getName(): string {
    return this.modelName;
  }

  getProvider(): string {
    return "anthropic";
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIProviderResponse> {
    if (!this.client) {
      throw new Error("Anthropic API key not configured");
    }

    const prompt = buildAnalysisPrompt(request);
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        tools: [
          {
            name: "analyze_check_in",
            description: "Analyze a check-in and provide insights",
            input_schema: {
              type: "object",
              properties: {
                insight: {
                  type: "string",
                  description: "A brief, encouraging analysis of their progress (2-3 sentences)",
                },
                suggestion: {
                  type: "string",
                  description: "One specific, actionable recommendation (1-2 sentences)",
                },
                sentiment: {
                  type: "string",
                  enum: ["positive", "neutral", "negative", "mixed"],
                  description: "The overall tone of the check-in",
                },
              },
              required: ["insight", "suggestion", "sentiment"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "analyze_check_in" },
      });

      const latencyMs = Date.now() - startTime;

      // Extract tool use result
      const toolUse = response.content.find((block) => block.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("No tool use found in response");
      }

      const result = toolUse.input as AIAnalysisResult;

      // Calculate cost
      const promptTokens = response.usage.input_tokens;
      const completionTokens = response.usage.output_tokens;
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
        provider: "anthropic",
        endpoint: "/v1/messages",
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      throw new Error(
        `Anthropic API error after ${latencyMs}ms: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
