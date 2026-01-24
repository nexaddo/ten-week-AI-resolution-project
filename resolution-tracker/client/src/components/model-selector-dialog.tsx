import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

interface ModelSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModels: string[];
  onConfirm: (models: string[]) => void;
}

const availableModels: ModelOption[] = [
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Latest Claude model, excellent for complex reasoning and coding",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced model with multimodal capabilities",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast and efficient Google AI model with strong performance",
  },
];

const providerColors: Record<string, string> = {
  Anthropic: "bg-orange-500",
  OpenAI: "bg-green-500",
  Google: "bg-blue-500",
};

export function ModelSelectorDialog({ 
  open, 
  onOpenChange, 
  selectedModels, 
  onConfirm 
}: ModelSelectorDialogProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedModels);

  const handleToggle = (modelId: string) => {
    setTempSelected(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleConfirm = () => {
    onConfirm(tempSelected);
    onOpenChange(false);
  };

  const handleSelectAll = () => {
    setTempSelected(availableModels.map(m => m.id));
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Models to Test</DialogTitle>
          <DialogDescription>
            Choose which AI models to run your prompt against. By default, all models are selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
            >
              Clear All
            </Button>
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {tempSelected.length} of {availableModels.length} selected
            </span>
          </div>

          <div className="space-y-3">
            {availableModels.map(model => (
              <div
                key={model.id}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => handleToggle(model.id)}
              >
                <Checkbox
                  id={model.id}
                  checked={tempSelected.includes(model.id)}
                  onCheckedChange={() => handleToggle(model.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label 
                      htmlFor={model.id} 
                      className="font-semibold cursor-pointer"
                    >
                      {model.name}
                    </Label>
                    <Badge 
                      className={`${providerColors[model.provider]} text-white`}
                    >
                      {model.provider}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {model.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={tempSelected.length === 0}
          >
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
