import type { IStorage } from "../storage";
import type { AIAnalysisRequest, AIProvider, ModelSelectionStrategy } from "./types";
import { AnthropicProvider } from "./providers/anthropicProvider";
import { OpenAIProvider } from "./providers/openaiProvider";
import { GoogleProvider } from "./providers/googleProvider";

export class AIOrchestrator {
  private providers: Map<string, AIProvider>;
  private storage: IStorage;
  private rotationIndex: number = 0;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.providers = this.initializeProviders();
  }

  private initializeProviders(): Map<string, AIProvider> {
    const providers = new Map<string, AIProvider>();

    // Initialize Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      const anthropicProvider = new AnthropicProvider(anthropicKey);
      if (anthropicProvider.isAvailable()) {
        providers.set("anthropic", anthropicProvider);
        console.log("✓ Anthropic provider initialized");
      }
    }

    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const openaiProvider = new OpenAIProvider(openaiKey);
      if (openaiProvider.isAvailable()) {
        providers.set("openai", openaiProvider);
        console.log("✓ OpenAI provider initialized");
      }
    }

    // Initialize Google
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (googleKey) {
      const googleProvider = new GoogleProvider(googleKey);
      if (googleProvider.isAvailable()) {
        providers.set("google", googleProvider);
        console.log("✓ Google provider initialized");
      }
    }

    if (providers.size === 0) {
      console.warn(
        "⚠ No AI providers configured. Please set at least one API key: ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY"
      );
    }

    return providers;
  }

  private selectProviders(strategy: ModelSelectionStrategy): AIProvider[] {
    const availableProviders = Array.from(this.providers.values());

    if (availableProviders.length === 0) {
      return [];
    }

    switch (strategy) {
      case "all":
        return availableProviders;

      case "rotate":
        // Round-robin selection
        const provider = availableProviders[this.rotationIndex % availableProviders.length];
        this.rotationIndex++;
        return [provider];

      case "single":
        // Use default model or first available
        const defaultModel = process.env.AI_DEFAULT_MODEL || "anthropic";
        const selectedProvider = this.providers.get(defaultModel) || availableProviders[0];
        return [selectedProvider];

      default:
        return availableProviders;
    }
  }

  async analyzeCheckInAsync(
    checkInId: string,
    request: AIAnalysisRequest,
    strategy: ModelSelectionStrategy = "all"
  ): Promise<void> {
    // Run in background - don't block
    this.processAnalysis(checkInId, request, strategy).catch((err) =>
      console.error(`AI analysis failed for check-in ${checkInId}:`, err)
    );
  }

  private async processAnalysis(
    checkInId: string,
    request: AIAnalysisRequest,
    strategy: ModelSelectionStrategy
  ): Promise<void> {
    const providersToUse = this.selectProviders(strategy);

    if (providersToUse.length === 0) {
      console.log(`No AI providers available for check-in ${checkInId}`);
      return;
    }

    // Call providers in parallel for comparison
    const results = await Promise.allSettled(
      providersToUse.map((provider) => this.callProviderWithTracking(checkInId, provider, request))
    );

    // Log summary
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(
      `AI analysis for check-in ${checkInId}: ${succeeded} succeeded, ${failed} failed`
    );
  }

  private async callProviderWithTracking(
    checkInId: string,
    provider: AIProvider,
    request: AIAnalysisRequest
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await Promise.race([
        provider.analyze(request),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        ),
      ]);

      // Store insight
      await this.storage.createAiInsight({
        checkInId,
        modelName: response.modelName,
        insight: response.result.insight,
        suggestion: response.result.suggestion || null,
        sentiment: response.result.sentiment || null,
        createdAt: new Date().toISOString(),
      });

      // Store usage metrics
      await this.storage.createAiModelUsage({
        checkInId,
        modelName: response.modelName,
        provider: response.provider,
        endpoint: response.endpoint,
        promptTokens: response.metrics.promptTokens,
        completionTokens: response.metrics.completionTokens,
        totalTokens: response.metrics.totalTokens,
        latencyMs: response.metrics.latencyMs,
        estimatedCost: response.metrics.estimatedCost,
        status: "success",
        errorMessage: null,
        createdAt: new Date().toISOString(),
      });

      console.log(
        `✓ ${provider.getProvider()}/${provider.getName()} completed in ${response.metrics.latencyMs}ms (cost: $${response.metrics.estimatedCost})`
      );
    } catch (error) {
      // Track failures too
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.storage.createAiModelUsage({
        checkInId,
        modelName: provider.getName(),
        provider: provider.getProvider(),
        endpoint: "unknown",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        estimatedCost: "0",
        status: "error",
        errorMessage,
        createdAt: new Date().toISOString(),
      });

      console.error(
        `✗ ${provider.getProvider()}/${provider.getName()} failed after ${latencyMs}ms:`,
        errorMessage
      );

      throw error;
    }
  }
}
