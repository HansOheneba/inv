"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { updateProductAction, type CreateProductResult } from "@/lib/actions/products";
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
import { cn } from "@/lib/utils";
import type { NewProductFormOptions } from "@/components/inventory/new-product-form";
import type { ProductDetail } from "@/lib/data/inventory";

interface VariantRow {
  key: string;
  id: string | null;
  label: string;
  cost: string;
  sale: string;
  reorder: string;
  active: boolean;
  opening: string;
  stock: number;
}

function rowFromVariant(variant: ProductDetail["variants"][number]): VariantRow {
  return {
    key: variant.variantId,
    id: variant.variantId,
    label: variant.isDefault ? "" : variant.name,
    cost: String(variant.costPrice),
    sale: String(variant.salePrice),
    reorder: String(variant.reorderPoint),
    active: true,
    opening: "0",
    stock: variant.totalStock,
  };
}

function newRow(): VariantRow {
  return {
    key: crypto.randomUUID(),
    id: null,
    label: "",
    cost: "0",
    sale: "0",
    reorder: "0",
    active: true,
    opening: "0",
    stock: 0,
  };
}

export function ProductEditForm({
  product,
  options,
}: {
  product: ProductDetail;
  options: NewProductFormOptions;
}) {
  const router = useRouter();
  const [variants, setVariants] = useState<VariantRow[]>(() => product.variants.map(rowFromVariant));
  const [locationId, setLocationId] = useState(options.locations[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationLabels = useMemo(
    () => Object.fromEntries(options.locations.map((location) => [location.id, location.name])),
    [options.locations],
  );

  const singleLocation = options.locations.length <= 1;

  function updateRow(key: string, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setVariants((rows) => [...rows, newRow()]);
  }

  function removeRow(row: VariantRow) {
    if (row.id) {
      // Existing variant: archive rather than delete (keeps sales history valid).
      updateRow(row.key, { active: !row.active });
    } else {
      setVariants((rows) => rows.filter((r) => r.key !== row.key));
    }
  }

  const openingTotal = variants.reduce(
    (sum, row) => sum + (row.id ? 0 : Number(row.opening) || 0),
    0,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("productId", product.productId);
    formData.set("locationId", locationId);
    formData.set(
      "variantsJson",
      JSON.stringify(
        variants.map((row) => ({
          id: row.id,
          label: row.label,
          costPrice: Number(row.cost) || 0,
          salePrice: Number(row.sale) || 0,
          reorderPoint: Number(row.reorder) || 0,
          active: row.active,
          openingStock: Number(row.opening) || 0,
        })),
      ),
    );

    const result: CreateProductResult = await updateProductAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Product updated");
    router.push("/inventory");
  }

  return (
    <form onSubmit={handleSubmit} id="edit-product-form">
      <FieldGroup>
        {error ? <FieldError>{error}</FieldError> : null}

        <Field>
          <FieldLabel htmlFor="name">Product name</FieldLabel>
          <Input id="name" name="name" defaultValue={product.name} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="brand">Brand</FieldLabel>
            <Input
              id="brand"
              name="brand"
              list="brand-options"
              defaultValue={product.brand ?? ""}
              placeholder="e.g. Zara, Fenty"
            />
            <datalist id="brand-options">
              {options.brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </Field>
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Input
              id="category"
              name="category"
              list="category-options"
              defaultValue={product.category ?? ""}
              placeholder="e.g. Women's Fashion"
            />
            <datalist id="category-options">
              {options.categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="unit">Unit</FieldLabel>
            <Input id="unit" name="unit" defaultValue={product.unit} placeholder="pcs, set, pair…" />
          </Field>
          <Field>
            <FieldLabel htmlFor="sku">SKU (optional)</FieldLabel>
            <Input id="sku" name="sku" defaultValue={product.sku ?? ""} placeholder="e.g. WMN-001" />
          </Field>
        </div>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Variants</FieldLabel>
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-meta" onClick={addRow}>
              <Plus className="size-3.5" />
              Add variant
            </Button>
          </div>
          <p className="text-caption text-muted-foreground">
            Edit prices and reorder points. Stock changes go through Adjust stock. Archiving keeps
            past sales intact.
          </p>
          <div className="space-y-3">
            {variants.map((row, index) => (
              <div
                key={row.key}
                className={cn(
                  "space-y-2 rounded-md border p-2.5",
                  !row.active && "border-dashed opacity-60",
                )}
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={row.label}
                    onChange={(event) => updateRow(row.key, { label: event.target.value })}
                    placeholder={variants.length > 1 ? `Option ${index + 1} (e.g. Black / M)` : "Option name (optional)"}
                    className="flex-1"
                    aria-label="Variant option"
                    disabled={!row.active}
                  />
                  {row.id ? (
                    <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
                      {row.stock} in stock
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => removeRow(row)}
                    aria-label={row.id ? (row.active ? "Archive variant" : "Restore variant") : "Remove variant"}
                  >
                    {row.id ? (
                      row.active ? (
                        <X className="size-3.5" />
                      ) : (
                        <ArchiveRestore className="size-3.5" />
                      )
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
                <div className={cn("grid gap-2", row.id ? "grid-cols-3" : "grid-cols-4")}>
                  <Field>
                    <FieldLabel className="text-caption" htmlFor={`cost-${row.key}`}>
                      Cost
                    </FieldLabel>
                    <Input
                      id={`cost-${row.key}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.cost}
                      onChange={(event) => updateRow(row.key, { cost: event.target.value })}
                      disabled={!row.active}
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-caption" htmlFor={`sale-${row.key}`}>
                      Sale
                    </FieldLabel>
                    <Input
                      id={`sale-${row.key}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.sale}
                      onChange={(event) => updateRow(row.key, { sale: event.target.value })}
                      disabled={!row.active}
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-caption" htmlFor={`reorder-${row.key}`}>
                      Reorder
                    </FieldLabel>
                    <Input
                      id={`reorder-${row.key}`}
                      type="number"
                      min={0}
                      value={row.reorder}
                      onChange={(event) => updateRow(row.key, { reorder: event.target.value })}
                      disabled={!row.active}
                    />
                  </Field>
                  {row.id ? null : (
                    <Field>
                      <FieldLabel className="text-caption" htmlFor={`opening-${row.key}`}>
                        Opening
                      </FieldLabel>
                      <Input
                        id={`opening-${row.key}`}
                        type="number"
                        min={0}
                        value={row.opening}
                        onChange={(event) => updateRow(row.key, { opening: event.target.value })}
                      />
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Field>

        {openingTotal > 0 ? (
          <Field>
            {singleLocation ? (
              <p className="text-caption text-muted-foreground">
                {openingTotal} new unit{openingTotal > 1 ? "s" : ""} will be received into{" "}
                {options.locations[0]?.name ?? "your warehouse"}.
              </p>
            ) : (
              <>
                <FieldLabel htmlFor="locationId">Opening stock location</FieldLabel>
                <Select items={locationLabels} value={locationId} onValueChange={(value) => setLocationId(String(value ?? ""))}>
                  <SelectTrigger id="locationId" className="w-full">
                    <SelectValue placeholder="Choose a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-caption text-muted-foreground">
                  {openingTotal} new unit{openingTotal > 1 ? "s" : ""} will be received into this location.
                </p>
              </>
            )}
          </Field>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/inventory")}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-product-form" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
