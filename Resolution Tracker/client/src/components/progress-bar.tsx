import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({ value, showLabel = true, size = "md" }: ProgressBarProps) {
  const height = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];

  return (
    <div className="flex items-center gap-3 w-full">
      <Progress 
        value={value} 
        className={`flex-1 ${height}`}
        data-testid="progress-bar"
      />
      {showLabel && (
        <span 
          className="text-sm font-semibold text-muted-foreground min-w-[3rem] text-right"
          data-testid="text-progress-value"
        >
          {value}%
        </span>
      )}
    </div>
  );
}
