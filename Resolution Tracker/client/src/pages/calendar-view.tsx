import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/category-badge";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isValid,
} from "date-fns";
import type { Resolution, CheckIn, Category } from "@shared/schema";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: resolutions = [], isLoading: resolutionsLoading } = useQuery<Resolution[]>({
    queryKey: ["/api/resolutions"],
  });

  const { data: checkIns = [], isLoading: checkInsLoading } = useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins"],
  });

  const isLoading = resolutionsLoading || checkInsLoading;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    const deadlines = resolutions.filter((r) => {
      if (!r.targetDate) return false;
      try {
        const date = parseISO(r.targetDate);
        return isValid(date) && isSameDay(date, day);
      } catch {
        return false;
      }
    });

    const dayCheckIns = checkIns.filter((c) => {
      try {
        const date = parseISO(c.date);
        return isValid(date) && isSameDay(date, day);
      } catch {
        return false;
      }
    });

    return { deadlines, checkIns: dayCheckIns };
  };

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-calendar-title">
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View deadlines and track your progress over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth} data-testid="button-prev-month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const { deadlines, checkIns: dayCheckIns } = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border-b border-r ${
                    !isCurrentMonth ? "bg-muted/30" : ""
                  }`}
                  data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm ${
                        isToday
                          ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center font-medium"
                          : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {deadlines.slice(0, 2).map((resolution) => (
                      <div
                        key={resolution.id}
                        className="text-xs truncate p-1 rounded bg-primary/10 text-primary"
                      >
                        {resolution.title}
                      </div>
                    ))}
                    {dayCheckIns.length > 0 && (
                      <div className="text-xs p-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        {dayCheckIns.length} check-in{dayCheckIns.length > 1 ? "s" : ""}
                      </div>
                    )}
                    {deadlines.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{deadlines.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/10" />
          <span>Deadline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30" />
          <span>Check-in</span>
        </div>
      </div>
    </div>
  );
}
