import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Star, ArrowRight, Cpu } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ModelAvatar } from "@/components/model-avatar";
import { AddModelDialog } from "@/components/add-model-dialog";
import type { AiModel, AiTool, UserModel, UserTool, ModelTestResult } from "@shared/schema";

// Extended type for user models with stats
type UserModelWithStats = UserModel & {
  model: AiModel;
  stats?: {
    testCount: number;
    avgOverall: number;
    avgAccuracy: number;
    avgStyle: number;
  };
};

type UserToolWithStats = UserTool & {
  tool: AiTool;
  stats?: {
    testCount: number;
    avgOverall: number;
    avgAccuracy: number;
    avgStyle: number;
  };
};

// Star rating display component
function StarDisplay({ rating, maxStars = 5 }: { rating: number; maxStars?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.floor(rating)
              ? "text-amber-400 fill-amber-400"
              : i < rating
              ? "text-amber-400 fill-amber-400 opacity-50"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

// Model performance card component
function ModelCard({
  name,
  shortName,
  provider,
  testCount,
  avgOverall,
  avgAccuracy,
  avgStyle,
  onClick,
}: {
  name: string;
  shortName?: string | null;
  provider: string;
  testCount: number;
  avgOverall: number;
  avgAccuracy: number;
  avgStyle: number;
  onClick?: () => void;
}) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <ModelAvatar
            name={name}
            shortName={shortName}
            provider={provider}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{name}</h3>
            <p className="text-sm text-muted-foreground">{provider}</p>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Overall
            </span>
            <span className="text-sm font-semibold">
              {avgOverall.toFixed(1)}/5
            </span>
          </div>
          <StarDisplay rating={avgOverall} />
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Accuracy</p>
            <p className="text-sm font-semibold">{avgAccuracy.toFixed(1)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Style</p>
            <p className="text-sm font-semibold">{avgStyle.toFixed(1)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {testCount} test{testCount !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-primary hover:bg-transparent"
            onClick={onClick}
          >
            View Details
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyModelsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<UserModelWithStats | null>(null);
  const [selectedTool, setSelectedTool] = useState<UserToolWithStats | null>(null);

  // Fetch user's models with stats
  const { data: userModels = [] } = useQuery<UserModelWithStats[]>({
    queryKey: ["/api/model-map/user/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/models?includeStats=true");
      return res.json();
    },
  });

  // Fetch user's tools with stats
  const { data: userTools = [] } = useQuery<UserToolWithStats[]>({
    queryKey: ["/api/model-map/user/tools"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/tools?includeStats=true");
      return res.json();
    },
  });

  const hasItems = userModels.length > 0 || userTools.length > 0;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Models</h1>
          <p className="text-muted-foreground">
            Your personal AI model roster with performance insights
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Models
        </Button>
      </div>

      {/* Empty State */}
      {!hasItems && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No models added yet</h3>
            <p className="text-muted-foreground mb-4">
              Add models to your roster to track their performance across tests
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Model
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Models Grid */}
      {userModels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userModels.map((um) => (
            <ModelCard
              key={um.id}
              name={um.model.name}
              shortName={um.model.shortName}
              provider={um.model.provider}
              testCount={um.stats?.testCount || 0}
              avgOverall={um.stats?.avgOverall || 0}
              avgAccuracy={um.stats?.avgAccuracy || 0}
              avgStyle={um.stats?.avgStyle || 0}
              onClick={() => setSelectedModel(um)}
            />
          ))}
        </div>
      )}

      {/* Tools Section */}
      {userTools.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-10 mb-4">My Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTools.map((ut) => (
              <ModelCard
                key={ut.id}
                name={ut.tool.name}
                shortName={ut.tool.shortName}
                provider={ut.tool.provider}
                testCount={ut.stats?.testCount || 0}
                avgOverall={ut.stats?.avgOverall || 0}
                avgAccuracy={ut.stats?.avgAccuracy || 0}
                avgStyle={ut.stats?.avgStyle || 0}
                onClick={() => setSelectedTool(ut)}
              />
            ))}
          </div>
        </>
      )}

      {/* Add Model Dialog */}
      <AddModelDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Model Detail Dialog */}
      <Dialog open={!!selectedModel} onOpenChange={(open) => !open && setSelectedModel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Model Details</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <ModelAvatar
                  name={selectedModel.model.name}
                  shortName={selectedModel.model.shortName}
                  provider={selectedModel.model.provider}
                  size="lg"
                />
                <div>
                  <h3 className="font-semibold text-lg">{selectedModel.model.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedModel.model.provider}</p>
                </div>
              </div>

              {selectedModel.model.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm">{selectedModel.model.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Overall Rating</p>
                  <p className="text-lg font-semibold">{selectedModel.stats?.avgOverall.toFixed(1) || "0"}/5</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Test Count</p>
                  <p className="text-lg font-semibold">{selectedModel.stats?.testCount || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                  <p className="font-semibold">{selectedModel.stats?.avgAccuracy.toFixed(1) || "0"}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Style</p>
                  <p className="font-semibold">{selectedModel.stats?.avgStyle.toFixed(1) || "0"}</p>
                </div>
              </div>

              {selectedModel.model.capabilities && selectedModel.model.capabilities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Capabilities
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedModel.model.capabilities.map((cap) => (
                      <span key={cap} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tool Detail Dialog */}
      <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tool Details</DialogTitle>
          </DialogHeader>
          {selectedTool && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <ModelAvatar
                  name={selectedTool.tool.name}
                  shortName={selectedTool.tool.shortName}
                  provider={selectedTool.tool.provider}
                  size="lg"
                />
                <div>
                  <h3 className="font-semibold text-lg">{selectedTool.tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTool.tool.provider}</p>
                </div>
              </div>

              {selectedTool.tool.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm">{selectedTool.tool.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Overall Rating</p>
                  <p className="text-lg font-semibold">{selectedTool.stats?.avgOverall.toFixed(1) || "0"}/5</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Test Count</p>
                  <p className="text-lg font-semibold">{selectedTool.stats?.testCount || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                  <p className="font-semibold">{selectedTool.stats?.avgAccuracy.toFixed(1) || "0"}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Style</p>
                  <p className="font-semibold">{selectedTool.stats?.avgStyle.toFixed(1) || "0"}</p>
                </div>
              </div>

              {selectedTool.tool.url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(selectedTool.tool.url ?? undefined, "_blank")}
                >
                  Visit Tool Website
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
