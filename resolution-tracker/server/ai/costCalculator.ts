// Cost calculation for different AI models
// Prices are per million tokens (MTok) in USD

interface ModelPricing {
  inputCostPerMTok: number;
  outputCostPerMTok: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic Claude
  "claude-sonnet-4": { inputCostPerMTok: 3, outputCostPerMTok: 15 },
  "claude-sonnet-4-5": { inputCostPerMTok: 3, outputCostPerMTok: 15 },
  "claude-opus-4": { inputCostPerMTok: 15, outputCostPerMTok: 75 },
  "claude-opus-4-5": { inputCostPerMTok: 15, outputCostPerMTok: 75 },
  "claude-3-5-sonnet-20241022": { inputCostPerMTok: 3, outputCostPerMTok: 15 },

  // OpenAI GPT
  "gpt-4": { inputCostPerMTok: 30, outputCostPerMTok: 60 },
  "gpt-4-turbo": { inputCostPerMTok: 10, outputCostPerMTok: 30 },
  "gpt-4-turbo-preview": { inputCostPerMTok: 10, outputCostPerMTok: 30 },
  "gpt-3.5-turbo": { inputCostPerMTok: 0.5, outputCostPerMTok: 1.5 },
  "gpt-4o": { inputCostPerMTok: 2.5, outputCostPerMTok: 10 },
  "gpt-4o-mini": { inputCostPerMTok: 0.15, outputCostPerMTok: 0.6 },

  // Google Gemini
  "gemini-1.5-pro": { inputCostPerMTok: 1.25, outputCostPerMTok: 5 },
  "gemini-1.5-flash": { inputCostPerMTok: 0.075, outputCostPerMTok: 0.3 },
};

export function calculateCost(
  modelName: string,
  promptTokens: number,
  completionTokens: number
): string {
  const pricing = MODEL_PRICING[modelName];

  if (!pricing) {
    // Default fallback pricing if model not found
    console.warn(`Unknown model pricing for ${modelName}, using default`);
    return "0.00";
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.inputCostPerMTok;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputCostPerMTok;
  const totalCost = inputCost + outputCost;

  // Return as string with 6 decimal places to avoid float precision issues
  return totalCost.toFixed(6);
}

export function getModelPricing(modelName: string): ModelPricing | null {
  return MODEL_PRICING[modelName] || null;
}
