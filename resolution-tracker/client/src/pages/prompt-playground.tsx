import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, ThumbsUp, BookOpen, Settings, BarChart3, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PromptTest, PromptTestResult, PromptTemplate } from "@shared/schema";
import { TemplateLibraryDialog } from "@/components/template-library-dialog";
import { ModelSelectorDialog } from "@/components/model-selector-dialog";
import { ModelMapVisualization } from "@/components/model-map-visualization";
import { FavoriteButton } from "@/components/favorites";

interface PromptTestWithResults extends PromptTest {
  results?: PromptTestResult[];
}

export default function PromptPlayground() {
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>(["claude-sonnet-4-5", "gpt-4o", "gemini-2.0-flash"]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("playground");

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
      // Poll every 2 seconds until we have results from all 3 models or 30 seconds elapsed
      if (data && data.length >= 3) return false;
      return 2000;
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: { 
      prompt: string; 
      systemPrompt?: string;
      selectedModels?: string[];
      category?: string;
    }) => {
      const payload = {
        prompt: data.prompt,
        systemPrompt: data.systemPrompt,
        selectedModels: data.selectedModels ? JSON.stringify(data.selectedModels) : undefined,
        category: data.category,
      };
      const res = await apiRequest("POST", "/api/prompt-tests", payload);
      return res.json();
    },
    onSuccess: (test: PromptTest) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-tests"] });
      setCurrentTestId(test.id);
      setPrompt("");
      setSystemPrompt("");
      setActiveTab("playground");
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
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    createTestMutation.mutate({
      prompt: prompt.trim(),
      systemPrompt: systemPrompt.trim() || undefined,
      selectedModels: selectedModels,
    });
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    setPrompt(template.examplePrompt);
    setSystemPrompt(template.systemPrompt || "");
    
    // Set suggested models if available
    if (template.suggestedModels) {
      try {
        const models = JSON.parse(template.suggestedModels);
        setSelectedModels(models);
      } catch (e) {
        // Keep default models if parsing fails
      }
    }
  };

  const handleRating = (resultId: string, rating: number) => {
    updateRatingMutation.mutate({ resultId, userRating: rating });
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "anthropic":
        return "bg-orange-500";
      case "openai":
        return "bg-green-500";
      case "google":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Prompt Playground</h1>
        <p className="text-muted-foreground">
          Test your prompts across different AI models and compare their outputs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="playground">
            <Sparkles className="h-4 w-4 mr-2" />
            Playground
          </TabsTrigger>
          <TabsTrigger value="model-map">
            <BarChart3 className="h-4 w-4 mr-2" />
            Model Map
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Test</CardTitle>
              <CardDescription>
                Choose from templates or enter a custom prompt to test across AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTemplateDialogOpen(true)}
                    className="flex-1"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModelSelectorOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Models ({selectedModels.length})
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    System Prompt (optional)
                  </label>
                  <Textarea
                    placeholder="You are a helpful assistant..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    User Prompt
                  </label>
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
              disabled={createTestMutation.isPending || !prompt.trim()}
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
                  Test Prompt
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
                    Running prompt across all models...
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
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{result.modelName}</CardTitle>
                        <FavoriteButton
                          favoriteType="model"
                          favoriteId={result.modelName}
                          favoriteName={result.modelName}
                          metadata={JSON.stringify({ provider: result.provider })}
                          size="sm"
                          variant="ghost"
                        />
                      </div>
                      <Badge className={getProviderColor(result.provider)}>
                        {result.provider}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <div className="text-sm text-red-600">
                        <p className="font-medium">Error:</p>
                        <p>{result.errorMessage}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {resultsLoading && currentResults.length > 0 && currentResults.length < 3 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
              Waiting for remaining models...
            </div>
          )}
        </div>
      )}

      {tests.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Previous Tests</h2>
          <div className="space-y-2">
            {tests.slice(0, 10).map((test) => (
              <Card
                key={test.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setCurrentTestId(test.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">{test.prompt}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(test.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {currentTestId === test.id && (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
        </TabsContent>

        <TabsContent value="model-map">
          <ModelMapVisualization />
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Models</CardTitle>
              <CardDescription>
                Your starred models for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Model favorites will be listed here */}
                <p className="text-sm text-muted-foreground">
                  Click the star icon on model results to add them to your favorites.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TemplateLibraryDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
      />
      <ModelSelectorDialog
        open={modelSelectorOpen}
        onOpenChange={setModelSelectorOpen}
        selectedModels={selectedModels}
        onConfirm={setSelectedModels}
      />
    </div>
  );
}
