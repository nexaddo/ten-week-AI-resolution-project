import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, type Resolution, type Category, type InsertResolution } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface AddResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertResolution) => void;
  editingResolution?: Resolution | null;
  isSubmitting?: boolean;
}

export function AddResolutionDialog({
  open,
  onOpenChange,
  onSubmit,
  editingResolution,
  isSubmitting = false,
}: AddResolutionDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Personal Growth");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    if (editingResolution) {
      setTitle(editingResolution.title);
      setDescription(editingResolution.description || "");
      setCategory(editingResolution.category as Category);
      setTargetDate(editingResolution.targetDate || "");
    } else {
      setTitle("");
      setDescription("");
      setCategory("Personal Growth");
      setTargetDate("");
    }
  }, [editingResolution, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      targetDate: targetDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editingResolution ? "Edit Resolution" : "Add New Resolution"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Run a marathon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-resolution-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does success look like for this resolution?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-resolution-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} data-testid={`select-item-${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                data-testid="input-target-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || isSubmitting}
              data-testid="button-submit-resolution"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingResolution ? "Save Changes" : "Add Resolution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
