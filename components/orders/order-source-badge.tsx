import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderSource } from "@/lib/supabase/types";

const LABEL: Record<OrderSource, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  manual: "Manual",
};

const STYLE: Record<OrderSource, string> = {
  website: "bg-blue-500/15 text-blue-600",
  whatsapp: "bg-status-available/15 text-status-available",
  manual: "bg-muted text-muted-foreground",
};

export function OrderSourceBadge({
  source,
  className,
}: {
  source: OrderSource;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent text-meta capitalize", STYLE[source], className)}>
      {LABEL[source]}
    </Badge>
  );
}
