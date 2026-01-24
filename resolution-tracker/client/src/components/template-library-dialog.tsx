import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import type { PromptTemplate, UseCaseCategory } from "@shared/schema";
import { BookOpen, Code, Lightbulb, Search, FileText, GraduationCap, Briefcase, Sparkles } from "lucide-react";

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: PromptTemplate) => void;
}

const categoryIcons: Record<string, any> = {
  writing: FileText,
  research: Search,
  coding: Code,
  analysis: Search,
  creative: Lightbulb,
  education: GraduationCap,
  business: Briefcase,
  general: Sparkles,
};

const categoryColors: Record<string, string> = {
  writing: "bg-blue-500",
  research: "bg-purple-500",
  coding: "bg-green-500",
  analysis: "bg-orange-500",
  creative: "bg-pink-500",
  education: "bg-indigo-500",
  business: "bg-gray-500",
  general: "bg-teal-500",
};

export function TemplateLibraryDialog({ open, onOpenChange, onSelectTemplate }: TemplateLibraryDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: templates = [], isLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/prompt-templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prompt-templates");
      return res.json();
    },
    enabled: open,
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: PromptTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
          <DialogDescription>
            Choose from pre-built templates for different use cases
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No templates found</p>
              </div>
            ) : (
              <div className="grid gap-4 p-1">
                {filteredTemplates.map(template => {
                  const Icon = categoryIcons[template.category] || Sparkles;
                  const colorClass = categoryColors[template.category] || "bg-gray-500";

                  return (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${colorClass} p-2 rounded-lg text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">{template.name}</h4>
                            <Badge variant="outline" className="capitalize">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          {template.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {JSON.parse(template.tags).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {template.systemPrompt && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              System: {template.systemPrompt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
