#!/usr/bin/env tsx
/**
 * Script to seed prompt templates
 * This can be run to populate the database with the pre-defined prompt templates
 */

import { pool } from "../server/db";
import { promptTemplateSeeds } from "../server/ai/promptTemplateSeeds";

async function seedPromptTemplates() {
  console.log("🌱 Starting prompt template seeding...");

  try {
    // Check if templates already exist
    const checkResult = await pool.query("SELECT COUNT(*) FROM prompt_templates");
    const count = parseInt(checkResult.rows[0].count);

    if (count > 0) {
      console.log(`⚠️  Database already has ${count} templates. Skipping seed.`);
      console.log("   To re-seed, manually clear the prompt_templates table first.");
      return;
    }

    // Insert each template
    let inserted = 0;
    for (const template of promptTemplateSeeds) {
      await pool.query(
        `INSERT INTO prompt_templates 
         (name, description, category, system_prompt, example_prompt, 
          suggested_models, tags, is_public, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          template.name,
          template.description,
          template.category,
          template.systemPrompt,
          template.examplePrompt,
          template.suggestedModels,
          template.tags,
          template.isPublic,
          template.createdBy,
        ]
      );
      inserted++;
      console.log(`✓ Inserted template: ${template.name}`);
    }

    console.log(`\n✅ Successfully seeded ${inserted} prompt templates!`);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seedPromptTemplates().catch((error) => {
  console.error("Failed to seed prompt templates:", error);
  process.exit(1);
});
