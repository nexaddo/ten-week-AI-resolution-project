import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";

interface EmptyStateProps {
  onAddNew: () => void;
}

export function EmptyState({ onAddNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Target className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2" data-testid="text-empty-title">
        No resolutions yet
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start your journey toward achieving your goals. Add your first resolution and track your progress throughout the year.
      </p>
      <Button onClick={onAddNew} data-testid="button-add-first-resolution">
        <Plus className="h-4 w-4 mr-2" />
        Add Your First Resolution
      </Button>
    </div>
  );
}
