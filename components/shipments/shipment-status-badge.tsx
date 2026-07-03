import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ShipmentStatus } from "@/lib/supabase/types";

const LABEL: Record<ShipmentStatus, string> = {
  ordered: "Ordered",
  in_transit: "In transit",
  customs: "In customs",
  received: "Received",
  cancelled: "Cancelled",
};

const STYLE: Record<ShipmentStatus, string> = {
  ordered: "bg-muted text-muted-foreground",
  in_transit: "bg-blue-500/15 text-blue-600",
  customs: "bg-status-low/25 text-status-low",
  received: "bg-status-available/15 text-status-available",
  cancelled: "bg-status-out/15 text-status-out",
};

export function ShipmentStatusBadge({
  status,
  className,
}: {
  status: ShipmentStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent text-meta", STYLE[status], className)}>
      {LABEL[status]}
    </Badge>
  );
}
