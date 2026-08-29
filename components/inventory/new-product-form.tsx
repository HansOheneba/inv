"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createProductAction, type CreateProductResult } from "@/lib/actions/products";
import { ImageUploadField } from "@/components/inventory/image-upload-field";
import { VariantPricingFields } from "@/components/inventory/variant-pricing-fields";
import type { DiscountType } from "@/lib/inventory/pricing";
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
import { randomSkuSuffix, suggestProductSku } from "@/lib/sku";
import type { AdminDepartment } from "@/lib/data/departments";
import type { Tables } from "@/lib/supabase/types";

interface VariantRow {
  key: string;
  label: string;
  color: string;
  imageUrl: string;
  listPrice: string;
  discountType: DiscountType | "";
  discountValue: string;
  cost: string;
  reorder: string;
  opening: string;
}

export interface NewProductFormOptions {
  locations: Tables<"locations">[];
  brands: string[];
  departments: AdminDepartment[];
}

function newRow(): VariantRow {
  return {
    key: crypto.randomUUID(),
    label: "",
    color: "",
    imageUrl: "",
    listPrice: "0",
    discountType: "",
    discountValue: "0",
    cost: "0",
    reorder: "0",
    opening: "0",
  };
}

export function NewProductForm({ options }: { options: NewProductFormOptions }) {
  const router = useRouter();
  const [variants, setVariants] = useState<VariantRow[]>(() => [newRow()]);
  const [locationId, setLocationId] = useState(options.locations[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-suggest a human-readable SKU from the name/brand/category as the
  // owner fills the form, until they type into the SKU field themselves —
  // same pattern as a title-to-slug field, so it stays editable, not forced.
  const [skuSuffix] = useState(() => randomSkuSuffix());
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [departmentId, setDepartmentId] = useState(options.departments[0]?.id ?? "");
  const [sku, setSku] = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [draftId] = useState(() => crypto.randomUUID());

  const locationLabels = useMemo(
    () => Object.fromEntries(options.locations.map((location) => [location.id, location.name])),
    [options.locations],
  );

  const singleLocation = options.locations.length <= 1;
  const multiVariant = variants.length > 1;

  function suggestSku(next: { name: string; brand: string; departmentName: string }) {
    if (skuTouched) return;
    setSku(
      suggestProductSku({
        name: next.name,
        brand: next.brand,
        category: next.departmentName,
        suffix: skuSuffix,
      }),
    );
  }

  const selectedDepartment = options.departments.find((row) => row.id === departmentId);

  function updateRow(key: string, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setVariants((rows) => [...rows, newRow()]);
  }

  function removeRow(key: string) {
    setVariants((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  }

  const openingTotal = variants.reduce((sum, row) => sum + (Number(row.opening) || 0), 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("locationId", locationId);
    formData.set(
      "variantsJson",
      JSON.stringify(
        variants.map((row) => ({
          label: row.label,
          sku: null,
          color: row.color,
          size: "",
          weight: "",
          volume: "",
          imageUrl: row.imageUrl,
          listPrice: Number(row.listPrice) || 0,
          discountType: row.discountType,
          discountValue: Number(row.discountValue) || 0,
          costPrice: Number(row.cost) || 0,
          reorderPoint: Number(row.reorder) || 0,
          openingStock: Number(row.opening) || 0,
        })),
      ),
    );

    const result: CreateProductResult = await createProductAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Product added to inventory");
    router.push("/inventory");
  }

  return (
    <form onSubmit={handleSubmit} id="new-product-form">
      <FieldGroup>
        {error ? <FieldError>{error}</FieldError> : null}

        <Field>
          <FieldLabel htmlFor="name">Product name</FieldLabel>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(event) => {
              const value = event.target.value;
              setName(value);
              suggestSku({ name: value, brand, departmentName: selectedDepartment?.name ?? "" });
            }}
            placeholder="e.g. Floral Maxi Dress"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="brand">Brand</FieldLabel>
            <Input
              id="brand"
              name="brand"
              list="brand-options"
              value={brand}
              onChange={(event) => {
                const value = event.target.value;
                setBrand(value);
                suggestSku({ name, brand: value, departmentName: selectedDepartment?.name ?? "" });
              }}
              placeholder="e.g. Zara, Fenty"
            />
            <datalist id="brand-options">
              {options.brands.map((brandOption) => (
                <option key={brandOption} value={brandOption} />
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
            <Input id="unit" name="unit" defaultValue="pcs" placeholder="pcs, set, pair…" />
          </Field>
          <Field>
            <FieldLabel htmlFor="sku">SKU</FieldLabel>
            <Input
              id="sku"
              name="sku"
              value={sku}
              onChange={(event) => {
                setSku(event.target.value);
                setSkuTouched(true);
              }}
              placeholder="Auto-generated from the product name"
            />
            <p className="text-caption text-muted-foreground">
              Suggested from the name — edit it to whatever you use in-store.
            </p>
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
            A product always needs at least one variant before it can appear on the storefront.
            Upload a photo for each variant — that image is what shoppers see for that option.
          </p>
          <div className="space-y-3">
            {variants.map((row, index) => (
              <div key={row.key} className="space-y-2 rounded-md border p-2.5">
                <div className="flex items-start gap-2">
                  <Input
                    value={row.label}
                    onChange={(event) => updateRow(row.key, { label: event.target.value })}
                    placeholder={multiVariant ? `Option ${index + 1} (e.g. Black / M)` : "Option name (optional)"}
                    className="flex-1"
                    aria-label="Variant option"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => removeRow(row.key)}
                    disabled={variants.length === 1}
                    aria-label="Remove variant"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                {multiVariant ? (
                  <Field>
                    <FieldLabel className="text-caption">Color</FieldLabel>
                    <Input
                      value={row.color}
                      onChange={(event) => updateRow(row.key, { color: event.target.value })}
                      placeholder="Black, Tan…"
                    />
                  </Field>
                ) : null}
                <ImageUploadField
                  value={row.imageUrl}
                  onChange={(url) => updateRow(row.key, { imageUrl: url })}
                  productId={draftId}
                  scope="variants"
                  label="Photo for this variant"
                />
                <VariantPricingFields
                  row={{
                    listPrice: row.listPrice,
                    discountType: row.discountType,
                    discountValue: row.discountValue,
                  }}
                  onChange={(patch) => updateRow(row.key, patch)}
                />
                <div className="grid grid-cols-3 gap-2">
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
                    />
                  </Field>
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
                </div>
              </div>
            ))}
          </div>
        </Field>

        {openingTotal > 0 ? (
          <Field>
            {singleLocation ? (
              <p className="text-caption text-muted-foreground">
                {openingTotal} unit{openingTotal > 1 ? "s" : ""} will be received into{" "}
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
                  {openingTotal} unit{openingTotal > 1 ? "s" : ""} will be received into this location.
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
          <Button type="submit" form="new-product-form" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Add product"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
