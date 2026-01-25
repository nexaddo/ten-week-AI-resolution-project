# Enhanced Prompt Playground

## Overview

The Enhanced Prompt Playground provides a comprehensive environment for testing AI prompts, comparing models, and analyzing performance. This upgrade adds several powerful features to help you optimize your AI workflows.

## New Features

### 1. Test Case Template Library

**Access:** Click "Template Library" button in the Prompt Playground

Pre-configured templates for common use cases:

#### Writing Assistant
- **Creative Writing**: Generate stories, poems, and narrative content
- **Technical Writing**: Create clear documentation and guides
- **Marketing Copy**: Craft persuasive marketing content

#### Research Assistant
- **Academic Research**: Literature reviews and research summaries
- **Market Research**: Analyze markets and competitive landscapes
- **Technical Research**: Investigate technologies and best practices

#### Coding Assistant
- **Code Debugging**: Identify and fix bugs
- **Code Review**: Evaluate code quality and security
- **Code Generation**: Generate clean, efficient code

#### Analysis Assistant
- **Data Analysis**: Analyze datasets and identify patterns
- **Business Strategy**: Strategic planning and SWOT analysis
- **Decision Analysis**: Systematic option evaluation

#### Creative Assistant
- **Brainstorming**: Generate innovative ideas
- **Content Ideation**: Create content ideas for blogs and social media

#### General Purpose
- **General Q&A**: Answer questions on various topics

### 2. Model Selection & Configuration

**Features:**
- Select specific models to test (Claude, GPT-4, Gemini)
- Choose any combination of models for comparison
- Visual indicators show model provider and status
- Favorite models for quick access

**How to use:**
1. Go to "Test Prompt" tab
2. Check/uncheck models in the "Select Models to Test" section
3. Click the heart icon to favorite a model
4. Submit your prompt to test selected models

### 3. Model Favorites

**Access:** "Favorites" tab

- Mark frequently-used models as favorites
- Quick access to your preferred models
- Manage favorites with one-click add/remove
- Favorites appear with a heart icon throughout the app

### 4. Model Performance Map

**Access:** "Model Map" tab (Analytics tab)

Comprehensive performance analytics including:

**Metrics Tracked:**
- **Success Rate**: Percentage of successful completions
- **Total Tests**: Number of times each model was tested
- **Average Latency**: Response time in milliseconds
- **Total Cost**: Cumulative API costs
- **Average Rating**: Your ratings of model outputs (1-5 stars)

**Features:**
- Compare all tested models side-by-side
- Visual performance indicators
- Model strengths displayed for each model
- Favorite indicators
- Cost efficiency analysis

## Usage Examples

### Example 1: Test a Custom Prompt

1. Navigate to Prompt Playground
2. Select models to test (e.g., Claude and GPT-4)
3. Enter system prompt (optional): "You are a helpful coding assistant"
4. Enter user prompt: "Write a function to sort an array of objects by date"
5. Click "Test Prompt"
6. Compare results side-by-side
7. Rate each output 1-5 stars

### Example 2: Use a Template

1. Click "Template Library"
2. Browse categories (Writing, Research, Coding, etc.)
3. Click on a template (e.g., "Code Debugging Assistant")
4. Template pre-fills system and user prompts
5. Modify prompt as needed
6. Test with pre-selected models
7. Compare results

### Example 3: Analyze Model Performance

1. Navigate to "Model Map" tab
2. Review success rates for each model
3. Compare average latency
4. Check total costs
5. See your average ratings
6. Identify best models for specific use cases

## API Endpoints

### Test Case Templates
- `GET /api/test-case-templates` - List all templates
- `GET /api/test-case-templates/:id` - Get specific template
- `POST /api/test-case-templates` - Create custom template
- `PATCH /api/test-case-templates/:id` - Update template
- `DELETE /api/test-case-templates/:id` - Delete template

### Model Favorites
- `GET /api/model-favorites` - List user's favorites
- `POST /api/model-favorites` - Add to favorites
- `DELETE /api/model-favorites/:id` - Remove from favorites

### Tool Favorites
- `GET /api/tool-favorites` - List favorite tools
- `POST /api/tool-favorites` - Add tool to favorites
- `DELETE /api/tool-favorites/:id` - Remove from favorites

### Analytics
- `GET /api/model-analytics` - Get aggregated performance metrics

## Database Schema

### New Tables

#### test_case_templates
Stores predefined and user-created test case templates
- Built-in templates (15 pre-configured)
- User-created custom templates
- Suggested models and tools for each template

#### model_favorites
Tracks user's favorite AI models
- Model name and provider
- Optional notes
- User-specific

#### tool_favorites
Tracks user's favorite tools
- Tool identifier and name
- Optional notes
- User-specific

#### test_case_configurations
Stores model/tool selections for each test
- Selected models for specific tests
- Associated tools
- Links to templates

## Seeding Built-in Templates

To populate the database with built-in templates:

```bash
npm run db:seed-templates
```

Or manually run:

```bash
npx tsx script/seed-templates.ts
```

This creates 15 pre-configured templates across 6 categories.

## Tips for Best Results

1. **Use Templates**: Start with templates for common use cases
2. **Rate Outputs**: Rate each output to build analytics data
3. **Compare Models**: Test the same prompt across multiple models
4. **Check Analytics**: Review the Model Map regularly to identify best-performing models
5. **Favorite Models**: Mark your preferred models for quick access
6. **Customize Prompts**: Edit template prompts to fit your specific needs

## Future Enhancements

Potential additions:
- Tool integration (web search, code interpreter, file analysis)
- Custom model configurations
- Prompt versioning and history
- Export test results
- Collaborative prompt sharing
- Advanced filtering in analytics
- Cost optimization recommendations
