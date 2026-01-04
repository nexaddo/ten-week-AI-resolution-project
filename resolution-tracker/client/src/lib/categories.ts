import { Category } from "@shared/schema";

export const categoryColors: Record<Category, { bg: string; text: string }> = {
  "Health & Fitness": { 
    bg: "bg-emerald-100 dark:bg-emerald-900/30", 
    text: "text-emerald-700 dark:text-emerald-400" 
  },
  "Career": { 
    bg: "bg-blue-100 dark:bg-blue-900/30", 
    text: "text-blue-700 dark:text-blue-400" 
  },
  "Learning": { 
    bg: "bg-purple-100 dark:bg-purple-900/30", 
    text: "text-purple-700 dark:text-purple-400" 
  },
  "Finance": { 
    bg: "bg-amber-100 dark:bg-amber-900/30", 
    text: "text-amber-700 dark:text-amber-400" 
  },
  "Relationships": { 
    bg: "bg-pink-100 dark:bg-pink-900/30", 
    text: "text-pink-700 dark:text-pink-400" 
  },
  "Personal Growth": { 
    bg: "bg-indigo-100 dark:bg-indigo-900/30", 
    text: "text-indigo-700 dark:text-indigo-400" 
  },
};

export const categoryIcons: Record<Category, string> = {
  "Health & Fitness": "activity",
  "Career": "briefcase",
  "Learning": "book-open",
  "Finance": "wallet",
  "Relationships": "heart",
  "Personal Growth": "sparkles",
};
