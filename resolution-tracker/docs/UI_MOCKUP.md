# Enhanced Prompt Playground UI Overview

## Visual Layout

### Main Interface - 3 Tabs

```
┌─────────────────────────────────────────────────────────────────┐
│  Prompt Playground                    [Template Library Button] │
│  Test prompts, compare models, and analyze performance          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────┐                 │
│  │ Test Prompt  │  Favorites   │  Model Map   │                 │
│  └──────────────┴──────────────┴──────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tab 1: Test Prompt

### Model Selection Grid
```
┌─────────────────────────────────────────────────────────────────┐
│  Select Models to Test                                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ [✓] Claude   │  │ [✓] GPT-4o   │  │ [✓] Gemini   │          │
│  │  Sonnet 4.5  │  │              │  │  2.0 Flash   │          │
│  │ [Anthropic]  │  │ [OpenAI]     │  │ [Google]     │          │
│  │              │  │              │  │              │          │
│  │ Balanced     │  │ Fast, multi- │  │ Fast, cost-  │          │
│  │ performance  │  │ modal model  │  │ effective    │          │
│  │         ♥️   │  │         ♡    │  │         ♡    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Prompt Input
```
┌─────────────────────────────────────────────────────────────────┐
│  System Prompt (optional)                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ You are a helpful assistant...                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  User Prompt                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Enter your prompt here...                                 │  │
│  │                                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      ✨ Test Prompt (3 models)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Results Display (3-column grid)
```
┌─────────────────────────────────────────────────────────────────┐
│  Results                                                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Claude       │  │ GPT-4o       │  │ Gemini       │          │
│  │ [Anthropic]  │  │ [OpenAI]     │  │ [Google]     │          │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │          │
│  │ │ Success  │ │  │ │ Success  │ │  │ │ Success  │ │          │
│  │ │ 245ms    │ │  │ │ 312ms    │ │  │ │ 189ms    │ │          │
│  │ │ $0.0023  │ │  │ │ $0.0019  │ │  │ │ $0.0008  │ │          │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │          │
│  │              │  │              │  │              │          │
│  │ Output text  │  │ Output text  │  │ Output text  │          │
│  │ here...      │  │ here...      │  │ here...      │          │
│  │              │  │              │  │              │          │
│  │ ─────────────│  │ ─────────────│  │ ─────────────│          │
│  │ Rate output: │  │ Rate output: │  │ Rate output: │          │
│  │ [1★][2★][3★] │  │ [1★][2★][3★] │  │ [1★][2★][3★] │          │
│  │ [4★][5★]     │  │ [4★][5★]     │  │ [4★][5★]     │          │
│  │              │  │              │  │              │          │
│  │ Tokens: 523  │  │ Tokens: 498  │  │ Tokens: 512  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Tab 2: Favorites

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Favorite Models                                           │
│  Models you've marked as favorites for quick access             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Claude       │  │ GPT-4o       │  │              │          │
│  │ Sonnet 4.5   │  │              │  │              │          │
│  │ [Anthropic]  │  │ [OpenAI]     │  │              │          │
│  │              │  │              │  │              │          │
│  │ Balanced     │  │ Fast, multi- │  │              │          │
│  │ performance  │  │ modal model  │  │              │          │
│  │         ♥️   │  │         ♥️    │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Tab 3: Model Map (Analytics)

```
┌─────────────────────────────────────────────────────────────────┐
│  Model Performance Map                                          │
│  Compare model performance, cost, and user ratings              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Claude Sonnet 4.5                           95%         │  │
│  │  [Anthropic]                          Success Rate  ♥️   │  │
│  │                                                           │  │
│  │  Tests: 24      Avg Latency: 245ms                       │  │
│  │  Total Cost: $0.0552    Avg Rating: 4.2★                 │  │
│  │                                                           │  │
│  │  Strengths: [Code generation] [Analysis] [Creative]      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  GPT-4o                                      92%         │  │
│  │  [OpenAI]                             Success Rate       │  │
│  │                                                           │  │
│  │  Tests: 28      Avg Latency: 312ms                       │  │
│  │  Total Cost: $0.0532    Avg Rating: 4.1★                 │  │
│  │                                                           │  │
│  │  Strengths: [General purpose] [Reasoning] [Code]         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Gemini 2.0 Flash                            89%         │  │
│  │  [Google]                             Success Rate       │  │
│  │                                                           │  │
│  │  Tests: 20      Avg Latency: 189ms                       │  │
│  │  Total Cost: $0.0160    Avg Rating: 3.8★                 │  │
│  │                                                           │  │
│  │  Strengths: [Speed] [Efficiency] [General tasks]         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Template Library Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  Test Case Template Library                              [X]   │
│  Choose a template to get started with pre-configured prompts   │
├─────────────────────────────────────────────────────────────────┤
│  Writing                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Creative Writing     │  │ Technical Writing    │            │
│  │ Assistant            │  │ Assistant            │            │
│  │                      │  │                      │            │
│  │ Generate stories,    │  │ Create clear docs    │            │
│  │ poems, narratives    │  │ and guides          │            │
│  │                      │  │                      │            │
│  │ Example: Write a     │  │ Example: Write a     │            │
│  │ short story about... │  │ user guide for...    │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  Research                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Academic Research    │  │ Market Research      │            │
│  │ Assistant            │  │ Assistant            │            │
│  │                      │  │                      │            │
│  │ Literature reviews   │  │ Analyze markets      │            │
│  │ and summaries        │  │ and trends           │            │
│  │                      │  │                      │            │
│  │ Example: Summarize   │  │ Example: Analyze     │            │
│  │ latest research on...│  │ the current state... │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  Coding                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Code Debugging       │  │ Code Review          │            │
│  │ Assistant            │  │ Assistant            │            │
│  │ ...                  │  │ ...                  │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  [More categories: Analysis, Creative, General...]             │
└─────────────────────────────────────────────────────────────────┘
```

## Color Coding

- **Anthropic/Claude**: Orange badge
- **OpenAI/GPT**: Green badge  
- **Google/Gemini**: Blue badge
- **Success**: Green background
- **Error**: Red background
- **Favorite**: Red heart (filled)
- **Not Favorite**: Gray heart (outline)
- **Selected Model**: Blue border + background tint
- **Unselected Model**: Gray border

## Responsive Behavior

- **Desktop (lg)**: 3 columns for results, models
- **Tablet (md)**: 2 columns
- **Mobile**: 1 column (stacked)
- All content scrollable
- Dialog overlays with max-height scrolling

## Key UI Interactions

1. **Click template** → Auto-fills prompts and selects suggested models
2. **Click heart** → Toggles favorite status immediately
3. **Check model** → Adds/removes from test selection
4. **Click star (1-5)** → Rates output and updates analytics
5. **Tab switch** → Seamless navigation between views
6. **Template Library button** → Opens dialog overlay
