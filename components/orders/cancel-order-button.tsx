"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelOrderAction } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        formData.set("orderId", orderId);
        setPending(true);
        const result = await cancelOrderAction(formData);
        setPending(false);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Order cancelled");
        router.refresh();
      }}
    >
      <Button type="submit" variant="ghost" className="text-muted-foreground" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel"}
      </Button>
    </form>
  );
}
