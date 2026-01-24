#!/usr/bin/env tsx
/**
 * Seed script to populate database with built-in test case templates
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { testCaseTemplates } from "../shared/schema.js";
import { eq } from "drizzle-orm";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle(pool);

const builtInTemplates = [
  // Writing Assistant Templates
  {
    name: "Creative Writing Assistant",
    description: "Generate creative stories, poems, or narrative content",
    useCaseType: "writing",
    systemPrompt: "You are a creative writing assistant. Help craft engaging, imaginative content with vivid descriptions and compelling narratives.",
    examplePrompt: "Write a short story about a time traveler who accidentally changes the course of history",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o", "gemini-2.0-flash"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Technical Writing Assistant",
    description: "Create clear, concise technical documentation and guides",
    useCaseType: "writing",
    systemPrompt: "You are a technical writing assistant. Create clear, well-structured documentation that is easy to understand for technical audiences.",
    examplePrompt: "Write a user guide for setting up a PostgreSQL database with Docker",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Marketing Copy Assistant",
    description: "Generate persuasive marketing content and ad copy",
    useCaseType: "writing",
    systemPrompt: "You are a marketing copywriter. Create compelling, persuasive content that drives engagement and conversions.",
    examplePrompt: "Write a product description for a new AI-powered task management app",
    suggestedModels: JSON.stringify(["gpt-4o", "claude-sonnet-4-5"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },

  // Research Assistant Templates
  {
    name: "Academic Research Assistant",
    description: "Help with literature reviews, research summaries, and academic writing",
    useCaseType: "research",
    systemPrompt: "You are an academic research assistant. Provide thorough, well-cited information and help synthesize research findings.",
    examplePrompt: "Summarize the latest research on transformer architectures in natural language processing",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
    suggestedTools: JSON.stringify(["web_search"]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Market Research Assistant",
    description: "Analyze market trends, competitors, and business opportunities",
    useCaseType: "research",
    systemPrompt: "You are a market research analyst. Provide data-driven insights about markets, trends, and competitive landscapes.",
    examplePrompt: "Analyze the current state of the AI assistant market and identify key trends",
    suggestedModels: JSON.stringify(["gpt-4o", "claude-sonnet-4-5"]),
    suggestedTools: JSON.stringify(["web_search"]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Technical Research Assistant",
    description: "Research technical topics, frameworks, and best practices",
    useCaseType: "research",
    systemPrompt: "You are a technical research assistant. Help investigate technical topics, compare technologies, and provide implementation guidance.",
    examplePrompt: "Compare React Server Components vs traditional client-side rendering approaches",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
    suggestedTools: JSON.stringify(["web_search"]),
    isBuiltIn: true,
    userId: null,
  },

  // Coding Assistant Templates
  {
    name: "Code Debugging Assistant",
    description: "Help identify and fix bugs in code",
    useCaseType: "coding",
    systemPrompt: "You are an expert software developer specialized in debugging. Analyze code carefully, identify issues, and suggest fixes with explanations.",
    examplePrompt: "Debug this TypeScript React component that's causing infinite re-renders",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
    suggestedTools: JSON.stringify(["code_interpreter"]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Code Review Assistant",
    description: "Review code for best practices, security, and performance",
    useCaseType: "coding",
    systemPrompt: "You are a senior software engineer conducting code reviews. Evaluate code quality, identify potential issues, and suggest improvements.",
    examplePrompt: "Review this authentication implementation for security vulnerabilities",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Code Generation Assistant",
    description: "Generate code based on requirements and specifications",
    useCaseType: "coding",
    systemPrompt: "You are an expert software developer. Write clean, efficient, well-documented code following best practices.",
    examplePrompt: "Create a React component with a form that validates user input and handles submission",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
    suggestedTools: JSON.stringify(["code_interpreter"]),
    isBuiltIn: true,
    userId: null,
  },

  // Analysis Templates
  {
    name: "Data Analysis Assistant",
    description: "Analyze datasets and provide insights",
    useCaseType: "analysis",
    systemPrompt: "You are a data analyst. Help analyze data, identify patterns, and provide actionable insights with clear visualizations when appropriate.",
    examplePrompt: "Analyze this customer feedback data and identify key themes and sentiment trends",
    suggestedModels: JSON.stringify(["gpt-4o", "claude-sonnet-4-5"]),
    suggestedTools: JSON.stringify(["code_interpreter"]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Business Strategy Assistant",
    description: "Help with business analysis and strategic planning",
    useCaseType: "analysis",
    systemPrompt: "You are a business strategist. Provide strategic insights, framework-based analysis, and actionable recommendations.",
    examplePrompt: "Conduct a SWOT analysis for a startup entering the AI developer tools market",
    suggestedModels: JSON.stringify(["gpt-4o", "claude-sonnet-4-5"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Decision Analysis Assistant",
    description: "Help evaluate options and make informed decisions",
    useCaseType: "analysis",
    systemPrompt: "You are a decision analysis expert. Help evaluate options systematically, considering trade-offs and providing structured recommendations.",
    examplePrompt: "Help me decide between PostgreSQL and MongoDB for my new application",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },

  // Creative Templates
  {
    name: "Brainstorming Assistant",
    description: "Generate creative ideas and innovative solutions",
    useCaseType: "creative",
    systemPrompt: "You are a creative brainstorming partner. Generate diverse, innovative ideas and help explore possibilities.",
    examplePrompt: "Brainstorm unique feature ideas for a resolution tracking app",
    suggestedModels: JSON.stringify(["gpt-4o", "claude-sonnet-4-5", "gemini-2.0-flash"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },
  {
    name: "Content Ideation Assistant",
    description: "Generate content ideas for blogs, videos, and social media",
    useCaseType: "creative",
    systemPrompt: "You are a content strategist. Generate engaging content ideas tailored to the target audience and platform.",
    examplePrompt: "Generate 10 blog post ideas about AI-powered productivity tools",
    suggestedModels: JSON.stringify(["gpt-4o", "claude-sonnet-4-5"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },

  // General Purpose
  {
    name: "General Q&A Assistant",
    description: "Answer general questions and provide information",
    useCaseType: "general",
    systemPrompt: "You are a helpful, knowledgeable assistant. Provide accurate, clear answers to a wide range of questions.",
    examplePrompt: "Explain how neural networks work in simple terms",
    suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o", "gemini-2.0-flash"]),
    suggestedTools: JSON.stringify([]),
    isBuiltIn: true,
    userId: null,
  },
];

async function seedTemplates() {
  console.log("🌱 Seeding test case templates...\n");

  try {
    // Check if templates already exist
    const existing = await db.select().from(testCaseTemplates).where(eq(testCaseTemplates.isBuiltIn, true));
    
    if (existing.length > 0) {
      console.log(`⚠️  Found ${existing.length} existing built-in templates`);
      console.log("💡 Skipping seed to avoid duplicates");
      console.log("   To re-seed, first delete existing templates from the database\n");
      await pool.end();
      process.exit(0);
    }

    // Insert all templates
    const inserted = await db.insert(testCaseTemplates).values(builtInTemplates).returning();

    console.log("✅ Created templates:");
    for (const template of inserted) {
      console.log(`   - ${template.name} (${template.useCaseType})`);
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Successfully seeded ${inserted.length} test case templates!`);
    console.log("\nTemplate Categories:");
    console.log("  - Writing: 3 templates");
    console.log("  - Research: 3 templates");
    console.log("  - Coding: 3 templates");
    console.log("  - Analysis: 3 templates");
    console.log("  - Creative: 2 templates");
    console.log("  - General: 1 template");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await pool.end();
    process.exit(1);
  }
}

seedTemplates();
