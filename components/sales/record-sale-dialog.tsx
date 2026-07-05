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
import type { SaleFormOptions } from "@/lib/data/sales";

export function RecordSaleDialog({ options }: { options: SaleFormOptions }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(options.products[0]?.id ?? "");
  const [unitPrice, setUnitPrice] = useState(String(options.products[0]?.salePrice ?? 0));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <FieldGroup>
            {error ? <FieldError>{error}</FieldError> : null}
            <Field>
              <FieldLabel htmlFor="productId">Product</FieldLabel>
              <Select
                name="productId"
                value={productId}
                onValueChange={(value) => {
                  setProductId(value ?? "");
                  const product = options.products.find((p) => p.id === value);
                  if (product) setUnitPrice(String(product.salePrice));
                }}
              >
                <SelectTrigger id="productId" className="w-full">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {options.products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
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
