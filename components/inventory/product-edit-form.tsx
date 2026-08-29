"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { updateProductAction, type CreateProductResult } from "@/lib/actions/products";
import { ImageUploadField } from "@/components/inventory/image-upload-field";
import { VariantPricingFields } from "@/components/inventory/variant-pricing-fields";
import { ProductImage } from "@/components/inventory/product-image";
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
import type { ProductDetail, VariantStockLocation } from "@/lib/data/inventory";
import { variantFieldsFromAttributes } from "@/lib/inventory/variant-attributes";
import type { DiscountType } from "@/lib/inventory/pricing";

interface VariantRow {
  key: string;
  id: string | null;
  label: string;
  color: string;
  size: string;
  weight: string;
  volume: string;
  imageUrl: string;
  listPrice: string;
  discountType: DiscountType | "";
  discountValue: string;
  cost: string;
  reorder: string;
  active: boolean;
  opening: string;
  stock: number;
  stockByLocation: VariantStockLocation[];
}

function rowFromVariant(variant: ProductDetail["variants"][number]): VariantRow {
  const fields = variantFieldsFromAttributes(variant.attributes);
  return {
    key: variant.variantId,
    id: variant.variantId,
    label: variant.isDefault ? "" : variant.name,
    color: fields.color,
    size: fields.size,
    weight: fields.weight,
    volume: fields.volume,
    imageUrl: variant.imageUrls[0] ?? "",
    listPrice: String(variant.compareAtPrice ?? variant.salePrice),
    discountType: variant.discountType ?? "",
    discountValue: variant.discountValue ? String(variant.discountValue) : "",
    cost: String(variant.costPrice),
    reorder: String(variant.reorderPoint),
    active: true,
    opening: "0",
    stock: variant.totalStock,
    stockByLocation: variant.stockByLocation,
  };
}

function newRow(): VariantRow {
  return {
    key: crypto.randomUUID(),
    id: null,
    label: "",
    color: "",
    size: "",
    weight: "",
    volume: "",
    imageUrl: "",
    listPrice: "0",
    discountType: "",
    discountValue: "0",
    cost: "0",
    reorder: "0",
    active: true,
    opening: "0",
    stock: 0,
    stockByLocation: [],
  };
}

