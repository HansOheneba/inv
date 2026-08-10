import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/supabase/types";

const LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
  cod: "COD",
};

const STYLE: Record<PaymentStatus, string> = {
  unpaid: "bg-status-low/25 text-status-low",
  paid: "bg-status-available/15 text-status-available",
  refunded: "bg-status-out/15 text-status-out",
  cod: "bg-muted text-muted-foreground",
};

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent text-meta", STYLE[status], className)}>
      {LABEL[status]}
    </Badge>
  );
}
