import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ThumbsUp, Star, BookOpen, BarChart3, Heart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AVAILABLE_MODELS, AVAILABLE_TOOLS, getProviderColor } from "@/lib/models";
import type { 
  PromptTest, 
  PromptTestResult, 
  TestCaseTemplate, 
  ModelFavorite, 
  ToolFavorite 
} from "@shared/schema";

interface PromptTestWithResults extends PromptTest {
  results?: PromptTestResult[];
}

interface ModelAnalytics {
  modelName: string;
  provider: string;
  totalTests: number;
  successCount: number;
  successRate: number;
  avgLatency: number;
  totalCost: number;
  avgRating: number;
  ratingCount: number;
}

export default function PromptPlaygroundEnhanced() {
  const [activeTab, setActiveTab] = useState("test");
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(["claude-sonnet-4-5", "gpt-4o", "gemini-2.0-flash"]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TestCaseTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // Fetch test case templates
  const { data: templates = [] } = useQuery<TestCaseTemplate[]>({
    queryKey: ["/api/test-case-templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/test-case-templates");
      return res.json();
    },
  });

  // Fetch model favorites
  const { data: modelFavorites = [] } = useQuery<ModelFavorite[]>({
    queryKey: ["/api/model-favorites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-favorites");
      return res.json();
    },
  });

  // Fetch tool favorites
  const { data: toolFavorites = [] } = useQuery<ToolFavorite[]>({
    queryKey: ["/api/tool-favorites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tool-favorites");
      return res.json();
    },
  });

  // Fetch model analytics
  const { data: analytics = [] } = useQuery<ModelAnalytics[]>({
    queryKey: ["/api/model-analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-analytics");
      return res.json();
    },
  });

  const { data: tests = [] } = useQuery<PromptTestWithResults[]>({
    queryKey: ["/api/prompt-tests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prompt-tests");
      return res.json();
    },
  });

  const { data: currentResults = [], isLoading: resultsLoading } = useQuery<PromptTestResult[]>({
    queryKey: ["/api/prompt-tests", currentTestId, "results"],
    queryFn: async () => {
      if (!currentTestId) return [];
      const res = await apiRequest("GET", `/api/prompt-tests/${currentTestId}/results`);
      return res.json();
    },
    enabled: !!currentTestId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.length >= selectedModels.length) return false;
      return 2000;
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: { prompt: string; systemPrompt?: string; category?: string }) => {
      const res = await apiRequest("POST", "/api/prompt-tests", data);
      return res.json();
    },
    onSuccess: (test: PromptTest) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-tests"] });
      setCurrentTestId(test.id);
      setPrompt("");
      setSystemPrompt("");
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: async (data: { resultId: string; userRating?: number; userComment?: string }) => {
      const { resultId, ...body } = data;
      const res = await apiRequest("PATCH", `/api/prompt-test-results/${resultId}/rating`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-tests", currentTestId, "results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/model-analytics"] });
    },
  });

  const toggleModelFavoriteMutation = useMutation({
    mutationFn: async (data: { modelName: string; provider: string; add: boolean }) => {
      if (data.add) {
        const res = await apiRequest("POST", "/api/model-favorites", {
          modelName: data.modelName,
          provider: data.provider,
          notes: "",
        });
        return res.json();
      } else {
        const favorite = modelFavorites.find(
          f => f.modelName === data.modelName && f.provider === data.provider
        );
        if (favorite) {
          await apiRequest("DELETE", `/api/model-favorites/${favorite.id}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-favorites"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    createTestMutation.mutate({
      prompt: prompt.trim(),
      systemPrompt: systemPrompt.trim() || undefined,
      category: selectedTemplate?.useCaseType,
    });
  };

  const handleRating = (resultId: string, rating: number) => {
    updateRatingMutation.mutate({ resultId, userRating: rating });
  };

  const handleTemplateSelect = (template: TestCaseTemplate) => {
    setSelectedTemplate(template);
    setSystemPrompt(template.systemPrompt || "");
    setPrompt(template.examplePrompt);
    
    // Set suggested models if available
    if (template.suggestedModels) {
      try {
        const models = JSON.parse(template.suggestedModels);
        if (Array.isArray(models) && models.length > 0) {
          setSelectedModels(models);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    setShowTemplateDialog(false);
    setActiveTab("test");
  };

  const isModelFavorite = (modelName: string, provider: string) => {
    return modelFavorites.some(f => f.modelName === modelName && f.provider === provider);
  };

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const toggleToolSelection = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const getStatusColor = (status: string) => {
    return status === "success" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  // Group templates by use case type
  const templatesByType = templates.reduce((acc, template) => {
    const type = template.useCaseType || "general";
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {} as Record<string, TestCaseTemplate[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prompt Playground</h1>
          <p className="text-muted-foreground">
            Test prompts, compare models, and analyze performance
          </p>
        </div>
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Template Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Test Case Template Library</DialogTitle>
              <DialogDescription>
                Choose a template to get started with pre-configured prompts and model suggestions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {Object.entries(templatesByType).map(([type, typeTemplates]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold mb-3 capitalize">{type}</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {typeTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            Example: {template.examplePrompt}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">Test Prompt</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="analytics">Model Map</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Test</CardTitle>
              <CardDescription>
                Configure your test with custom models and tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedTemplate && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Using template: {selectedTemplate.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplate(null)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Select Models to Test
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {AVAILABLE_MODELS.map((model) => {
                      const isFavorite = isModelFavorite(model.id, model.provider);
                      const isSelected = selectedModels.includes(model.id);
                      
                      return (
                        <div
                          key={model.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          }`}
                          onClick={() => toggleModelSelection(model.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Checkbox checked={isSelected} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleModelFavoriteMutation.mutate({
                                  modelName: model.id,
                                  provider: model.provider,
                                  add: !isFavorite,
                                });
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Heart
                                className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                              />
                            </button>
                          </div>
                          <p className="text-sm font-medium">{model.name}</p>
                          <Badge className={`${getProviderColor(model.provider)} text-white mt-1`}>
                            {model.provider}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2">
                            {model.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    System Prompt (optional)
                  </Label>
                  <Textarea
                    placeholder="You are a helpful assistant..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    User Prompt
                  </Label>
                  <Textarea
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={createTestMutation.isPending || !prompt.trim() || selectedModels.length === 0}
                  className="w-full"
                >
                  {createTestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running test...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Test Prompt ({selectedModels.length} models)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {currentTestId && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Results</h2>
              {resultsLoading && currentResults.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">
                        Running prompt across selected models...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentResults.map((result) => (
                    <Card key={result.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{result.modelName}</CardTitle>
                          <Badge className={`${getProviderColor(result.provider)} text-white`}>
                            {result.provider}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.latencyMs}ms
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ${result.estimatedCost}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {result.status === "success" ? (
                          <>
                            <div>
                              <p className="text-sm whitespace-pre-wrap">{result.output}</p>
                            </div>
                            <div className="border-t pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-sm font-medium">Rate this output:</span>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => handleRating(result.id, rating)}
                                    className={`px-3 py-1 text-sm rounded ${
                                      result.userRating === rating
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                    }`}
                                  >
                                    {rating}★
                                  </button>
                                ))}
                              </div>
                              {result.userRating && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Rated: {result.userRating}★
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Tokens: {result.totalTokens} ({result.promptTokens} + {result.completionTokens})</p>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            <p className="font-medium">Error:</p>
                            <p>{result.errorMessage}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Favorite Models</CardTitle>
              <CardDescription>
                Models you've marked as favorites for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modelFavorites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No favorite models yet. Mark models as favorites from the test tab!
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {modelFavorites.map((favorite) => {
                    const model = AVAILABLE_MODELS.find(
                      m => m.id === favorite.modelName && m.provider === favorite.provider
                    );
                    
                    return (
                      <div key={favorite.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{model?.name || favorite.modelName}</p>
                            <Badge className={`${getProviderColor(favorite.provider)} text-white mt-1`}>
                              {favorite.provider}
                            </Badge>
                          </div>
                          <button
                            onClick={() => toggleModelFavoriteMutation.mutate({
                              modelName: favorite.modelName,
                              provider: favorite.provider,
                              add: false,
                            })}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </button>
                        </div>
                        {model && (
                          <p className="text-xs text-muted-foreground">{model.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Map</CardTitle>
              <CardDescription>
                Compare model performance, cost, and user ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No analytics data yet. Run some tests to see performance metrics!
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.map((stat) => {
                    const model = AVAILABLE_MODELS.find(
                      m => m.id === stat.modelName && m.provider === stat.provider
                    );
                    const isFavorite = isModelFavorite(stat.modelName, stat.provider);
                    
                    return (
                      <div key={`${stat.provider}-${stat.modelName}`} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{model?.name || stat.modelName}</p>
                              <Badge className={`${getProviderColor(stat.provider)} text-white mt-1`}>
                                {stat.provider}
                              </Badge>
                            </div>
                            {isFavorite && (
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{stat.successRate.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Tests</p>
                            <p className="text-lg font-semibold">{stat.totalTests}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Latency</p>
                            <p className="text-lg font-semibold">{stat.avgLatency}ms</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Cost</p>
                            <p className="text-lg font-semibold">${stat.totalCost.toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Rating</p>
                            <p className="text-lg font-semibold">
                              {stat.avgRating > 0 ? (
                                <>
                                  {stat.avgRating.toFixed(1)} <Star className="inline h-4 w-4 fill-yellow-400 text-yellow-400" />
                                </>
                              ) : (
                                "N/A"
                              )}
                            </p>
                          </div>
                        </div>

                        {model && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Strengths:</p>
                            <div className="flex gap-2 flex-wrap">
                              {model.strengths.map((strength) => (
                                <Badge key={strength} variant="secondary" className="text-xs">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
