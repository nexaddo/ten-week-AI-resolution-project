import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sparkles, Loader2, AlertCircle, Lightbulb } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import type { AiInsight } from "@shared/schema";
import { useEffect, useState } from "react";

interface AiInsightsCardProps {
  checkInId: string;
}

export function AiInsightsCard({ checkInId }: AiInsightsCardProps) {
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 15; // 15 polls * 2 seconds = 30 seconds

  const { data: insights, isLoading, error, refetch } = useQuery<AiInsight[]>({
    queryKey: ["/api/check-ins", checkInId, "insights"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/check-ins/${checkInId}/insights`);
      return res.json();
    },
    refetchInterval: (query) => {
      // Stop polling if we have insights or reached max polls
      const data = query.state.data;
      if ((data && data.length > 0) || pollCount >= maxPolls) {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!insights || insights.length === 0) {
      const timer = setInterval(() => {
        setPollCount((prev) => prev + 1);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [insights]);

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "negative":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "mixed":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const getProviderBadgeColor = (modelName: string) => {
    if (modelName.includes("claude")) {
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200";
    }
    if (modelName.includes("gpt")) {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200";
    }
    if (modelName.includes("gemini")) {
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200";
    }
    return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-200";
  };

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Unable to load AI insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI analysis is temporarily unavailable. Your check-in was saved successfully.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || ((!insights || insights.length === 0) && pollCount < maxPolls)) {
    return (
      <Card className="border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600 dark:text-purple-400" />
            AI is analyzing your check-in...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Testing multiple AI models to provide you with insights. This may take a few moments.
          </p>
          <div className="mt-4 flex gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-100" />
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse delay-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return null; // No insights after polling timeout
  }

  return (
    <Card className="border-purple-200 dark:border-purple-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          AI Insights
        </CardTitle>
        <CardDescription>
          Analysis from {insights.length} AI model{insights.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={getProviderBadgeColor(insight.modelName)}>
                {insight.modelName}
              </Badge>
              {insight.sentiment && (
                <Badge variant="outline" className={getSentimentColor(insight.sentiment)}>
                  {insight.sentiment}
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm leading-relaxed">{insight.insight}</p>
            </div>

            {insight.suggestion && (
              <div className="flex gap-2 mt-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-100">{insight.suggestion}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
