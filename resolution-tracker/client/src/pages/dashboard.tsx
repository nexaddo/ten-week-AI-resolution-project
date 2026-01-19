import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/stats-cards";
import { ResolutionCard } from "@/components/resolution-card";
import { AddResolutionDialog } from "@/components/add-resolution-dialog";
import { CheckInDialog } from "@/components/check-in-dialog";
import { AiInsightsCard } from "@/components/ai-insights-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Resolution, Category, InsertResolution, InsertCheckIn } from "@shared/schema";

interface DashboardProps {
  selectedCategory: Category | null;
}

export function Dashboard({ selectedCategory }: DashboardProps) {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [editingResolution, setEditingResolution] = useState<Resolution | null>(null);
  const [checkInResolution, setCheckInResolution] = useState<Resolution | null>(null);
  const [lastCheckInId, setLastCheckInId] = useState<string | null>(null);

  const { data: resolutions = [], isLoading } = useQuery<Resolution[]>({
    queryKey: ["/api/resolutions"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertResolution) => {
      const res = await apiRequest("POST", "/api/resolutions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolutions"] });
      setAddDialogOpen(false);
      toast({ title: "Resolution created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create resolution", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertResolution> }) => {
      const res = await apiRequest("PATCH", `/api/resolutions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolutions"] });
      setAddDialogOpen(false);
      setEditingResolution(null);
      toast({ title: "Resolution updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update resolution", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/resolutions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolutions"] });
      toast({ title: "Resolution deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete resolution", variant: "destructive" });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({
      resolutionId,
      note,
      progress
    }: {
      resolutionId: string;
      note: string;
      progress: number;
    }) => {
      const checkInRes = await apiRequest("POST", "/api/check-ins", {
        resolutionId,
        note,
        date: new Date().toISOString().split("T")[0],
      } as InsertCheckIn);
      const checkInData = await checkInRes.json();
      const updateRes = await apiRequest("PATCH", `/api/resolutions/${resolutionId}`, {
        progress,
        status: progress === 100 ? "completed" : "in_progress",
      });
      await updateRes.json();
      return checkInData;
    },
    onSuccess: (checkInData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolutions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      setCheckInDialogOpen(false);
      setCheckInResolution(null);
      setLastCheckInId(checkInData.id);
      toast({ title: "Check-in saved! AI is analyzing...", description: "Scroll down to see AI insights as they arrive." });
    },
    onError: () => {
      toast({ title: "Failed to log check-in", variant: "destructive" });
    },
  });

  const handleAddResolution = (data: InsertResolution) => {
    if (editingResolution) {
      updateMutation.mutate({ id: editingResolution.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (resolution: Resolution) => {
    setEditingResolution(resolution);
    setAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleMarkComplete = (id: string) => {
    updateMutation.mutate({ 
      id, 
      data: { status: "completed", progress: 100 } 
    });
  };

  const handleAddCheckIn = (resolution: Resolution) => {
    setCheckInResolution(resolution);
    setCheckInDialogOpen(true);
  };

  const handleCheckInSubmit = (data: { note: string; progress: number }) => {
    if (!checkInResolution) return;
    checkInMutation.mutate({
      resolutionId: checkInResolution.id,
      note: data.note,
      progress: data.progress,
    });
  };

  const filteredResolutions = selectedCategory
    ? resolutions.filter((r) => r.category === selectedCategory)
    : resolutions;

  const currentYear = new Date().getFullYear();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-dashboard-title">
            {currentYear} Resolutions
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your goals and achieve more this year
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingResolution(null);
            setAddDialogOpen(true);
          }}
          data-testid="button-add-resolution"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Resolution
        </Button>
      </div>

      <StatsCards resolutions={resolutions} />

      {filteredResolutions.length === 0 ? (
        <EmptyState 
          onAddNew={() => {
            setEditingResolution(null);
            setAddDialogOpen(true);
          }} 
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResolutions.map((resolution) => (
            <ResolutionCard
              key={resolution.id}
              resolution={resolution}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkComplete={handleMarkComplete}
              onAddCheckIn={handleAddCheckIn}
            />
          ))}
        </div>
      )}

      {lastCheckInId && (
        <div className="mt-6">
          <AiInsightsCard checkInId={lastCheckInId} />
        </div>
      )}

      <AddResolutionDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditingResolution(null);
        }}
        onSubmit={handleAddResolution}
        editingResolution={editingResolution}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <CheckInDialog
        open={checkInDialogOpen}
        onOpenChange={(open) => {
          setCheckInDialogOpen(open);
          if (!open) setCheckInResolution(null);
        }}
        resolution={checkInResolution}
        onSubmit={handleCheckInSubmit}
        isSubmitting={checkInMutation.isPending}
      />
    </div>
  );
}
