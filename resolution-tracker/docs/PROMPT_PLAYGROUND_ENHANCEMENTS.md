# AI Prompt Playground Enhancements

This document describes the enhanced features added to the AI Prompt Playground.

## Overview

The AI Prompt Playground has been significantly enhanced with the following capabilities:
- **Test Case Management**: Create and manage custom test cases with specific configurations
- **Template Library**: Choose from pre-built prompt templates for various use cases
- **Model Selection**: Select which AI models to test your prompts against
- **Favorites**: Star your favorite models and templates for quick access
- **Model Map**: Visual analytics showing model performance across different use cases

## Features

### 1. Template Library

A comprehensive library of 18 pre-built prompt templates across 8 categories:

**Categories:**
- **Writing**: Creative writing, technical documentation, blog posts
- **Research**: Academic research, market analysis
- **Coding**: Code review, algorithms, full-stack development
- **Analysis**: Data analysis, business strategy
- **Creative**: Marketing copy, brainstorming
- **Education**: Tutoring, language learning
- **Business**: Professional emails, meeting summaries
- **General**: General assistance, problem-solving

Each template includes:
- Pre-configured system prompts
- Example prompts to get started
- Suggested models optimized for that use case
- Tags for easy filtering

### 2. Custom Model Selection

Instead of testing against all models, you can now:
- Select specific models to test
- View recommended models for each template
- Save your preferred model configurations
- Compare performance across selected models only

**Available Models:**
- Claude Sonnet 4.5 (Anthropic)
- GPT-4o (OpenAI)
- Gemini 2.0 Flash (Google)

### 3. Favorites System

Mark your preferred models and templates as favorites:
- Click the star icon to favorite/unfavorite
- Quick access to your favorite items
- Favorites are user-specific
- Sync across sessions

### 4. Model Performance Map

Visual analytics dashboard showing:
- Model performance by use case category
- Success rates and reliability metrics
- Average latency (response time)
- Cost analysis per model
- User ratings and feedback
- Recommended models for each category

**Metrics Tracked:**
- Success Rate: Percentage of successful completions
- Average Latency: Response time in milliseconds
- Average Cost: Estimated cost per request
- User Ratings: 1-5 star ratings from user feedback
- Test Count: Number of tests run per model/category

### 5. Enhanced Test Case Configuration

When creating a test:
- Choose from template library or write custom prompts
- Select which models to test against
- Add optional system prompts
- Tag and categorize your tests
- Track test history

## Database Schema

New tables added:

### prompt_templates
Stores the library of pre-built templates
- `id`: Unique identifier
- `name`: Template name
- `description`: What the template does
- `category`: Use case category (writing, coding, etc.)
- `system_prompt`: Pre-configured system prompt
- `example_prompt`: Example user prompt
- `suggested_models`: JSON array of recommended models
- `tags`: JSON array of tags
- `is_public`: Whether template is publicly available
- `created_by`: User who created (null for system templates)

### user_favorites
Tracks user's favorite models and templates
- `id`: Unique identifier
- `user_id`: User who favorited
- `favorite_type`: Type (model, template, tool)
- `favorite_id`: ID of favorited item
- `favorite_name`: Display name
- `metadata`: JSON with additional data

### test_case_configs
Stores custom test configurations
- `id`: Unique identifier
- `prompt_test_id`: Associated test
- `model_name`: Model to use
- `provider`: AI provider
- `enabled`: Whether config is active
- `custom_parameters`: JSON for model-specific params

## API Endpoints

### Template Management
- `GET /api/prompt-templates` - List all templates
- `GET /api/prompt-templates/:id` - Get specific template
- `POST /api/prompt-templates` - Create custom template
- `PATCH /api/prompt-templates/:id` - Update template
- `DELETE /api/prompt-templates/:id` - Delete template
- `POST /api/prompt-templates/seed` - Seed default templates

### Favorites
- `GET /api/favorites?type={type}` - List user favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:id` - Remove favorite

### Analytics
- `GET /api/ai/model-map` - Get model performance analytics

## Usage

### Using a Template

1. Navigate to the Prompt Playground
2. Click "Use Template" button
3. Browse templates by category or search
4. Click on a template to load it
5. Modify if needed and test

### Selecting Models

1. In the playground, click "Models (N)" button
2. Check/uncheck models you want to test
3. Click "Confirm Selection"
4. Submit your prompt

### Viewing Model Map

1. Click on the "Model Map" tab
2. View performance metrics by category
3. See recommended models for each use case
4. Compare costs, latency, and success rates

### Managing Favorites

1. Click the star icon on any model result
2. View all favorites in the "Favorites" tab
3. Click starred items for quick access
4. Unfavorite by clicking the star again

## Database Setup

### Apply Schema Changes

```bash
# Generate migration
npm run db:migrate:generate

# Push schema to database
npm run db:push

# Seed prompt templates
tsx script/seed-prompt-templates.ts
```

### Seed Templates via API

Alternatively, seed templates through the API:
```bash
curl -X POST http://localhost:5000/api/prompt-templates/seed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Development

### Adding New Templates

Edit `server/ai/promptTemplateSeeds.ts` and add your template:

```typescript
{
  name: "Your Template Name",
  description: "What it does",
  category: "coding", // or other category
  systemPrompt: "System instructions...",
  examplePrompt: "Example user prompt...",
  suggestedModels: JSON.stringify(["claude-sonnet-4-5", "gpt-4o"]),
  tags: JSON.stringify(["tag1", "tag2"]),
  isPublic: true,
  createdBy: null,
}
```

Then re-run the seed script.

### Adding New Categories

1. Update `useCaseCategories` in `shared/schema.ts`
2. Add category icon/color in UI components
3. Create templates for the new category

## Testing

Run the test suite:
```bash
npm test
```

Check types:
```bash
npm run check
```

## Performance Considerations

- Model map calculations are done server-side
- Results are cached in React Query
- Favorites are fetched on-demand
- Templates are loaded once per session
- Heavy analytics use aggregation queries

## Security

- All endpoints require authentication
- User-specific data is properly scoped
- Template creation is logged
- No sensitive data in favorites metadata

## Future Enhancements

Potential additions:
- Custom categories and tags
- Template sharing between users
- Export test results
- Batch testing
- A/B testing capabilities
- Cost budgeting and alerts
- Performance trend analysis
