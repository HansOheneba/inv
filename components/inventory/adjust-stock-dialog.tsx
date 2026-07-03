"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adjustStockAction, type AdjustStockResult } from "@/lib/actions/inventory";
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
import { Textarea } from "@/components/ui/textarea";
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

export function AdjustStockDialog({
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
    const result: AdjustStockResult = await adjustStockAction({}, new FormData(event.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Stock updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-section-title">Adjust stock</DialogTitle>
          <DialogDescription className="text-meta">{item.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="adjust-stock-form">
          <input type="hidden" name="productId" value={item.productId} />
          <FieldGroup>
            {error ? <FieldError>{error}</FieldError> : null}
            <Field>
              <FieldLabel htmlFor="locationId">Location</FieldLabel>
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
            <Field>
              <FieldLabel htmlFor="delta">Quantity change</FieldLabel>
              <Input
                id="delta"
                name="delta"
                type="number"
                placeholder="e.g. 10 or -5"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
              <Textarea id="note" name="note" placeholder="Stock count correction, damage, etc." rows={2} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="adjust-stock-form" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
