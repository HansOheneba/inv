"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { advanceShipmentAction } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import type { ShipmentStatus } from "@/lib/supabase/types";
import type { Tables } from "@/lib/supabase/types";

const NEXT_LABEL: Record<string, string> = {
  ordered: "Mark in transit",
  in_transit: "Mark in customs",
  customs: "Receive shipment",
};

export function AdvanceShipmentButton({
  shipmentId,
  status,
  locations,
}: {
  shipmentId: string;
  status: ShipmentStatus;
  locations: Tables<"locations">[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const label = NEXT_LABEL[status];

  if (!label) return null;

  const willReceive = status === "customs";

  async function run(formData: FormData) {
    setPending(true);
    const result = await advanceShipmentAction(formData);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(willReceive ? "Shipment received — stock updated" : "Shipment updated");
    setOpen(false);
    router.refresh();
  }

  if (!willReceive) {
    return (
      <form
        action={(formData) => {
          formData.set("shipmentId", shipmentId);
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
            <DialogTitle className="text-section-title">Receive shipment</DialogTitle>
          </DialogHeader>
          <form
            id="receive-shipment-form"
            action={(formData) => {
              formData.set("shipmentId", shipmentId);
              run(formData);
            }}
          >
            <Field>
              <FieldLabel htmlFor="locationId">Receive into</FieldLabel>
              <Select name="locationId" defaultValue={locations[0]?.id} required>
                <SelectTrigger id="locationId" className="w-full">
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </form>
          <DialogFooter>
            <Button type="submit" form="receive-shipment-form" disabled={pending} className="w-full">
              {pending ? "Receiving…" : "Confirm receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
