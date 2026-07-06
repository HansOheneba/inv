import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendTone = "neutral",
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  href?: string;
}) {
  const body = (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <p className="text-meta text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-2.5 text-page-title font-semibold tabular-nums">{value}</p>
        {trend ? (
          <p
            className={cn(
              "mt-1 text-meta",
              trendTone === "positive" && "text-status-available",
              trendTone === "negative" && "text-status-out",
              trendTone === "neutral" && "text-muted-foreground",
            )}
          >
            {trend}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
