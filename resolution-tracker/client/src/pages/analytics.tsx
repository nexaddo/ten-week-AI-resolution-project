import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, CheckCircle2, PlayCircle, TrendingUp, Activity, Flag } from "lucide-react";
import type { UserActivityLog } from "@shared/schema";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";

interface AnalyticsStats {
  totalResolutions: number;
  completedResolutions: number;
  inProgressResolutions: number;
  totalCheckIns: number;
  totalMilestones: number;
  completedMilestones: number;
  recentActivities: UserActivityLog[];
}

function StatsCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string;
  value: string | number;
  icon: any;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-md ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: UserActivityLog }) {
  const getActivityIcon = (action: string) => {
    if (action.includes("resolution")) return Target;
    if (action.includes("check_in")) return Activity;
    if (action.includes("milestone")) return Flag;
    return Activity;
  };

  const getActivityLabel = (action: string) => {
    const labels: Record<string, string> = {
      resolution_created: "Created a resolution",
      resolution_updated: "Updated a resolution",
      resolution_deleted: "Deleted a resolution",
      check_in_added: "Added a check-in",
      milestone_created: "Created a milestone",
      milestone_completed: "Completed a milestone",
    };
    return labels[action] || action.replace(/_/g, " ");
  };

  const Icon = getActivityIcon(activity.action);

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{getActivityLabel(activity.action)}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </div>
  );
}

export function Analytics() {
  const { isAdmin } = useUserRole();
  
  const { data: stats, isLoading: statsLoading } = useQuery<AnalyticsStats>({
    queryKey: ["/api/analytics/stats"],
  });

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  const completionRate = stats.totalResolutions > 0
    ? Math.round((stats.completedResolutions / stats.totalResolutions) * 100)
    : 0;

  const milestoneCompletionRate = stats.totalMilestones > 0
    ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Overview of all platform activity" : "Track your progress and activity"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          label="Total Resolutions"
          value={stats.totalResolutions}
          icon={Target}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatsCard
          label="Completed"
          value={stats.completedResolutions}
          icon={CheckCircle2}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          label="In Progress"
          value={stats.inProgressResolutions}
          icon={PlayCircle}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          label="Total Check-ins"
          value={stats.totalCheckIns}
          icon={Activity}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <StatsCard
          label="Milestones"
          value={`${stats.completedMilestones}/${stats.totalMilestones}`}
          icon={Flag}
          iconBg="bg-pink-100 dark:bg-pink-900/30"
          iconColor="text-pink-600 dark:text-pink-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity to display
            </p>
          ) : (
            <div className="space-y-0">
              {stats.recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
