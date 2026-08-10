import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCENT = {
  teal: {
    iconWrap: "bg-accent-teal-soft text-accent-teal",
    value: "text-foreground",
  },
  sky: {
    iconWrap: "bg-accent-sky-soft text-accent-sky",
    value: "text-foreground",
  },
  amber: {
    iconWrap: "bg-accent-amber-soft text-accent-amber",
    value: "text-foreground",
  },
  emerald: {
    iconWrap: "bg-accent-emerald-soft text-accent-emerald",
    value: "text-foreground",
  },
} as const;

export type MetricAccent = keyof typeof ACCENT;

export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendTone = "neutral",
  accent = "teal",
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  accent?: MetricAccent;
  href?: string;
}) {
  const tone = ACCENT[accent];

  const body = (
    <Card className="h-full gap-0 border-border/80 py-5 shadow-none transition-colors hover:bg-muted/40">
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-meta text-muted-foreground">{label}</p>
          <span className={cn("flex size-8 items-center justify-center rounded-lg", tone.iconWrap)}>
            <Icon className="size-4" />
          </span>
        </div>
        <p className={cn("mt-3 text-page-title font-semibold tabular-nums", tone.value)}>{value}</p>
        {trend ? (
          <p
            className={cn(
              "mt-1.5 text-meta",
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

  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}
