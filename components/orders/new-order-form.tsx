"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createOrderAction, type OrderActionResult } from "@/lib/actions/orders";
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
import { cn } from "@/lib/utils";
import type { OrderFormOptions } from "@/lib/data/orders";

interface ItemRow {
  key: string;
  variantId: string;
  quantity: string;
  unitPrice: string;
  specNote: string;
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(
    value,
  );

function newRow(variants: OrderFormOptions["variants"]): ItemRow {
  const first = variants[0];
  return {
    key: crypto.randomUUID(),
    variantId: first?.variantId ?? "",
    quantity: "1",
    unitPrice: String(first?.salePrice ?? 0),
    specNote: "",
  };
}

export function NewOrderForm({ options }: { options: OrderFormOptions }) {
  const [items, setItems] = useState<ItemRow[]>(() => [newRow(options.variants)]);
  const [discount, setDiscount] = useState("0");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const variantById = useMemo(
    () => new Map(options.variants.map((v) => [v.variantId, v])),
    [options.variants],
  );

  // Base UI's Select shows the raw value unless the Root is given a label map.
  const variantLabels = useMemo(
    () => Object.fromEntries(options.variants.map((v) => [v.variantId, v.label])),
    [options.variants],
  );

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function selectVariant(key: string, variantId: string) {
    const variant = variantById.get(variantId);
    updateItem(key, {
      variantId,
      unitPrice: variant ? String(variant.salePrice) : "0",
    });
  }

  function addItem() {
    setItems((rows) => [...rows, newRow(options.variants)]);
  }

  function removeItem(key: string) {
    setItems((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  }

  const subtotal = items.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0),
    0,
  );
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

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
          unitPrice: Number(row.unitPrice) || 0,
          specNote: row.specNote,
        })),
      ),
    );

    const result: OrderActionResult = await createOrderAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Order locked in — it's on the Ghana board");
    router.push("/orders");
  }

  return (
    <form onSubmit={handleSubmit} id="new-order-form">
      <FieldGroup>
        {error ? <FieldError>{error}</FieldError> : null}

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="customerName">Customer name</FieldLabel>
            <Input id="customerName" name="customerName" placeholder="e.g. Ama Boateng" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="customerPhone">Customer phone</FieldLabel>
            <Input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              placeholder="WhatsApp number"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="deliveryAddress">Delivery address</FieldLabel>
          <Textarea
            id="deliveryAddress"
            name="deliveryAddress"
            rows={2}
            placeholder="Area, landmark, directions the rider will need"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="mapsUrl">Google Maps link (optional)</FieldLabel>
          <Input
            id="mapsUrl"
            name="mapsUrl"
            type="url"
            inputMode="url"
            placeholder="https://maps.app.goo.gl/…"
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Items</FieldLabel>
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-meta" onClick={addItem}>
              <Plus className="size-3.5" />
              Add line
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((row) => {
              const variant = variantById.get(row.variantId);
              const stock = variant?.stock ?? 0;
              const overStock = Number(row.quantity) > stock;
              return (
                <div key={row.key} className="space-y-2 rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <Select
                      items={variantLabels}
                      value={row.variantId}
                      onValueChange={(value) => selectVariant(row.key, String(value ?? ""))}
                    >
                      <SelectTrigger className="w-full flex-1">
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.variants.map((v) => (
                          <SelectItem key={v.variantId} value={v.variantId}>
                            <span className="flex-1">{v.label}</span>
                            <span
                              className={cn(
                                "tabular-nums text-meta",
                                v.stock <= 0 ? "text-status-out" : "text-muted-foreground",
                              )}
                            >
                              {v.stock} left
                            </span>
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
                      className="w-16 shrink-0"
                      aria-label="Quantity"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(event) => updateItem(row.key, { unitPrice: event.target.value })}
                      placeholder="Price"
                      className="w-24 shrink-0"
                      aria-label="Unit price (GHS)"
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
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={row.specNote}
                      onChange={(event) => updateItem(row.key, { specNote: event.target.value })}
                      placeholder="Spec (colour, size, etc.) — optional"
                      className="text-meta"
                    />
                    <span
                      className={cn(
                        "shrink-0 text-caption tabular-nums",
                        overStock ? "text-status-out" : "text-muted-foreground",
                      )}
                    >
                      {stock} in stock
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="discount">Discount (GHS)</FieldLabel>
            <Input
              id="discount"
              name="discount"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              placeholder="0.00"
            />
          </Field>
          <div className="flex flex-col justify-end gap-1 pb-1 text-right">
            <div className="flex items-center justify-between text-meta text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{currency(subtotal)}</span>
            </div>
            {discountValue > 0 ? (
              <div className="flex items-center justify-between text-meta text-status-out">
                <span>Discount</span>
                <span className="tabular-nums">−{currency(discountValue)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-row-value font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{currency(total)}</span>
            </div>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="notes">Order notes</FieldLabel>
          <Textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Anything the Ghana team should know to fulfil this"
          />
        </Field>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/orders")}>
            Cancel
          </Button>
          <Button type="submit" form="new-order-form" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Lock in order"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
