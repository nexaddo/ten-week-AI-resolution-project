# AI-Powered Check-In Analysis - Setup Guide

## Overview
Your resolution tracker now includes AI-powered analysis that compares Claude, GPT, and Gemini models. This implements the Week 2 "Model Mapping" mission by systematically tracking model performance.

## ✅ What's Been Implemented

### Backend
- **Database Schema**: Two new tables for AI insights and model usage tracking
- **AI Service Layer**: Providers for Anthropic Claude, OpenAI GPT, and Google Gemini
- **API Endpoints**:
  - POST `/api/check-ins` - triggers AI analysis automatically
  - GET `/api/check-ins/:checkInId/insights` - fetch AI insights
  - GET `/api/ai/model-stats` - get model usage statistics
  - GET `/api/ai/model-comparison` - get comparison metrics
- **Async Processing**: Non-blocking AI analysis runs in background

### Frontend
- **AI Insights Card**: Real-time display of insights from multiple models
- **AI Analytics Dashboard**: Full comparison dashboard with charts
- **Navigation**: New "AI Analytics" menu item in sidebar

## 🚀 Setup Instructions

### 1. Get AI API Keys

You need at least one API key (recommended: start with Anthropic Claude):

**Anthropic Claude** (Recommended to start)
- Visit: https://console.anthropic.com/
- Sign up and get your API key
- Free tier: $5 credit
- Cost: ~$0.002-0.005 per check-in

**OpenAI GPT** (Optional)
- Visit: https://platform.openai.com/api-keys
- Sign up and get your API key
- Cost: ~$0.01-0.02 per check-in (with GPT-4)

**Google Gemini** (Optional)
- Visit: https://makersuite.google.com/app/apikey
- Sign up and get your API key
- Free tier available
- Cost: ~$0.001-0.002 per check-in

### 2. Configure Environment Variables

Create or update `resolution-tracker/.env`:

```bash
# Copy from .env.example if you don't have .env yet
cp .env.example .env

# Then add your API keys (uncomment and add your keys):
ANTHROPIC_API_KEY=sk-ant-...your-key-here
# OPENAI_API_KEY=sk-...your-key-here
# GOOGLE_AI_API_KEY=AI...your-key-here

# AI Configuration (optional, these are the defaults):
AI_STRATEGY=all              # Options: "all", "rotate", "single"
AI_DEFAULT_MODEL=anthropic   # Used when strategy is "single"
AI_ENABLE_ANALYSIS=true      # Set to false to disable AI
AI_MAX_HISTORICAL_CHECKINS=5 # Context size for analysis
```

### 3. Start the Development Server

```bash
cd resolution-tracker
npm run dev
```

The server will:
- Initialize AI providers based on available API keys
- Show ✓ for each successfully initialized provider
- Warn if no API keys are configured

## 📊 How to Use

### Creating Check-Ins with AI Analysis

