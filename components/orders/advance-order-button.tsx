"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { advanceOrderAction } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { OrderStatus } from "@/lib/supabase/types";

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Mark packed",
  packed: "Out for delivery",
  out_for_delivery: "Mark delivered",
};

export function AdvanceOrderButton({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const label = NEXT_LABEL[status];

  if (!label) return null;

  const needsRider = status === "packed";

  async function run(formData: FormData) {
    setPending(true);
    const result = await advanceOrderAction(formData);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(status === "out_for_delivery" ? "Order delivered — sale recorded" : "Order updated");
    setOpen(false);
    router.refresh();
  }

  if (!needsRider) {
    return (
      <form
        action={(formData) => {
          formData.set("orderId", orderId);
          run(formData);
        }}
      >
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Updating…" : label}
        </Button>
      </form>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-section-title">Hand to a rider</DialogTitle>
          </DialogHeader>
          <form
            id="dispatch-order-form"
            action={(formData) => {
              formData.set("orderId", orderId);
              run(formData);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="riderName">Rider name</FieldLabel>
                <Input id="riderName" name="riderName" placeholder="e.g. Kwame" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="riderPhone">Rider phone</FieldLabel>
                <Input
                  id="riderPhone"
                  name="riderPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 024 000 0000"
                  required
                />
              </Field>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="submit" form="dispatch-order-form" disabled={pending} className="w-full">
              {pending ? "Sending…" : "Send with rider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
