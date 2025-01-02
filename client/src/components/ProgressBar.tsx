import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  max?: number;
  showValue?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showValue = true,
  label,
  size = "md",
  className,
  valueClassName,
  labelClassName,
}: ProgressBarProps) {
  // Normalize value to be between 0 and max
  const normalizedValue = Math.min(Math.max(0, value), max);
  const percentage = (normalizedValue / max) * 100;

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span
              className={cn(
                "text-sm font-medium text-foreground",
                labelClassName
              )}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              className={cn(
                "text-sm text-muted-foreground",
                valueClassName
              )}
            >
              {value.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(
          "transition-all",
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
}

export default ProgressBar;
