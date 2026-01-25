/**
 * Available AI models and tools for the prompt playground
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: "anthropic" | "openai" | "google";
  description: string;
  strengths: string[];
  costTier: "low" | "medium" | "high";
}

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    description: "Balanced performance for complex tasks",
    strengths: ["Code generation", "Analysis", "Creative writing"],
    costTier: "medium",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Fast, multimodal flagship model",
    strengths: ["General purpose", "Reasoning", "Code"],
    costTier: "medium",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Fast, cost-effective model",
    strengths: ["Speed", "Efficiency", "General tasks"],
    costTier: "low",
  },
];

export const AVAILABLE_TOOLS: ToolInfo[] = [
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for up-to-date information",
    category: "research",
  },
  {
    id: "code_interpreter",
    name: "Code Interpreter",
    description: "Execute and test code snippets",
    category: "coding",
  },
  {
    id: "file_analysis",
    name: "File Analysis",
    description: "Analyze and process files",
    category: "analysis",
  },
];

export function getModelById(id: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id);
}

export function getToolById(id: string): ToolInfo | undefined {
  return AVAILABLE_TOOLS.find(t => t.id === id);
}

export function getProviderColor(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "bg-orange-500";
    case "openai":
      return "bg-green-500";
    case "google":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}
