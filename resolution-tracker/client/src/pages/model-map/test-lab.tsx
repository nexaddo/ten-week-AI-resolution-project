import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Beaker, Play, Loader2, ChevronDown, ChevronUp, Star, Clock, DollarSign, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AiModel, UseCase, ModelTest, ModelTestResult } from "@shared/schema";
import { useLocation } from "wouter";

export default function TestLabPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const useCaseId = searchParams.get("useCase");

  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [testName, setTestName] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);

  // Fetch models
  const { data: models = [] } = useQuery<AiModel[]>({
    queryKey: ["/api/model-map/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/models");
      return res.json();
    },
  });

  // Fetch use case if selected
  const { data: selectedUseCase } = useQuery<UseCase>({
    queryKey: ["/api/model-map/use-cases", useCaseId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/model-map/use-cases/${useCaseId}`);
      return res.json();
    },
    enabled: !!useCaseId,
  });

  // Load use case template when selected
  useState(() => {
    if (selectedUseCase) {
      setPrompt(selectedUseCase.promptTemplate);
      setTestName(selectedUseCase.title);
    }
  });

  // Fetch test history
  const { data: testHistory = [] } = useQuery<ModelTest[]>({
    queryKey: ["/api/model-map/tests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/tests");
      return res.json();
    },
  });

  // Fetch results for current test
  const { data: currentResults = [], isLoading: resultsLoading } = useQuery<(ModelTestResult & { model: AiModel })[]>({
    queryKey: ["/api/model-map/tests", currentTestId, "results"],
    queryFn: async () => {
      if (!currentTestId) return [];
      const res = await apiRequest("GET", `/api/model-map/tests/${currentTestId}/results`);
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
    mutationFn: async (data: { title: string; prompt: string; systemPrompt?: string; selectedModelIds: string[]; useCaseId?: string }) => {
      const res = await apiRequest("POST", "/api/model-map/tests", data);
      return res.json();
    },
    onSuccess: (test: ModelTest) => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/tests"] });
      setCurrentTestId(test.id);
    },
  });

  const rateResultMutation = useMutation({
    mutationFn: async (data: { testId: string; resultId: string; userRating: number; userNotes?: string }) => {
      const { testId, resultId, ...body } = data;
      const res = await apiRequest("PATCH", `/api/model-map/tests/${testId}/results/${resultId}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/tests", currentTestId, "results"] });
    },
  });

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const handleRunTest = () => {
    if (!prompt.trim() || selectedModels.length === 0) return;
    createTestMutation.mutate({
      title: testName || "Untitled Test",
      prompt: prompt.trim(),
      systemPrompt: systemPrompt.trim() || undefined,
      selectedModelIds: selectedModels,
      useCaseId: useCaseId || undefined,
    });
  };

  const toggleResultExpand = (resultId: string) => {
    setExpandedResults((prev) => ({ ...prev, [resultId]: !prev[resultId] }));
  };

  // Group models by provider
  const modelsByProvider = models.reduce<Record<string, AiModel[]>>((acc, model) => {
    acc[model.provider] = acc[model.provider] || [];
    acc[model.provider].push(model);
    return acc;
  }, {});

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Lab</h1>
        <p className="text-muted-foreground">
          Run the same prompt against multiple models to compare their outputs side-by-side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                Configure Test
              </CardTitle>
              {selectedUseCase && (
                <CardDescription>
                  Using template: <span className="font-medium">{selectedUseCase.title}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  placeholder="e.g., Code Review Comparison"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="Set the context and behavior for the models..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">User Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your prompt here..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleRunTest}
                disabled={!prompt.trim() || selectedModels.length === 0 || createTestMutation.isPending}
                className="w-full"
              >
                {createTestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Test ({selectedModels.length} model{selectedModels.length !== 1 ? "s" : ""})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {currentTestId && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {resultsLoading
                    ? "Waiting for model responses..."
                    : `${currentResults.length} of ${selectedModels.length} complete`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentResults.map((result) => (
                  <Card key={result.id} className="border-muted">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{result.model?.name}</CardTitle>
                          <Badge variant="outline">{result.model?.provider}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {result.latencyMs && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {(result.latencyMs / 1000).toFixed(2)}s
                            </span>
                          )}
                          {result.totalTokens && (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {result.totalTokens} tokens
                            </span>
                          )}
                          {result.estimatedCost && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${result.estimatedCost}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`prose prose-sm dark:prose-invert max-w-none ${
                          expandedResults[result.id] ? "" : "line-clamp-4"
                        }`}
                      >
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
                          {result.output || result.errorMessage || "Waiting..."}
                        </pre>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleResultExpand(result.id)}
                        >
                          {expandedResults[result.id] ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Collapse
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Expand
                            </>
                          )}
                        </Button>

                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground mr-2">Rate:</span>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              variant={result.userRating === rating ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() =>
                                rateResultMutation.mutate({
                                  testId: currentTestId,
                                  resultId: result.id,
                                  userRating: rating,
                                })
                              }
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {resultsLoading && currentResults.length < selectedModels.length && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">
                      Waiting for {selectedModels.length - currentResults.length} more response(s)...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Model Selection Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Models</CardTitle>
              <CardDescription>
                Choose which models to test against
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
                <div key={provider} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{provider}</h4>
                  {providerModels.map((model) => (
                    <div key={model.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={model.id}
                        checked={selectedModels.includes(model.id)}
                        onCheckedChange={() => handleModelToggle(model.id)}
                      />
                      <label
                        htmlFor={model.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {model.name}
                      </label>
                    </div>
                  ))}
                </div>
              ))}

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedModels(models.map((m) => m.id))}
                >
                  Select All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tests</CardTitle>
            </CardHeader>
            <CardContent>
              {testHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests yet</p>
              ) : (
                <div className="space-y-2">
                  {testHistory.slice(0, 5).map((test) => (
                    <div
                      key={test.id}
                      className={`p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                        currentTestId === test.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setCurrentTestId(test.id)}
                    >
                      <p className="text-sm font-medium line-clamp-1">{test.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
