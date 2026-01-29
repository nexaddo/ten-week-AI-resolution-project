import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Map, Cpu, Beaker, BookOpen, ArrowRight, Star, TrendingUp, Trophy, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { AiModel, UseCase, ModelTest, ModelRecommendation, UserModel, UserTool } from "@shared/schema";
import { Link } from "wouter";

const categoryColors: Record<string, string> = {
  "Strategic Analysis": "bg-purple-500",
  "Writing": "bg-blue-500",
  "Code": "bg-green-500",
  "Research": "bg-amber-500",
  "Automation": "bg-cyan-500",
  "Visual Design": "bg-pink-500",
  "Audio/Video": "bg-red-500",
  "Other": "bg-gray-500",
};

export default function MyMapPage() {
  // Fetch user's models
  const { data: userModels = [] } = useQuery<(UserModel & { model: AiModel })[]>({
    queryKey: ["/api/model-map/user/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/models");
      return res.json();
    },
  });

  // Fetch user's tools
  const { data: userTools = [] } = useQuery<(UserTool & { tool: any })[]>({
    queryKey: ["/api/model-map/user/tools"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/user/tools");
      return res.json();
    },
  });

  // Fetch user's test history
  const { data: tests = [] } = useQuery<ModelTest[]>({
    queryKey: ["/api/model-map/tests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/tests");
      return res.json();
    },
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery<(ModelRecommendation & { model: AiModel })[]>({
    queryKey: ["/api/model-map/recommendations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/recommendations");
      return res.json();
    },
  });

  // Fetch curated use cases
  const { data: curatedUseCases = [] } = useQuery<UseCase[]>({
    queryKey: ["/api/model-map/use-cases", "curated"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/model-map/use-cases?curated=true");
      return res.json();
    },
  });

  // Calculate progress
  const totalUseCases = curatedUseCases.length;
  const completedTests = tests.length;
  const progressPercent = totalUseCases > 0 ? Math.min((completedTests / totalUseCases) * 100, 100) : 0;

  // Track which use cases have been tested
  const testedUseCaseIds = new Set(
    tests
      .filter(t => t.useCaseId)
      .map(t => t.useCaseId)
  );

  // Get category breakdown
  const categoryBreakdown = curatedUseCases.reduce<Record<string, { total: number; tested: number }>>((acc, uc) => {
    if (!acc[uc.category]) {
      acc[uc.category] = { total: 0, tested: 0 };
    }
    acc[uc.category].total++;
    if (testedUseCaseIds.has(uc.id)) {
      acc[uc.category].tested++;
    }
    return acc;
  }, {});

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Map className="h-8 w-8" />
          My Model Map
        </h1>
        <p className="text-muted-foreground">
          Your personalized AI strategy guide. Track your models, run tests, and discover which models work best for your tasks.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Models</p>
                <p className="text-2xl font-bold">{userModels.length}</p>
              </div>
              <Cpu className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Tools</p>
                <p className="text-2xl font-bold">{userTools.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tests Run</p>
                <p className="text-2xl font-bold">{tests.length}</p>
              </div>
              <Beaker className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Use Cases</p>
                <p className="text-2xl font-bold">{totalUseCases}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress & Journey */}
        <div className="lg:col-span-2 space-y-6">
          {/* Journey Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Model Map Journey
              </CardTitle>
              <CardDescription>
                Complete curated use cases to build your personalized model recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>

              {/* Category Progress */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                {Object.entries(categoryBreakdown).map(([category, data]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${categoryColors[category] || categoryColors["Other"]}`} />
                      <span className="text-xs font-medium truncate">{category}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data.tested} / {data.total} tested
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Beaker className="h-5 w-5" />
                  Test Lab
                </CardTitle>
                <CardDescription>
                  Run prompts against multiple models and compare results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/model-map/test-lab">
                  <Button className="w-full" variant="outline">
                    Open Test Lab
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Use Cases
                </CardTitle>
                <CardDescription>
                  Browse curated prompts to test model capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/model-map/use-cases">
                  <Button className="w-full" variant="outline">
                    Explore Use Cases
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tests */}
          {tests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tests.slice(0, 3).map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{test.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{test.status}</Badge>
                    </div>
                  ))}
                </div>
                <Link href="/model-map/test-lab">
                  <Button variant="ghost" className="w-full mt-4">
                    View All Tests
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top Picks by Category
              </CardTitle>
              <CardDescription>
                Based on your test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Run tests to see your personalized recommendations
                  </p>
                  <Link href="/model-map/use-cases">
                    <Button size="sm">Start Testing</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex items-center gap-3">
                      <div className={`w-1 h-10 rounded-full ${categoryColors[rec.category] || categoryColors["Other"]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rec.category}</p>
                        <p className="text-xs text-muted-foreground">{rec.model?.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{rec.avgRating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Models Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                My Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userModels.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Add models to your toolkit
                  </p>
                  <Link href="/model-map/my-models">
                    <Button size="sm">Add Models</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {userModels.slice(0, 5).map((um) => (
                      <Badge key={um.id} variant="secondary">
                        {um.model.name}
                      </Badge>
                    ))}
                    {userModels.length > 5 && (
                      <Badge variant="outline">+{userModels.length - 5} more</Badge>
                    )}
                  </div>
                  <Link href="/model-map/my-models">
                    <Button variant="ghost" size="sm" className="w-full">
                      Manage Models
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Getting Started */}
          {tests.length === 0 && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Add your models</p>
                    <p className="text-xs text-muted-foreground">
                      Select the AI models you want to test
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pick a use case</p>
                    <p className="text-xs text-muted-foreground">
                      Browse curated prompts by category
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Run & compare</p>
                    <p className="text-xs text-muted-foreground">
                      Test and rate results to build your map
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
