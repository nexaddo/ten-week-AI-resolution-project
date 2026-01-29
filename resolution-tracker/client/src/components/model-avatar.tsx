import { cn } from "@/lib/utils";

interface ModelAvatarProps {
  name: string;
  shortName?: string | null;
  provider: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Generate a short name from the model/tool name if not provided
function generateShortName(name: string): string {
  // Handle common patterns
  const words = name.split(/[\s-]+/);

  // If it's a version number like "4.5" or "v3.2", include it
  const versionMatch = name.match(/(\d+\.?\d*)/);
  const version = versionMatch ? versionMatch[1].replace(".", "") : "";

  if (words.length === 1) {
    // Single word: take first 2 letters + version digit
    return (words[0].substring(0, 2) + (version ? version[0] : "")).toUpperCase();
  }

  // Multiple words: take first letter of first two words
  const initials = words
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return initials.toUpperCase();
}

// Provider color mapping
const providerColors: Record<string, { bg: string; text: string }> = {
  anthropic: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  openai: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  google: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  deepseek: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  cursor: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  stackblitz: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  elevenlabs: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  gamma: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  genspark: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  ideogram: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
};

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

export function ModelAvatar({ name, shortName, provider, size = "md", className }: ModelAvatarProps) {
  const displayName = shortName || generateShortName(name);
  const normalizedProvider = provider.toLowerCase();
  const colors = providerColors[normalizedProvider] || {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300"
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0",
        colors.bg,
        colors.text,
        sizeClasses[size],
        className
      )}
      title={`${name} (${provider})`}
    >
      {displayName}
    </div>
  );
}

// Export color utilities for use in other components
export { providerColors, generateShortName };
