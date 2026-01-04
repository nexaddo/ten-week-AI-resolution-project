import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Resolution } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolution: Resolution | null;
  onSubmit: (data: { note: string; progress: number }) => void;
  isSubmitting?: boolean;
}

export function CheckInDialog({
  open,
  onOpenChange,
  resolution,
  onSubmit,
  isSubmitting = false,
}: CheckInDialogProps) {
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && resolution) {
      setProgress(resolution.progress || 0);
      setNote("");
    }
  }, [open, resolution]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onSubmit({ note: note.trim(), progress });
    setNote("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNote("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Log Progress Check-in</DialogTitle>
          {resolution && (
            <DialogDescription className="text-base font-medium text-foreground/80">
              {resolution.title}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Label>Progress ({progress}%)</Label>
            <Slider
              value={[progress]}
              onValueChange={([v]) => setProgress(v)}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-progress"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">What progress have you made?</Label>
            <Textarea
              id="note"
              placeholder="Describe your progress, wins, or challenges..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              data-testid="input-checkin-note"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-testid="button-cancel-checkin"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!note.trim() || isSubmitting}
              data-testid="button-submit-checkin"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Check-in
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
