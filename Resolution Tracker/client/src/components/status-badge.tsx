import { Status } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Circle, PlayCircle, CheckCircle2, XCircle } from "lucide-react";

const statusConfig: Record<Status, { 
  label: string; 
  icon: React.ReactNode; 
  className: string;
}> = {
  "not_started": { 
    label: "Not Started", 
    icon: <Circle className="h-3 w-3" />,
    className: "bg-muted text-muted-foreground border-0"
  },
  "in_progress": { 
    label: "In Progress", 
    icon: <PlayCircle className="h-3 w-3" />,
    className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0"
  },
  "completed": { 
    label: "Completed", 
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0"
  },
  "abandoned": { 
    label: "Abandoned", 
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-destructive/10 text-destructive border-0"
  },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={`${config.className} gap-1 font-medium`}
      data-testid={`badge-status-${status}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
