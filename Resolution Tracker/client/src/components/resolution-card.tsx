import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "./category-badge";
import { StatusBadge } from "./status-badge";
import { ProgressBar } from "./progress-bar";
import { 
  MoreHorizontal, 
  Calendar, 
  Pencil, 
  Trash2, 
  CheckCircle,
  MessageSquarePlus 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Resolution, Category, Status } from "@shared/schema";
import { format, parseISO, isValid } from "date-fns";

interface ResolutionCardProps {
  resolution: Resolution;
  onEdit: (resolution: Resolution) => void;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onAddCheckIn: (resolution: Resolution) => void;
}

export function ResolutionCard({
  resolution,
  onEdit,
  onDelete,
  onMarkComplete,
  onAddCheckIn,
}: ResolutionCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return format(date, "MMM d, yyyy");
    } catch {
      return null;
    }
  };

  const formattedDate = resolution.targetDate ? formatDate(resolution.targetDate) : null;

  return (
    <Card 
      className="border-card-border hover-elevate transition-all duration-200 group"
      data-testid={`card-resolution-${resolution.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={resolution.category as Category} />
            <StatusBadge status={resolution.status as Status} />
          </div>
          <h3 
            className="text-lg font-semibold leading-tight line-clamp-2"
            data-testid="text-resolution-title"
          >
            {resolution.title}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="button-resolution-menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(resolution)} data-testid="menu-item-edit">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddCheckIn(resolution)} data-testid="menu-item-checkin">
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Add Check-in
            </DropdownMenuItem>
            {resolution.status !== "completed" && (
              <DropdownMenuItem onClick={() => onMarkComplete(resolution.id)} data-testid="menu-item-complete">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(resolution.id)} 
              className="text-destructive focus:text-destructive"
              data-testid="menu-item-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        {resolution.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resolution.description}
          </p>
        )}
        <ProgressBar value={resolution.progress || 0} />
        {formattedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Target: {formattedDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
