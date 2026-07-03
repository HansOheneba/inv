import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/lib/data/inventory";

const LABEL: Record<StockStatus, string> = {
  available: "Available",
  low: "Low stock",
  out: "Out of stock",
};

const STYLE: Record<StockStatus, string> = {
  available: "bg-status-available/15 text-status-available",
  low: "bg-status-low/25 text-status-low",
  out: "bg-status-out/15 text-status-out",
};

export function StatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent text-meta", STYLE[status], className)}>
      {LABEL[status]}
    </Badge>
  );
}
