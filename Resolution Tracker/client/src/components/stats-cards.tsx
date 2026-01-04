import { Card, CardContent } from "@/components/ui/card";
import { Target, CheckCircle2, PlayCircle, TrendingUp } from "lucide-react";
import type { Resolution } from "@shared/schema";

interface StatsCardsProps {
  resolutions: Resolution[];
}

export function StatsCards({ resolutions }: StatsCardsProps) {
  const total = resolutions.length;
  const completed = resolutions.filter((r) => r.status === "completed").length;
  const inProgress = resolutions.filter((r) => r.status === "in_progress").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: "Total Resolutions",
      value: total,
      icon: Target,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: PlayCircle,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-md ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
