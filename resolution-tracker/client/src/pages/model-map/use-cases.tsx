import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Beaker, Brain, FileText, Code, Sparkles, LineChart, Zap, BookOpen, Star, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { UseCase } from "@shared/schema";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "Strategic Analysis", label: "Strategic", icon: Brain },
  { value: "Writing", label: "Writing", icon: FileText },
  { value: "Code", label: "Code", icon: Code },
  { value: "Research", label: "Research", icon: BookOpen },
  { value: "Automation", label: "Automation", icon: Zap },
  { value: "Visual Design", label: "Design", icon: LineChart },
];

const categoryColors: Record<string, string> = {
  "Strategic Analysis": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Writing": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Code": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Research": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Automation": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Visual Design": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "Audio/Video": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Other": "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

function UseCaseCard({ useCase, onCustomize }: { useCase: UseCase; onCustomize: (useCase: UseCase) => void }) {
  const CategoryIcon = CATEGORIES.find(c => c.value === useCase.category)?.icon || Sparkles;

  return (
    <Card className="hover:border-primary/50 transition-colors group cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-muted">
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">{useCase.title}</CardTitle>
              <Badge variant="secondary" className={`text-xs mt-1 ${categoryColors[useCase.category] || categoryColors["Other"]}`}>
                {useCase.category}
              </Badge>
            </div>
          </div>
          {useCase.isCurated && (
            <Badge variant="outline" className="shrink-0">
              <Star className="h-3 w-3 mr-1" />
              Curated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2 mb-4">
          {useCase.description}
        </CardDescription>
        <div className="flex items-center gap-2">
          <Link href={`/model-map/test-lab?useCase=${useCase.id}`}>
            <Button size="sm" variant="default" className="gap-1">
              <Play className="h-3 w-3" />
              Test
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => onCustomize(useCase)}
          >
            <Beaker className="h-3 w-3" />
            Customize
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UseCasesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customizingUseCase, setCustomizingUseCase] = useState<UseCase | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  const { data: useCases = [], isLoading } = useQuery<UseCase[]>({
    queryKey: ["/api/model-map/use-cases", selectedCategory === "all" ? undefined : selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      const res = await apiRequest("GET", `/api/model-map/use-cases?${params.toString()}`);
      return res.json();
    },
  });

  const filteredUseCases = useCases.filter((uc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      uc.title.toLowerCase().includes(query) ||
      uc.description.toLowerCase().includes(query) ||
      uc.category.toLowerCase().includes(query)
    );
  });

  const curatedUseCases = filteredUseCases.filter((uc) => uc.isCurated);
  const communityUseCases = filteredUseCases.filter((uc) => !uc.isCurated);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Use Cases</h1>
        <p className="text-muted-foreground">
          Curated prompts designed to test model capabilities across different tasks.
          Choose a use case and run it against multiple models to find what works best for you.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search use cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1"
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading use cases...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Curated Section */}
          {curatedUseCases.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold">Curated Use Cases</h2>
                <Badge variant="secondary">{curatedUseCases.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {curatedUseCases.map((useCase) => (
                  <UseCaseCard
                    key={useCase.id}
                    useCase={useCase}
                    onCustomize={(uc) => {
                      setCustomizingUseCase(uc);
                      setCustomTitle(uc.title);
                      setCustomDescription(uc.description);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Community Section */}
          {communityUseCases.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Community Use Cases</h2>
                <Badge variant="secondary">{communityUseCases.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityUseCases.map((useCase) => (
                  <UseCaseCard
                    key={useCase.id}
                    useCase={useCase}
                    onCustomize={(uc) => {
                      setCustomizingUseCase(uc);
                      setCustomTitle(uc.title);
                      setCustomDescription(uc.description);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredUseCases.length === 0 && (
            <div className="text-center py-12">
              <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No use cases found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try a different search term or category"
                  : "No use cases in this category yet"}
              </p>
              <Link href="/model-map/test-lab">
                <Button>Create Your Own</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Customize Use Case Dialog */}
      <Dialog open={!!customizingUseCase} onOpenChange={(open) => !open && setCustomizingUseCase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Use Case</DialogTitle>
          </DialogHeader>
          {customizingUseCase && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-title">Title</Label>
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="custom-description">Description</Label>
                <Textarea
                  id="custom-description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2"><strong>Category:</strong> {customizingUseCase.category}</p>
                <p><strong>Original Description:</strong></p>
                <p className="italic">{customizingUseCase.description}</p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setCustomizingUseCase(null)}
                >
                  Close
                </Button>
                <Link href={`/model-map/test-lab?useCase=${customizingUseCase.id}`}>
                  <Button>Use This</Button>
                </Link>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
