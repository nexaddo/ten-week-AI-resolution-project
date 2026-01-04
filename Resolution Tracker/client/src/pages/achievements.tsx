import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Flame, Star, Award, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Resolution, CheckIn } from "@shared/schema";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedAt?: string;
}

export function Achievements() {
  const { data: resolutions = [], isLoading: resolutionsLoading } = useQuery<Resolution[]>({
    queryKey: ["/api/resolutions"],
  });

  const { data: checkIns = [], isLoading: checkInsLoading } = useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins"],
  });

  const isLoading = resolutionsLoading || checkInsLoading;

  const completedCount = resolutions.filter((r) => r.status === "completed").length;
  const inProgressCount = resolutions.filter((r) => r.status === "in_progress").length;
  const totalCheckIns = checkIns.length;

  const achievements: Achievement[] = [
    {
      id: "first-resolution",
      title: "Getting Started",
      description: "Create your first resolution",
      icon: <Target className="h-6 w-6" />,
      unlocked: resolutions.length >= 1,
    },
    {
      id: "five-resolutions",
      title: "Ambitious",
      description: "Create 5 resolutions",
      icon: <Star className="h-6 w-6" />,
      unlocked: resolutions.length >= 5,
    },
    {
      id: "first-complete",
      title: "First Victory",
      description: "Complete your first resolution",
      icon: <Trophy className="h-6 w-6" />,
      unlocked: completedCount >= 1,
    },
    {
      id: "three-complete",
      title: "Hat Trick",
      description: "Complete 3 resolutions",
      icon: <Award className="h-6 w-6" />,
      unlocked: completedCount >= 3,
    },
    {
      id: "first-checkin",
      title: "Check In",
      description: "Log your first progress check-in",
      icon: <Flame className="h-6 w-6" />,
      unlocked: totalCheckIns >= 1,
    },
    {
      id: "ten-checkins",
      title: "Consistent",
      description: "Log 10 progress check-ins",
      icon: <Zap className="h-6 w-6" />,
      unlocked: totalCheckIns >= 10,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-achievements-title">
          Achievements
        </h1>
        <p className="text-muted-foreground mt-1">
          {unlockedCount} of {achievements.length} achievements unlocked
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`border-card-border transition-all ${
              achievement.unlocked 
                ? "bg-card" 
                : "opacity-50 grayscale"
            }`}
            data-testid={`card-achievement-${achievement.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className={`p-3 rounded-md ${
                  achievement.unlocked 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {achievement.icon}
                </div>
                {achievement.unlocked && (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0">
                    Unlocked
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">{achievement.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
