import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Beaker, Plus, ChevronDown, Trash2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ModelAvatar } from "@/components/model-avatar";
import { CreateTestDialog } from "@/components/create-test-dialog";
import { CompleteTestDialog } from "@/components/complete-test-dialog";
import type { AiModel, AiTool, ModelTest, ModelTestResult, UseCase } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Extended types for populated data
type PopulatedTestResult = ModelTestResult & { model?: AiModel; tool?: AiTool };
type PopulatedTest = ModelTest & { results?: PopulatedTestResult[]; useCase?: { category: string } };

export default function TestLabPage() {
  const [location] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PopulatedTest | null>(null);
  const [selectedResult, setSelectedResult] = useState<PopulatedTestResult | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
  const [addingModelsToTest, setAddingModelsToTest] = useState<PopulatedTest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelsToAdd, setSelectedModelsToAdd] = useState<string[]>([]);
  const [selectedToolsToAdd, setSelectedToolsToAdd] = useState<string[]>([]);

  // Extract useCase from query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const useCaseId = params.get("useCase");
    if (useCaseId) {
      setSelectedUseCaseId(useCaseId);
      setCreateDialogOpen(true);
    }
  }, []);

  // Fetch tests with results
  const { data: tests = [], isLoading } = useQuery<PopulatedTest[]>({
    queryKey: ["/api/model-map/tests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/tests?includeResults=true");
      return res.json();
    },
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      await apiRequest("DELETE", `/api/model-map/tests/${testId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/tests"] });
      setDeleteTestId(null);
    },
  });

  // Fetch all available models
  const { data: allModels = [] } = useQuery<AiModel[]>({
    queryKey: ["/api/model-map/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/models");
      return res.json();
    },
  });

  // Fetch all available tools
  const { data: allTools = [] } = useQuery<AiTool[]>({
    queryKey: ["/api/model-map/tools"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/tools");
      return res.json();
    },
  });

  // Add models to existing test mutation
  const addModelsToTestMutation = useMutation({
    mutationFn: async (data: { testId: string; modelIds: string[]; toolIds: string[] }) => {
      const { testId, modelIds, toolIds } = data;

      // Create test results for each new model
      for (const modelId of modelIds) {
        await apiRequest("POST", `/api/model-map/tests/${testId}/results`, {
          modelId,
          status: "pending",
        });
      }

      // Create test results for each new tool
      for (const toolId of toolIds) {
        await apiRequest("POST", `/api/model-map/tests/${testId}/results`, {
          toolId,
          status: "pending",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/tests"] });
      setAddingModelsToTest(null);
      setSelectedModelsToAdd([]);
      setSelectedToolsToAdd([]);
      setSearchQuery("");
    },
  });

  const togglePromptExpanded = (testId: string) => {
    setExpandedPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  const handleResultClick = (test: PopulatedTest, result: PopulatedTestResult) => {
    setSelectedTest(test);
    setSelectedResult(result);
    setCompleteDialogOpen(true);
  };

  const getStatusBadge = (test: PopulatedTest) => {
    const results = test.results || [];
    const completed = results.filter((r) => r.status === "completed" || r.userRating);
    const pending = results.filter((r) => r.status === "pending" && !r.userRating);

    if (pending.length === results.length) {
      return <Badge variant="outline">Pending</Badge>;
    }
    if (completed.length === results.length) {
      return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700">In Progress</Badge>;
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      "Strategic Analysis": "bg-purple-100 text-purple-700",
      "Writing": "bg-blue-100 text-blue-700",
      "Code": "bg-green-100 text-green-700",
      "Research": "bg-amber-100 text-amber-700",
      "Automation": "bg-cyan-100 text-cyan-700",
      "Visual Design": "bg-pink-100 text-pink-700",
      "Audio/Video": "bg-red-100 text-red-700",
    };
    return colors[category || ""] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Beaker className="h-8 w-8" />
            Test Lab
          </h1>
          <p className="text-muted-foreground">
            Run prompts against your models and log the results
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Start a New Test
        </Button>
      </div>

      {/* Test List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading tests...
        </div>
      ) : tests.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first test to start comparing models
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start a New Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tests.map((test) => (
            <Card key={test.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {test.useCase?.category && (
                      <Badge className={getCategoryColor(test.useCase.category)}>
                        {test.useCase.category}
                      </Badge>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{test.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(test.createdAt).toLocaleDateString()} at{" "}
                        {new Date(test.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingModelsToTest(test)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Test More Models
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTestId(test.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Model Result Cards */}
                <div className="flex flex-wrap gap-3">
                  {(test.results || []).map((result) => {
                    const item = result.model || result.tool;
                    const hasRating = result.userRating || result.accuracyRating;
                    return (
                      <div
                        key={result.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors min-w-[200px]"
                        onClick={() => handleResultClick(test, result)}
                      >
                        <ModelAvatar
                          name={item?.name || "Unknown"}
                          shortName={item?.shortName}
                          provider={item?.provider || ""}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item?.provider}
                          </p>
                          {!hasRating && (
                            <p className="text-xs text-primary mt-1">
                              Click to add results
                            </p>
                          )}
                          {hasRating && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Rated: {result.accuracyRating || result.userRating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View Prompt Accordion */}
                <Collapsible
                  open={expandedPrompts.has(test.id)}
                  onOpenChange={() => togglePromptExpanded(test.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                      View Prompt
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedPrompts.has(test.id) ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-muted rounded-lg p-4">
                      {test.systemPrompt && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            System Prompt
                          </p>
                          <pre className="text-sm whitespace-pre-wrap">
                            {test.systemPrompt}
                          </pre>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          User Prompt
                        </p>
                        <pre className="text-sm whitespace-pre-wrap">{test.prompt}</pre>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Test Dialog */}
      <CreateTestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        selectedUseCaseId={selectedUseCaseId}
        onSelectUseCaseChange={setSelectedUseCaseId}
      />

      {/* Complete Test Dialog */}
      <CompleteTestDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        test={selectedTest}
        result={selectedResult}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/model-map/tests"] });
        }}
      />

      {/* Add Models to Test Dialog */}
      <Dialog open={!!addingModelsToTest} onOpenChange={(open) => {
        if (!open) {
          setAddingModelsToTest(null);
          setSelectedModelsToAdd([]);
          setSelectedToolsToAdd([]);
          setSearchQuery("");
        }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add More Models to Test</DialogTitle>
          </DialogHeader>

          {addingModelsToTest && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Test Info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">{addingModelsToTest.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {addingModelsToTest.useCaseId ? "Linked to a use case" : "Custom test"}
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models or tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Models Section */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Models</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {allModels
                    .filter(m => !addingModelsToTest.results?.some(r => r.modelId === m.id))
                    .filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((model) => (
                      <div key={model.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={selectedModelsToAdd.includes(model.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedModelsToAdd([...selectedModelsToAdd, model.id]);
                            } else {
                              setSelectedModelsToAdd(selectedModelsToAdd.filter(id => id !== model.id));
                            }
                          }}
                        />
                        <ModelAvatar
                          name={model.name}
                          shortName={model.shortName}
                          provider={model.provider}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{model.name}</p>
                          <p className="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Tools Section */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Tools</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {allTools
                    .filter(t => !addingModelsToTest.results?.some(r => r.toolId === t.id))
                    .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((tool) => (
                      <div key={tool.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={selectedToolsToAdd.includes(tool.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedToolsToAdd([...selectedToolsToAdd, tool.id]);
                            } else {
                              setSelectedToolsToAdd(selectedToolsToAdd.filter(id => id !== tool.id));
                            }
                          }}
                        />
                        <ModelAvatar
                          name={tool.name}
                          shortName={tool.shortName}
                          provider={tool.provider}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">{tool.provider}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingModelsToTest(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (addingModelsToTest && (selectedModelsToAdd.length > 0 || selectedToolsToAdd.length > 0)) {
                  addModelsToTestMutation.mutate({
                    testId: addingModelsToTest.id,
                    modelIds: selectedModelsToAdd,
                    toolIds: selectedToolsToAdd,
                  });
                  setSelectedModelsToAdd([]);
                  setSelectedToolsToAdd([]);
                  setSearchQuery("");
                }
              }}
              disabled={selectedModelsToAdd.length === 0 && selectedToolsToAdd.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTestId} onOpenChange={() => setDeleteTestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the test and all its results. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTestId && deleteTestMutation.mutate(deleteTestId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
