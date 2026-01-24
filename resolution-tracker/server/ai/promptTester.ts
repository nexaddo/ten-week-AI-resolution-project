import type { IStorage } from "../storage";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateCost } from "./costCalculator";

interface PromptTestRequest {
  prompt: string;
  systemPrompt?: string;
  category?: string;
}

interface PromptTestModelResult {
  modelName: string;
  provider: string;
  output: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  estimatedCost: string;
  status: "success" | "error";
  errorMessage?: string;
}

export class PromptTester {
  private storage: IStorage;
  private providers: Map<string, { client: any; name: string; provider: string }>;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.providers = this.initializeProviders();
  }

  private initializeProviders() {
    const providers = new Map<string, { client: any; name: string; provider: string }>();

    // Initialize Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      providers.set("anthropic", {
        client: new Anthropic({ apiKey: anthropicKey }),
        name: "claude-sonnet-4-5",
        provider: "anthropic",
      });
    }

    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      providers.set("openai", {
        client: new OpenAI({ apiKey: openaiKey }),
        name: "gpt-4o",
        provider: "openai",
      });
    }

    // Initialize Google
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (googleKey) {
      providers.set("google", {
        client: new GoogleGenerativeAI(googleKey),
        name: "gemini-2.0-flash",
        provider: "google",
      });
    }

    return providers;
  }

  async testPrompt(
    promptTestId: string,
    request: PromptTestRequest,
    selectedModels?: string[]
  ): Promise<void> {
    // Filter providers based on selected models if provided
    let providersToTest = Array.from(this.providers.entries());
    
    if (selectedModels && selectedModels.length > 0) {
      providersToTest = providersToTest.filter(([key, config]) => 
        selectedModels.includes(config.name) || selectedModels.includes(key)
      );
    }

    // Run tests in parallel
    const testPromises = providersToTest.map(
      ([key, config]) => this.testWithProvider(promptTestId, key, config, request)
    );

    await Promise.allSettled(testPromises);
  }

  private async testWithProvider(
    promptTestId: string,
    providerKey: string,
    config: { client: any; name: string; provider: string },
    request: PromptTestRequest
  ): Promise<void> {
    const startTime = Date.now();

    try {
      let result: PromptTestModelResult;

      if (providerKey === "anthropic") {
        result = await this.testAnthropic(config, request, startTime);
      } else if (providerKey === "openai") {
        result = await this.testOpenAI(config, request, startTime);
      } else if (providerKey === "google") {
        result = await this.testGoogle(config, request, startTime);
      } else {
        throw new Error(`Unknown provider: ${providerKey}`);
      }

      // Store successful result
      await this.storage.createPromptTestResult({
        promptTestId,
        modelName: result.modelName,
        provider: result.provider,
        output: result.output,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        latencyMs: result.latencyMs,
        estimatedCost: result.estimatedCost,
        status: "success",
        errorMessage: null,
        userRating: null,
        userComment: null,
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Store failed result
      await this.storage.createPromptTestResult({
        promptTestId,
        modelName: config.name,
        provider: config.provider,
        output: "",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        estimatedCost: "0",
        status: "error",
        errorMessage,
        userRating: null,
        userComment: null,
      });
    }
  }

  private async testAnthropic(
    config: { client: Anthropic; name: string; provider: string },
    request: PromptTestRequest,
    startTime: number
  ): Promise<PromptTestModelResult> {
    const response = await config.client.messages.create({
      model: config.name,
      max_tokens: 2048,
      system: request.systemPrompt || undefined,
      messages: [{ role: "user", content: request.prompt }],
    });

    const output = response.content
      .filter((block) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    const promptTokens = response.usage.input_tokens;
    const completionTokens = response.usage.output_tokens;
    const totalTokens = promptTokens + completionTokens;
    const latencyMs = Date.now() - startTime;
    const estimatedCost = calculateCost(config.name, promptTokens, completionTokens);

    return {
      modelName: config.name,
      provider: config.provider,
      output,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      estimatedCost,
      status: "success",
    };
  }

  private async testOpenAI(
    config: { client: OpenAI; name: string; provider: string },
    request: PromptTestRequest,
    startTime: number
  ): Promise<PromptTestModelResult> {
    const messages: any[] = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    messages.push({ role: "user", content: request.prompt });

    const response = await config.client.chat.completions.create({
      model: config.name,
      messages,
      max_tokens: 2048,
    });

    const output = response.choices[0]?.message?.content || "";
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;
    const latencyMs = Date.now() - startTime;
    const estimatedCost = calculateCost(config.name, promptTokens, completionTokens);

    return {
      modelName: config.name,
      provider: config.provider,
      output,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      estimatedCost,
      status: "success",
    };
  }

  private async testGoogle(
    config: { client: GoogleGenerativeAI; name: string; provider: string },
    request: PromptTestRequest,
    startTime: number
  ): Promise<PromptTestModelResult> {
    const model = config.client.getGenerativeModel({ model: config.name });

    // Google doesn't have a separate system prompt, so prepend if provided
    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const response = await model.generateContent(fullPrompt);
    const output = response.response.text();

    // Google doesn't always provide token counts, estimate if needed
    const promptTokens = response.response.usageMetadata?.promptTokenCount || Math.ceil(fullPrompt.length / 4);
    const completionTokens = response.response.usageMetadata?.candidatesTokenCount || Math.ceil(output.length / 4);
    const totalTokens = promptTokens + completionTokens;
    const latencyMs = Date.now() - startTime;
    const estimatedCost = calculateCost(config.name, promptTokens, completionTokens);

    return {
      modelName: config.name,
      provider: config.provider,
      output,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      estimatedCost,
      status: "success",
    };
  }
}