function StockBreakdown({
  stockByLocation,
  totalStock,
  unit,
}: {
  stockByLocation: VariantStockLocation[];
  totalStock: number;
  unit: string;
}) {
  if (stockByLocation.length === 0) {
    return (
      <p className="text-caption text-muted-foreground">
        {totalStock > 0 ? `${totalStock} ${unit} total` : "No stock recorded"}
      </p>
    );
  }

  return (
    <div className="space-y-1 rounded-md bg-muted/40 px-2.5 py-2">
      {stockByLocation.map((location) => (
        <div key={location.locationId} className="flex items-center justify-between text-caption">
          <span className="text-muted-foreground">{location.locationName}</span>
          <span className="font-medium tabular-nums text-foreground">
            {location.quantity} {unit}
          </span>
        </div>
      ))}
      {stockByLocation.length > 1 ? (
        <div className="flex items-center justify-between border-t border-border/60 pt-1 text-caption">
          <span className="font-medium text-foreground">Total</span>
          <span className="font-semibold tabular-nums">{totalStock} {unit}</span>
        </div>
      ) : null}
    </div>
  );
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
  const [departmentId, setDepartmentId] = useState(
    product.departmentId ?? options.departments[0]?.id ?? "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMultipleVariants = variants.filter((row) => row.active).length > 1;
  const showColor = hasMultipleVariants || variants.some((row) => row.color);
  const showSize = variants.some((row) => row.size);
  const showWeight = !showColor && !showSize && variants.some((row) => row.weight);
  const showVolume = !showColor && !showSize && variants.some((row) => row.volume);

  const locationLabels = useMemo(
    () => Object.fromEntries(options.locations.map((location) => [location.id, location.name])),
    [options.locations],
  );

  const singleLocation = options.locations.length <= 1;

  const storefrontGallery = useMemo(
    () =>
      [...new Set(variants.filter((row) => row.active && row.imageUrl.trim()).map((row) => row.imageUrl))],
    [variants],
  );

  function updateRow(key: string, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setVariants((rows) => [...rows, newRow()]);
  }

  function removeRow(row: VariantRow) {
    if (row.id) {
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
          color: row.color,
          size: row.size,
          weight: row.weight,
          volume: row.volume,
          imageUrl: row.imageUrl,
          listPrice: Number(row.listPrice) || 0,
          discountType: row.discountType,
          discountValue: Number(row.discountValue) || 0,
          costPrice: Number(row.cost) || 0,
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
            <FieldLabel htmlFor="departmentId">Department</FieldLabel>
            <Select
              value={departmentId}
              onValueChange={(value) => setDepartmentId(value ?? "")}
            >
              <SelectTrigger id="departmentId">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {options.departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.parentName ? `${department.parentName} · ${department.name}` : department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="departmentId" value={departmentId} />
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
            Every product needs at least one variant. Upload a photo per active variant — that
            image represents that option on the storefront (colour, size, etc.).
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
                <div className="flex items-start gap-2">
                  <ProductImage
                    src={row.imageUrl || null}
                    alt={row.label || product.name}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={row.label}
                        onChange={(event) => updateRow(row.key, { label: event.target.value })}
                        placeholder={
                          hasMultipleVariants
                            ? `Option ${index + 1} label (optional)`
                            : "Option name (optional)"
                        }
                        className="flex-1"
                        aria-label="Variant label"
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

                    <div className="grid grid-cols-2 gap-2">
                      {showColor ? (
                        <Field>
                          <FieldLabel className="text-caption" htmlFor={`color-${row.key}`}>
                            Color
                          </FieldLabel>
                          <Input
                            id={`color-${row.key}`}
                            value={row.color}
                            onChange={(event) => updateRow(row.key, { color: event.target.value })}
                            placeholder="Black, Tan…"
                            disabled={!row.active}
                          />
                        </Field>
                      ) : null}
                      {showSize ? (
                        <Field>
                          <FieldLabel className="text-caption" htmlFor={`size-${row.key}`}>
                            Size
                          </FieldLabel>
                          <Input
                            id={`size-${row.key}`}
                            value={row.size}
                            onChange={(event) => updateRow(row.key, { size: event.target.value })}
                            placeholder="S, M, 42…"
                            disabled={!row.active}
                          />
                        </Field>
                      ) : null}
                      {showWeight ? (
                        <Field>
                          <FieldLabel className="text-caption" htmlFor={`weight-${row.key}`}>
                            Weight
                          </FieldLabel>
                          <Input
                            id={`weight-${row.key}`}
                            value={row.weight}
                            onChange={(event) => updateRow(row.key, { weight: event.target.value })}
                            placeholder="1kg, 5kg…"
                            disabled={!row.active}
                          />
                        </Field>
                      ) : null}
                      {showVolume ? (
                        <Field>
                          <FieldLabel className="text-caption" htmlFor={`volume-${row.key}`}>
                            Volume
                          </FieldLabel>
                          <Input
                            id={`volume-${row.key}`}
                            value={row.volume}
                            onChange={(event) => updateRow(row.key, { volume: event.target.value })}
                            placeholder="250ml, 1L…"
                            disabled={!row.active}
                          />
                        </Field>
                      ) : null}
                      <Field className={showColor || showSize || showWeight || showVolume ? "col-span-2" : ""}>
                        <FieldLabel className="text-caption">Variant image</FieldLabel>
                        <ImageUploadField
                          value={row.imageUrl}
                          onChange={(url) => updateRow(row.key, { imageUrl: url })}
                          productId={product.productId}
                          scope="variants"
                          label="Photo for this variant"
                        />
                      </Field>
                    </div>

                    <VariantPricingFields
                      row={{
                        listPrice: row.listPrice,
                        discountType: row.discountType,
                        discountValue: row.discountValue,
                      }}
                      onChange={(patch) => updateRow(row.key, patch)}
                      disabled={!row.active}
                    />

                    {row.id ? (
                      <StockBreakdown
                        stockByLocation={row.stockByLocation}
                        totalStock={row.stock}
                        unit={product.unit}
                      />
                    ) : null}
                  </div>
                </div>

                <div className={cn("grid gap-2", row.id ? "grid-cols-2" : "grid-cols-3")}>
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
          {storefrontGallery.length > 0 ? (
            <div className="mt-3 rounded-md border border-dashed p-2.5">
              <p className="mb-2 text-caption font-medium text-muted-foreground">
                Storefront gallery (from variant photos)
              </p>
              <div className="flex flex-wrap gap-2">
                {storefrontGallery.map((url) => (
                  <ProductImage key={url} src={url} alt={product.name} size="lg" />
                ))}
              </div>
            </div>
          ) : null}
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
