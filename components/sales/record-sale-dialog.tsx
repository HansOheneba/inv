"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { recordSaleAction, type RecordSaleResult } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
import { cn } from "@/lib/utils";
import type { SaleFormOptions } from "@/lib/data/sales";

export function RecordSaleDialog({ options }: { options: SaleFormOptions }) {
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState(options.variants[0]?.variantId ?? "");
  const [unitPrice, setUnitPrice] = useState(String(options.variants[0]?.salePrice ?? 0));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variantLabels = Object.fromEntries(options.variants.map((v) => [v.variantId, v.label]));
  const productId = options.variants.find((v) => v.variantId === variantId)?.productId ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result: RecordSaleResult = await recordSaleAction({}, new FormData(event.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Sale recorded");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" />
        Record sale
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-section-title">Record a sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="record-sale-form">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variantId} />
          <FieldGroup>
            {error ? <FieldError>{error}</FieldError> : null}
            <Field>
              <FieldLabel htmlFor="variantId">Product</FieldLabel>
              <Select
                items={variantLabels}
                value={variantId}
                onValueChange={(value) => {
                  setVariantId(String(value ?? ""));
                  const variant = options.variants.find((v) => v.variantId === value);
                  if (variant) setUnitPrice(String(variant.salePrice));
                }}
              >
                <SelectTrigger id="variantId" className="w-full">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {options.variants.map((variant) => (
                    <SelectItem key={variant.variantId} value={variant.variantId}>
                      <span className="flex-1">{variant.label}</span>
                      <span
                        className={cn(
                          "tabular-nums text-meta",
                          variant.stock <= 0 ? "text-status-out" : "text-muted-foreground",
                        )}
                      >
                        {variant.stock} left
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
                <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="unitPrice">Price (GHS)</FieldLabel>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="locationId">Sold from</FieldLabel>
              <Select name="locationId" defaultValue={options.locations[0]?.id} required>
                <SelectTrigger id="locationId" className="w-full">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {options.locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="channelId">Channel</FieldLabel>
              <Select name="channelId" defaultValue={options.channels[0]?.id}>
                <SelectTrigger id="channelId" className="w-full">
                  <SelectValue placeholder="Where was this sold?" />
                </SelectTrigger>
                <SelectContent>
                  {options.channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="customerName">Customer (optional)</FieldLabel>
              <Input id="customerName" name="customerName" placeholder="Name or phone number" />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="record-sale-form" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
