import { cn } from "@/lib/utils";

export function CircularProgress({
  value,
  size = 36,
  strokeWidth = 3.5,
  className,
  trackClassName,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("stroke-primary transition-[stroke-dashoffset]", className)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
