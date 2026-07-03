"use client";

import { useState } from "react";
import { toast } from "sonner";
import { transferStockAction, type TransferStockResult } from "@/lib/actions/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import type { InventoryItem } from "@/lib/data/inventory";
import type { Tables } from "@/lib/supabase/types";

export function TransferStockDialog({
  item,
  locations,
  open,
  onOpenChange,
}: {
  item: InventoryItem | null;
  locations: Tables<"locations">[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result: TransferStockResult = await transferStockAction({}, new FormData(event.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Stock transferred");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-section-title">Transfer stock</DialogTitle>
          <DialogDescription className="text-meta">{item.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="transfer-stock-form">
          <input type="hidden" name="productId" value={item.productId} />
          <FieldGroup>
            {error ? <FieldError>{error}</FieldError> : null}
            <Field>
              <FieldLabel htmlFor="fromLocationId">From</FieldLabel>
              <Select name="fromLocationId" defaultValue={locations[0]?.id} required>
                <SelectTrigger id="fromLocationId" className="w-full">
                  <SelectValue placeholder="Source location" />
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
            <Field>
              <FieldLabel htmlFor="toLocationId">To</FieldLabel>
              <Select name="toLocationId" defaultValue={locations[1]?.id ?? locations[0]?.id} required>
                <SelectTrigger id="toLocationId" className="w-full">
                  <SelectValue placeholder="Destination location" />
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
            <Field>
              <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
              <Input id="quantity" name="quantity" type="number" min={1} required />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="transfer-stock-form" disabled={pending} className="w-full">
            {pending ? "Moving…" : "Move stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
