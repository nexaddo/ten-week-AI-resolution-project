import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Sparkles, Turtle, Zap, Timer } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ModelAvatar } from "./model-avatar";
import type { AiModel, AiTool, ModelTest, ModelTestResult, SpeedRating } from "@shared/schema";

interface CompleteTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: ModelTest | null;
  result: (ModelTestResult & { model?: AiModel; tool?: AiTool }) | null;
  onSaved?: () => void;
}

// Star rating component
function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hovered || value)
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// X-Factor sparkles rating
function XFactorRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <Label>X-Factor</Label>
      <div className="flex gap-1">
        {[1, 2, 3].map((sparkle) => (
          <button
            key={sparkle}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(sparkle)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(sparkle)}
          >
            <Sparkles
              className={`h-6 w-6 transition-colors ${
                sparkle <= (hovered || value)
                  ? "text-purple-400 fill-purple-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// Speed rating selector
function SpeedSelector({
  value,
  onChange,
}: {
  value: SpeedRating | null;
  onChange: (value: SpeedRating) => void;
}) {
  const options: { value: SpeedRating; label: string; icon: typeof Turtle; color: string }[] = [
    { value: "slow", label: "Slow", icon: Turtle, color: "text-orange-500 border-orange-500 bg-orange-50" },
    { value: "medium", label: "Medium", icon: Timer, color: "text-blue-500 border-blue-500 bg-blue-50" },
    { value: "fast", label: "Fast", icon: Zap, color: "text-green-500 border-green-500 bg-green-50" },
  ];

  return (
    <div className="space-y-2">
      <Label>Speed</Label>
      <div className="flex gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all text-sm font-medium ${
                isSelected
                  ? option.color
                  : "border-muted text-muted-foreground hover:border-muted-foreground"
              }`}
              onClick={() => onChange(option.value)}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompleteTestDialog({
  open,
  onOpenChange,
  test,
  result,
  onSaved,
}: CompleteTestDialogProps) {
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [styleRating, setStyleRating] = useState(0);
  const [speedRating, setSpeedRating] = useState<SpeedRating | null>(null);
  const [xFactor, setXFactor] = useState(0);
  const [notes, setNotes] = useState("");

  // Reset form when result changes
  useEffect(() => {
    if (result) {
      setAccuracyRating(result.accuracyRating || 0);
      setStyleRating(result.styleRating || 0);
      setSpeedRating((result.speedRating as SpeedRating) || null);
      setXFactor(result.xFactor || 0);
      setNotes(result.userNotes || "");
    } else {
      setAccuracyRating(0);
      setStyleRating(0);
      setSpeedRating(null);
      setXFactor(0);
      setNotes("");
    }
  }, [result]);

  // Update result mutation
  const updateResultMutation = useMutation({
    mutationFn: async (data: {
      accuracyRating: number;
      styleRating: number;
      speedRating: SpeedRating | null;
      xFactor: number;
      userNotes: string;
    }) => {
      if (!result) return;
      const res = await apiRequest("PATCH", `/api/model-map/test-results/${result.id}`, {
        ...data,
        status: "completed",
        // Calculate overall rating as average of accuracy and style
        userRating: data.accuracyRating && data.styleRating
          ? Math.round((data.accuracyRating + data.styleRating) / 2)
          : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/model-map/test-results"] });
      onSaved?.();
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    updateResultMutation.mutate({
      accuracyRating,
      styleRating,
      speedRating,
      xFactor,
      userNotes: notes,
    });
  };

  const modelOrTool = result?.model || result?.tool;
  const displayName = modelOrTool?.name || "Unknown";
  const provider = modelOrTool?.provider || "";
  const shortName = modelOrTool?.shortName || null;

  const isPending = result?.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Test</DialogTitle>
        </DialogHeader>

        {/* Status Banner */}
        {isPending && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Pending - fill in your results below
          </div>
        )}

        {/* Model/Tool Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <ModelAvatar
            name={displayName}
            shortName={shortName}
            provider={provider}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{displayName}</p>
            <div className="flex items-center gap-2 mt-1">
              {test && (
                <Badge variant="secondary" className="text-xs">
                  {test.title}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Rating Form */}
        <div className="space-y-5 py-2">
          <StarRating
            label="Accuracy"
            value={accuracyRating}
            onChange={setAccuracyRating}
          />

          <StarRating
            label="Style"
            value={styleRating}
            onChange={setStyleRating}
          />

          <SpeedSelector
            value={speedRating}
            onChange={setSpeedRating}
          />

          <XFactorRating
            value={xFactor}
            onChange={setXFactor}
          />

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any observations or comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateResultMutation.isPending}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
