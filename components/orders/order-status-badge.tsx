import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/types";

const LABEL: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STYLE: Record<OrderStatus, string> = {
  confirmed: "bg-muted text-muted-foreground",
  packed: "bg-status-low/25 text-status-low",
  out_for_delivery: "bg-blue-500/15 text-blue-600",
  delivered: "bg-status-available/15 text-status-available",
  cancelled: "bg-status-out/15 text-status-out",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent text-meta", STYLE[status], className)}>
      {LABEL[status]}
    </Badge>
  );
}
