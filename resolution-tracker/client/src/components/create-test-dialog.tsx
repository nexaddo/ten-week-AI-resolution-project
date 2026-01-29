import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Cpu, Wrench, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ModelAvatar } from "./model-avatar";
import type { AiModel, AiTool, UseCase, UserModel, UserTool } from "@shared/schema";

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestCreated?: (testId: string) => void;
  selectedUseCaseId?: string | null;
  onSelectUseCaseChange?: (useCaseId: string | null) => void;
}

export function CreateTestDialog({ open, onOpenChange, onTestCreated, selectedUseCaseId: initialUseCaseId, onSelectUseCaseChange }: CreateTestDialogProps) {
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string>(initialUseCaseId || "");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("models");
  const [showNewUseCase, setShowNewUseCase] = useState(false);
  const [newUseCaseTitle, setNewUseCaseTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");

  // Update parent when useCase selection changes
  useEffect(() => {
    onSelectUseCaseChange?.(selectedUseCaseId || null);
  }, [selectedUseCaseId, onSelectUseCaseChange]);

  // Fetch use cases
  const { data: useCases = [] } = useQuery<UseCase[]>({
    queryKey: ["/api/model-map/use-cases"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/use-cases");
      return res.json();
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

  // Fetch user's models (to show favorites first)
  const { data: userModels = [] } = useQuery<(UserModel & { model: AiModel })[]>({
    queryKey: ["/api/model-map/user/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/models");
      return res.json();
    },
  });

  // Fetch user's tools
  const { data: userTools = [] } = useQuery<(UserTool & { tool: AiTool })[]>({
    queryKey: ["/api/model-map/user/tools"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/tools");
      return res.json();
    },
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (data: { useCaseId?: string; title: string; prompt: string; systemPrompt?: string; modelIds: string[]; toolIds: string[] }) => {
      const { modelIds, toolIds, ...testData } = data;
      // Create the test
      const res = await apiRequest("POST", "/api/model-map/tests", testData);
      const test = await res.json();

      // Create test results for each model
      for (const modelId of modelIds) {
        await apiRequest("POST", `/api/model-map/tests/${test.id}/results`, {
          modelId,
          status: "pending",
        });
      }

      // Create test results for each tool
      for (const toolId of toolIds) {
        await apiRequest("POST", `/api/model-map/tests/${test.id}/results`, {
          toolId,
          status: "pending",
        });
      }

      return test;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/tests"] });
      onTestCreated?.(data.id);
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedUseCaseId("");
    setSelectedModels([]);
    setSelectedTools([]);
    setSearchQuery("");
    setShowNewUseCase(false);
    setNewUseCaseTitle("");
    setSystemPrompt("");
    setUserPrompt("");
  };

  // Reset form when dialog opens, but keep the initial useCase if provided
  useEffect(() => {
    if (open) {
      if (initialUseCaseId) {
        setSelectedUseCaseId(initialUseCaseId);
        setSelectedModels([]);
        setSelectedTools([]);
        setSearchQuery("");
        setShowNewUseCase(false);
        setNewUseCaseTitle("");
        setSystemPrompt("");
        setUserPrompt("");
      } else {
        resetForm();
      }
    }
  }, [open, initialUseCaseId]);

  const userModelIds = new Set(userModels.map((um) => um.modelId));
  const userToolIds = new Set(userTools.map((ut) => ut.toolId));

  // Sort models: user's models first, then by favorite status
  const sortedModels = [...allModels].sort((a, b) => {
    const aIsUser = userModelIds.has(a.id);
    const bIsUser = userModelIds.has(b.id);
    if (aIsUser && !bIsUser) return -1;
    if (!aIsUser && bIsUser) return 1;
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });

  // Sort tools: user's tools first
  const sortedTools = [...allTools].sort((a, b) => {
    const aIsUser = userToolIds.has(a.id);
    const bIsUser = userToolIds.has(b.id);
    if (aIsUser && !bIsUser) return -1;
    if (!aIsUser && bIsUser) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredModels = sortedModels.filter((model) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.provider.toLowerCase().includes(query)
    );
  });

  const filteredTools = sortedTools.filter((tool) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.provider.toLowerCase().includes(query)
    );
  });

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  };

  const selectedUseCase = useCases.find((uc) => uc.id === selectedUseCaseId);

  const handleCreateTest = () => {
    const title = selectedUseCase?.title || newUseCaseTitle || "Untitled Test";
    createTestMutation.mutate({
      useCaseId: selectedUseCaseId || undefined,
      title,
      prompt: userPrompt,
      systemPrompt: systemPrompt || undefined,
      modelIds: selectedModels,
      toolIds: selectedTools,
    });
  };

  const canCreate = (selectedModels.length > 0 || selectedTools.length > 0) &&
    (selectedUseCaseId || newUseCaseTitle) &&
    userPrompt.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Create New Test Session
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Use Case Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Use Case</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewUseCase(!showNewUseCase)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>

            {showNewUseCase ? (
              <Input
                placeholder="Enter a title for your test..."
                value={newUseCaseTitle}
                onChange={(e) => setNewUseCaseTitle(e.target.value)}
              />
            ) : (
              <Select value={selectedUseCaseId} onValueChange={setSelectedUseCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a use case to test..." />
                </SelectTrigger>
                <SelectContent>
                  {useCases.map((useCase) => (
                    <SelectItem key={useCase.id} value={useCase.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                          {useCase.category}
                        </span>
                        {useCase.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>System Prompt (Optional)</Label>
            <Textarea
              placeholder="Set the context and behavior for the models..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-prompt">User Prompt</Label>
            <Textarea
              id="user-prompt"
              placeholder="Enter your prompt to test across models..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* Model/Tool Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Models to Test</Label>
              <Button variant="outline" size="sm" disabled>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="models" className="gap-2">
                  <Cpu className="h-4 w-4" />
                  Models
                </TabsTrigger>
                <TabsTrigger value="tools" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  Tools
                </TabsTrigger>
              </TabsList>

              <div className="relative my-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "models" ? "Search models..." : "Search tools..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <TabsContent value="models" className="max-h-[250px] overflow-y-auto m-0 -mx-1 px-1">
                <div className="space-y-1">
                  {filteredModels.map((model) => {
                    const isSelected = selectedModels.includes(model.id);
                    const isUserModel = userModelIds.has(model.id);
                    return (
                      <div
                        key={model.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleModel(model.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleModel(model.id)}
                          className="pointer-events-none"
                        />
                        <ModelAvatar
                          name={model.name}
                          shortName={model.shortName}
                          provider={model.provider}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{model.name}</p>
                            {model.isFavorite && (
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="tools" className="max-h-[250px] overflow-y-auto m-0 -mx-1 px-1">
                <div className="space-y-1">
                  {filteredTools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleTool(tool.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTool(tool.id)}
                          className="pointer-events-none"
                        />
                        <ModelAvatar
                          name={tool.name}
                          shortName={tool.shortName}
                          provider={tool.provider}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">{tool.provider}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Selection Summary */}
          {(selectedModels.length > 0 || selectedTools.length > 0) && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedModels.length} model{selectedModels.length !== 1 ? "s" : ""}
              {selectedTools.length > 0 && `, ${selectedTools.length} tool${selectedTools.length !== 1 ? "s" : ""}`}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTest}
            disabled={!canCreate || createTestMutation.isPending}
          >
            <Cpu className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
