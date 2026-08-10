"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createShipmentAction, type CreateShipmentResult } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import type { ShipmentFormOptions } from "@/lib/data/shipments";

interface ItemRow {
  key: string;
  variantId: string;
  quantity: string;
  unitCost: string;
}

function newRow(variants: ShipmentFormOptions["variants"]): ItemRow {
  const first = variants[0];
  return {
    key: crypto.randomUUID(),
    variantId: first?.variantId ?? "",
    quantity: "1",
    unitCost: String(first?.defaultCost ?? 0),
  };
}

export function NewShipmentDialog({ options }: { options: ShipmentFormOptions }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemRow[]>(() => [newRow(options.variants)]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const variantById = useMemo(
    () => new Map(options.variants.map((v) => [v.variantId, v])),
    [options.variants],
  );
  const variantLabels = useMemo(
    () => Object.fromEntries(options.variants.map((v) => [v.variantId, v.label])),
    [options.variants],
  );

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function selectVariant(key: string, variantId: string) {
    const variant = variantById.get(variantId);
    updateItem(key, { variantId, unitCost: variant ? String(variant.defaultCost) : "0" });
  }

  function addItem() {
    setItems((rows) => [...rows, newRow(options.variants)]);
  }

  function removeItem(key: string) {
    setItems((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set(
      "itemsJson",
      JSON.stringify(
        items.map((row) => ({
          productId: variantById.get(row.variantId)?.productId ?? "",
          variantId: row.variantId,
          quantity: Number(row.quantity),
          unitCost: Number(row.unitCost) || 0,
        })),
      ),
    );

    const result: CreateShipmentResult = await createShipmentAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Shipment logged");
    setOpen(false);
    setItems([newRow(options.variants)]);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="size-4" />
        Log shipment
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-section-title">Log a new shipment</DialogTitle>
          <DialogDescription className="text-meta">
            A manual record — write down what you ordered, then advance its status yourself as it
            moves. No courier tracking, just your own notebook.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="new-shipment-form" className="max-h-[65vh] overflow-y-auto pr-1">
          <FieldGroup>
            {error ? <FieldError>{error}</FieldError> : null}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="referenceCode">Reference / PO code</FieldLabel>
                <Input id="referenceCode" name="referenceCode" placeholder="PO-2026-014" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="supplierId">Supplier</FieldLabel>
                <Select name="supplierId" defaultValue={options.suppliers[0]?.id}>
                  <SelectTrigger id="supplierId" className="w-full">
                    <SelectValue placeholder="Unknown" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="originCountry">Origin</FieldLabel>
                <Input id="originCountry" name="originCountry" placeholder="China" />
              </Field>
              <Field>
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <Input id="currency" name="currency" defaultValue="USD" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="expectedArrival">Expected arrival</FieldLabel>
                <Input id="expectedArrival" name="expectedArrival" type="date" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="shippingCost">Shipping cost</FieldLabel>
                <Input id="shippingCost" name="shippingCost" type="number" min={0} step="0.01" defaultValue={0} />
              </Field>
              <Field>
                <FieldLabel htmlFor="customsCost">Customs / duty cost</FieldLabel>
                <Input id="customsCost" name="customsCost" type="number" min={0} step="0.01" defaultValue={0} />
              </Field>
            </div>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>What&apos;s in it</FieldLabel>
                <Button type="button" variant="ghost" size="sm" className="gap-1 text-meta" onClick={addItem}>
                  <Plus className="size-3.5" />
                  Add line
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((row) => (
                  <div key={row.key} className="flex items-center gap-2">
                    <Select
                      items={variantLabels}
                      value={row.variantId}
                      onValueChange={(value) => selectVariant(row.key, String(value ?? ""))}
                    >
                      <SelectTrigger className="w-full flex-1">
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.variants.map((variant) => (
                          <SelectItem key={variant.variantId} value={variant.variantId}>
                            {variant.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(event) => updateItem(row.key, { quantity: event.target.value })}
                      placeholder="Qty"
                      className="w-20 shrink-0"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.unitCost}
                      onChange={(event) => updateItem(row.key, { unitCost: event.target.value })}
                      placeholder="Unit cost"
                      className="w-24 shrink-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      onClick={() => removeItem(row.key)}
                      disabled={items.length === 1}
                      aria-label="Remove line"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
              <Textarea id="notes" name="notes" rows={2} placeholder="Anything worth remembering about this order" />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="new-shipment-form" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
