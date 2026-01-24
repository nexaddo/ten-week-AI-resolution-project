import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Star, TrendingUp, Zap, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModelStats {
  modelName: string;
  count: number;
  successRate: number;
  avgLatency: number;
  avgCost: string;
  avgRating: string | null;
}

interface CategoryModelMap {
  category: string;
  models: ModelStats[];
}

const categoryColors: Record<string, string> = {
  writing: "border-blue-500",
  research: "border-purple-500",
  coding: "border-green-500",
  analysis: "border-orange-500",
  creative: "border-pink-500",
  education: "border-indigo-500",
  business: "border-gray-500",
  general: "border-teal-500",
};

export function ModelMapVisualization() {
  const { data: modelMap = [], isLoading } = useQuery<CategoryModelMap[]>({
    queryKey: ["/api/ai/model-map"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ai/model-map");
      return res.json();
    },
  });

  const getBestModelForCategory = (models: ModelStats[]) => {
    if (models.length === 0) return null;
    
    // Score based on success rate, rating, and inverse of latency
    return models.reduce((best, model) => {
      const score = (
        model.successRate * 0.4 +
        (model.avgRating ? parseFloat(model.avgRating) * 20 : 0) * 0.4 +
        (1000 / model.avgLatency) * 0.2
      );
      
      const bestScore = (
        best.successRate * 0.4 +
        (best.avgRating ? parseFloat(best.avgRating) * 20 : 0) * 0.4 +
        (1000 / best.avgLatency) * 0.2
      );
      
      return score > bestScore ? model : best;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (modelMap.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            No test data available yet. Run some prompt tests to see the model map!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Model Performance Map</h2>
        <p className="text-muted-foreground">
          Visual overview of how different models perform across various use cases
        </p>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid gap-6">
          {modelMap.map(({ category, models }) => {
            const bestModel = getBestModelForCategory(models);
            const borderColor = categoryColors[category] || "border-gray-500";

            return (
              <Card key={category} className={`border-l-4 ${borderColor}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="capitalize">{category}</CardTitle>
                      <CardDescription>
                        {models.length} model{models.length !== 1 ? 's' : ''} tested
                      </CardDescription>
                    </div>
                    {bestModel && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Best: {bestModel.modelName}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {models.map(model => (
                      <div
                        key={model.modelName}
                        className={`border rounded-lg p-4 ${
                          bestModel?.modelName === model.modelName
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">{model.modelName}</h4>
                          {bestModel?.modelName === model.modelName && (
                            <Badge className="text-xs">Recommended</Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tests Run:</span>
                            <span className="font-medium">{model.count}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Success Rate:</span>
                            <span className={`font-medium ${
                              model.successRate >= 90 ? "text-green-600" :
                              model.successRate >= 70 ? "text-yellow-600" :
                              "text-red-600"
                            }`}>
                              {model.successRate.toFixed(1)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Avg Latency:
                            </span>
                            <span className="font-medium">{model.avgLatency}ms</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Avg Cost:
                            </span>
                            <span className="font-medium">${model.avgCost}</span>
                          </div>

                          {model.avgRating && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                User Rating:
                              </span>
                              <span className="font-medium">{model.avgRating}★</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
