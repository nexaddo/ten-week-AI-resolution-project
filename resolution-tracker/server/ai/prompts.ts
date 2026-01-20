import type { AIAnalysisRequest } from "./types";

export function buildAnalysisPrompt(request: AIAnalysisRequest): string {
  const { checkInNote, resolutionContext, historicalCheckIns } = request;

  let prompt = `You are an AI coach analyzing a user's progress check-in for their New Year's resolution.

Resolution Details:
- Title: ${resolutionContext.title}
- Category: ${resolutionContext.category}
- Current Progress: ${resolutionContext.currentProgress}%`;

  if (resolutionContext.description) {
    prompt += `\n- Description: ${resolutionContext.description}`;
  }

  if (resolutionContext.targetDate) {
    prompt += `\n- Target Date: ${resolutionContext.targetDate}`;
  }

  if (historicalCheckIns && historicalCheckIns.length > 0) {
    prompt += `\n\nRecent Check-Ins:\n`;
    historicalCheckIns.forEach((checkIn, index) => {
      prompt += `${index + 1}. [${checkIn.date}] ${checkIn.note}\n`;
    });
  }

  prompt += `\n\nCurrent Check-In Note:
${checkInNote}

Please analyze this check-in and provide:
1. **insight**: A brief, encouraging analysis of their progress (2-3 sentences). Focus on patterns, momentum, and what this check-in reveals about their journey.
2. **suggestion**: One specific, actionable recommendation for their next steps (1-2 sentences). Make it concrete and achievable.
3. **sentiment**: Classify the overall tone of this check-in as one of: "positive", "neutral", "negative", or "mixed".

Be supportive, specific, and constructive. Celebrate wins and help them learn from challenges.`;

  return prompt;
}

export const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    insight: {
      type: "string",
      description: "A brief, encouraging analysis of their progress (2-3 sentences)"
    },
    suggestion: {
      type: "string",
      description: "One specific, actionable recommendation (1-2 sentences)"
    },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "negative", "mixed"],
      description: "The overall tone of the check-in"
    }
  },
  required: ["insight", "suggestion", "sentiment"]
};
