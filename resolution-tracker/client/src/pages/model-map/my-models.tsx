import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Cpu, Wrench, ExternalLink, Star, Check, X, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AiModel, AiTool, UserModel, UserTool } from "@shared/schema";

export default function MyModelsPage() {
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
    },
  });

  // Remove model mutation
  const removeModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      await apiRequest("DELETE", `/api/model-map/user/models/${modelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/user/models"] });
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
    },
  });

  // Remove tool mutation
  const removeToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      await apiRequest("DELETE", `/api/model-map/user/tools/${toolId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/user/tools"] });
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
      tool.provider.toLowerCase().includes(query) ||
      tool.category?.toLowerCase().includes(query)
    );
  });

  // Group models by provider
  const modelsByProvider = filteredModels.reduce<Record<string, AiModel[]>>((acc, model) => {
    acc[model.provider] = acc[model.provider] || [];
    acc[model.provider].push(model);
    return acc;
  }, {});

  // Group tools by category
  const toolsByCategory = filteredTools.reduce<Record<string, AiTool[]>>((acc, tool) => {
    const category = tool.category || "Other";
    acc[category] = acc[category] || [];
    acc[category].push(tool);
    return acc;
  }, {});

  const providerColors: Record<string, string> = {
    "Anthropic": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "OpenAI": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Google": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "DeepSeek": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Models & Tools</h1>
        <p className="text-muted-foreground">
          Build your personal AI toolkit. Select the models and tools you use regularly to track performance across use cases.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Models Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userModels.length}</div>
            <p className="text-sm text-muted-foreground">
              of {allModels.length} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Tools Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userTools.length}</div>
            <p className="text-sm text-muted-foreground">
              of {allTools.length} available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models and tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="models" className="gap-2">
            <Cpu className="h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-2">
            <Wrench className="h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          {/* User's Selected Models */}
          {userModels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  My Models
                </CardTitle>
                <CardDescription>
                  Your selected models for testing and comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userModels.map((um) => (
                    <Badge
                      key={um.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-1.5 px-3 text-sm"
                    >
                      {um.model.name}
                      <button
                        onClick={() => removeModelMutation.mutate(um.modelId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Available Models */}
          {Object.entries(modelsByProvider).map(([provider, models]) => (
            <Card key={provider}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={providerColors[provider] || "bg-gray-100"}>
                    {provider}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {models.map((model) => {
                    const isAdded = userModelIds.has(model.id);
                    return (
                      <div
                        key={model.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isAdded ? "border-primary bg-primary/5" : "border-muted"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{model.name}</p>
                          {model.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {model.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={isAdded ? "ghost" : "outline"}
                          size="sm"
                          onClick={() =>
                            isAdded
                              ? removeModelMutation.mutate(model.id)
                              : addModelMutation.mutate(model.id)
                          }
                          disabled={addModelMutation.isPending || removeModelMutation.isPending}
                        >
                          {isAdded ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          {/* User's Selected Tools */}
          {userTools.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  My Tools
                </CardTitle>
                <CardDescription>
                  Your selected AI tools and applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userTools.map((ut) => (
                    <Badge
                      key={ut.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-1.5 px-3 text-sm"
                    >
                      {ut.tool.name}
                      <button
                        onClick={() => removeToolMutation.mutate(ut.toolId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Available Tools */}
          {Object.entries(toolsByCategory).map(([category, tools]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tools.map((tool) => {
                    const isAdded = userToolIds.has(tool.id);
                    return (
                      <div
                        key={tool.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isAdded ? "border-primary bg-primary/5" : "border-muted"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{tool.name}</p>
                            {tool.url && (
                              <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{tool.provider}</p>
                        </div>
                        <Button
                          variant={isAdded ? "ghost" : "outline"}
                          size="sm"
                          onClick={() =>
                            isAdded
                              ? removeToolMutation.mutate(tool.id)
                              : addToolMutation.mutate(tool.id)
                          }
                          disabled={addToolMutation.isPending || removeToolMutation.isPending}
                        >
                          {isAdded ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
