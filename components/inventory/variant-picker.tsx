"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { VariantDetail } from "@/lib/data/inventory";

/**
 * Keeps a variant selection in sync with an async-loaded variant list. `ready`
 * is false until a variant is chosen (i.e. the list has arrived), so callers can
 * disable submit while the product's variants are still loading.
 */
export function useVariantSelection(variants: VariantDetail[] | null) {
  const [variantId, setVariantId] = useState("");

  useEffect(() => {
    if (!variants || variants.length === 0) {
      setVariantId("");
      return;
    }
    setVariantId((current) =>
      variants.some((v) => v.variantId === current) ? current : variants[0].variantId,
    );
  }, [variants]);

  return { variantId, setVariantId, ready: variantId !== "" };
}

/**
 * Variant selector for the stock dialogs. Renders nothing for options-less
 * products (a single Default variant) so the common case stays a one-tap flow,
 * and only surfaces a picker when there's a real choice to make.
 */
export function VariantPicker({
  variants,
  value,
  onValueChange,
}: {
  variants: VariantDetail[] | null;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const labels = useMemo(
    () => Object.fromEntries((variants ?? []).map((v) => [v.variantId, v.name])),
    [variants],
  );

  if (variants === null) {
    return (
      <Field>
        <FieldLabel>Variant</FieldLabel>
        <p className="text-meta text-muted-foreground">Loading variants…</p>
      </Field>
    );
  }

  if (variants.length <= 1) return null;

  return (
    <Field>
      <FieldLabel htmlFor="variant-picker">Variant</FieldLabel>
      <Select items={labels} value={value} onValueChange={(v) => onValueChange(String(v ?? ""))}>
        <SelectTrigger id="variant-picker" className="w-full">
          <SelectValue placeholder="Choose a variant" />
        </SelectTrigger>
        <SelectContent>
          {variants.map((variant) => (
            <SelectItem key={variant.variantId} value={variant.variantId}>
              <span className="flex-1">{variant.name}</span>
              <span
                className={cn(
                  "tabular-nums text-meta",
                  variant.totalStock <= 0 ? "text-status-out" : "text-muted-foreground",
                )}
              >
                {variant.totalStock} left
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
