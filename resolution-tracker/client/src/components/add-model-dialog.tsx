import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Cpu, Wrench } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ModelAvatar } from "./model-avatar";
import type { AiModel, AiTool, UserModel, UserTool } from "@shared/schema";

interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModelsChanged?: () => void;
}

export function AddModelDialog({ open, onOpenChange, onModelsChanged }: AddModelDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("models");

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

  // Fetch user's selected models
  const { data: userModels = [] } = useQuery<(UserModel & { model: AiModel })[]>({
    queryKey: ["/api/model-map/user/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/models");
      return res.json();
    },
  });

  // Fetch user's selected tools
  const { data: userTools = [] } = useQuery<(UserTool & { tool: AiTool })[]>({
    queryKey: ["/api/model-map/user/tools"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/tools");
      return res.json();
    },
  });

  // Add model mutation
  const addModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const res = await apiRequest("POST", "/api/model-map/user/models", { modelId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/user/models"] });
      onModelsChanged?.();
    },
  });

  // Remove model mutation
  const removeModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      await apiRequest("DELETE", `/api/model-map/user/models/${modelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/user/models"] });
      onModelsChanged?.();
    },
  });

  // Add tool mutation
  const addToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      const res = await apiRequest("POST", "/api/model-map/user/tools", { toolId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/user/tools"] });
      onModelsChanged?.();
    },
  });

  // Remove tool mutation
  const removeToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      await apiRequest("DELETE", `/api/model-map/user/tools/${toolId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/user/tools"] });
      onModelsChanged?.();
    },
  });

  const userModelIds = new Set(userModels.map((um) => um.modelId));
  const userToolIds = new Set(userTools.map((ut) => ut.toolId));

  const filteredModels = allModels.filter((model) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.provider.toLowerCase().includes(query)
    );
  });

  const filteredTools = allTools.filter((tool) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.provider.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add to Your List</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
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

          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "models" ? "Search models..." : "Search tools..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <TabsContent value="models" className="flex-1 overflow-y-auto m-0 -mx-2 px-2">
            <div className="space-y-1">
              {filteredModels.map((model) => {
                const isAdded = userModelIds.has(model.id);
                return (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ModelAvatar
                        name={model.name}
                        shortName={model.shortName}
                        provider={model.provider}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{model.name}</p>
                        <p className="text-xs text-muted-foreground">{model.provider}</p>
                      </div>
                    </div>
                    <Button
                      variant={isAdded ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        isAdded
                          ? removeModelMutation.mutate(model.id)
                          : addModelMutation.mutate(model.id)
                      }
                      disabled={addModelMutation.isPending || removeModelMutation.isPending}
                      className="shrink-0"
                    >
                      {isAdded ? "Remove" : "Add"}
                    </Button>
                  </div>
                );
              })}
              {filteredModels.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No models found
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="flex-1 overflow-y-auto m-0 -mx-2 px-2">
            <div className="space-y-1">
              {filteredTools.map((tool) => {
                const isAdded = userToolIds.has(tool.id);
                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ModelAvatar
                        name={tool.name}
                        shortName={tool.shortName}
                        provider={tool.provider}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.provider}</p>
                      </div>
                    </div>
                    <Button
                      variant={isAdded ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        isAdded
                          ? removeToolMutation.mutate(tool.id)
                          : addToolMutation.mutate(tool.id)
                      }
                      disabled={addToolMutation.isPending || removeToolMutation.isPending}
                      className="shrink-0"
                    >
                      {isAdded ? "Remove" : "Add"}
                    </Button>
                  </div>
                );
              })}
              {filteredTools.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No tools found
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