1. **Create a Resolution** (if you don't have one)
   - Click "Add Resolution" on the dashboard
   - Fill in title, category, etc.

2. **Add a Check-In**
   - Click the menu on any resolution card
   - Select "Add Check-in"
   - Write a detailed note about your progress (e.g., "Completed 30-minute run today. Felt great!")
   - Adjust progress slider

3. **View AI Insights**
   - After saving, scroll down on the dashboard
   - AI Insights card will appear with loading state
   - Insights from each model appear as they complete (2-5 seconds each)
   - Each insight shows:
     - Model name badge (color-coded by provider)
     - Sentiment badge (positive/neutral/negative/mixed)
     - Analysis text
     - Actionable suggestion

### Viewing Model Analytics

1. **Navigate to AI Analytics**
   - Click "AI Analytics" in the sidebar (Brain icon)

2. **Dashboard Sections**
   - **Summary Cards**: Total calls, cost, latency, success rate
   - **Comparison Table**: Side-by-side model metrics
   - **Charts**:
     - Response time by model (bar chart)
     - Cost distribution by provider (pie chart)
     - Token usage by model (bar chart)
     - Reliability (success vs failed calls)

## 🎯 Model Strategies

### Strategy: "all" (Default - Best for Week 2 Mission)
- Calls all 3 providers in parallel
- Best for systematic comparison
- Use for first 50-100 check-ins to build dataset
- Higher cost but maximum insight

### Strategy: "rotate"
- Round-robin between models
- Distributes load and cost
- Good for long-term A/B testing
- Set: `AI_STRATEGY=rotate`

### Strategy: "single"
- Calls only one model (set by AI_DEFAULT_MODEL)
- Lowest cost option
- Use after choosing "winner" from comparison data
- Set: `AI_STRATEGY=single`

## 💰 Cost Estimates

Per check-in with all 3 models:
- Claude Sonnet: ~$0.002-0.005
- GPT-4o: ~$0.01-0.02
- Gemini Flash: ~$0.001-0.002
- **Total: ~$0.013-0.027 per check-in**

For testing (100 check-ins): **~$1.30-2.70**

## 🔧 Testing the Feature

### Quick Test
```bash
# 1. Make sure server is running
npm run dev

# 2. In browser:
# - Sign in to your app
# - Create a resolution if you don't have one
# - Add a detailed check-in note
# - Watch AI insights appear in real-time
# - Navigate to "AI Analytics" to see the dashboard

# 3. Check server logs for AI provider initialization:
# ✓ Anthropic provider initialized
# ✓ OpenAI provider initialized
# ✓ Google provider initialized
```

### Verify AI Analysis
After creating a check-in, check server logs for:
```
✓ anthropic/claude-sonnet-4-5 completed in 2341ms (cost: $0.003456)
✓ openai/gpt-4o completed in 1876ms (cost: $0.012345)
✓ google/gemini-1.5-flash completed in 1523ms (cost: $0.001234)
AI analysis for check-in abc123: 3 succeeded, 0 failed
```

## 📁 File Structure

```
resolution-tracker/
├── server/ai/
│   ├── types.ts                    # TypeScript interfaces
│   ├── prompts.ts                  # Prompt templates
│   ├── costCalculator.ts           # Token → cost conversion
│   ├── orchestrator.ts             # Main AI service
│   └── providers/
│       ├── anthropicProvider.ts    # Claude integration
│       ├── openaiProvider.ts       # GPT integration
│       └── googleProvider.ts       # Gemini integration
│
├── client/src/
│   ├── components/
│   │   └── ai-insights-card.tsx    # Insights display component
│   └── pages/
│       ├── dashboard.tsx           # Updated with AI insights
│       └── ai-dashboard.tsx        # Analytics dashboard
│
└── shared/schema.ts                # Database schema (AI tables added)
```

## 🐛 Troubleshooting

### No AI providers initialized
**Problem**: Server logs show "⚠ No AI providers configured"
**Solution**: Add at least one API key to `.env` file and restart server

### Check-in saves but no insights appear
**Problem**: Check-in succeeds but AI card shows "No insights"
**Solutions**:
1. Check server logs for AI errors
2. Verify `AI_ENABLE_ANALYSIS` is not set to `false`
3. Ensure API keys are valid
4. Check for rate limiting errors in logs

### API errors in logs
**Problem**: `✗ anthropic/claude-sonnet-4-5 failed after 156ms: Invalid API key`
**Solution**: Verify API key is correct and has credits

### TypeScript errors
**Problem**: Build fails with TypeScript errors
**Solution**: Run `npm run check` to see errors, then restart dev server

## 📚 Next Steps for Week 2 Mission

1. **Generate Test Data** (10-20 check-ins)
   - Create diverse resolutions (fitness, learning, etc.)
   - Write varied check-in notes (positive, challenging, neutral)

2. **Compare Models**
   - Navigate to AI Analytics dashboard
   - Analyze which model provides:
     - Most helpful insights
     - Fastest response times
     - Best cost-to-quality ratio

3. **Document Findings**
   - Take screenshots of comparison table
   - Note which model excels at what
   - Create your personal AI model guide

4. **Optimize Strategy**
   - Switch to best-performing model with `AI_STRATEGY=single`
   - Or use `AI_STRATEGY=rotate` for balanced usage

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Check-ins display AI insights from multiple models
- ✅ AI Analytics dashboard shows comparison metrics
- ✅ Server logs show successful AI API calls
- ✅ Dashboard charts populate with data
- ✅ You can compare latency, cost, and quality across models

---

**Happy Model Mapping!** 🚀

For issues or questions, check the server logs first - they show detailed AI provider initialization and analysis results.
