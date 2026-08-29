"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { formatDiscountPreview, type DiscountType } from "@/lib/inventory/pricing";

export interface VariantPricingRow {
  listPrice: string;
  discountType: DiscountType | "";
  discountValue: string;
}

export function VariantPricingFields({
  row,
  onChange,
  disabled = false,
}: {
  row: VariantPricingRow;
  onChange: (patch: Partial<VariantPricingRow>) => void;
  disabled?: boolean;
}) {
  const preview = formatDiscountPreview(
    Number(row.listPrice) || 0,
    row.discountType,
    Number(row.discountValue) || 0,
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Field>
          <FieldLabel className="text-caption">List price</FieldLabel>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={row.listPrice}
            onChange={(event) => onChange({ listPrice: event.target.value })}
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel className="text-caption">Discount type</FieldLabel>
          <Select
            value={row.discountType || "none"}
            onValueChange={(value) =>
              onChange({
                discountType: value === "none" ? "" : (value as DiscountType),
                discountValue: value === "none" ? "0" : row.discountValue,
              })
            }
          >
            <SelectTrigger disabled={disabled}>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="amount">Fixed amount (GHS)</SelectItem>
              <SelectItem value="percent">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel className="text-caption">Discount value</FieldLabel>
          <Input
            type="number"
            min={0}
            step={row.discountType === "percent" ? "1" : "0.01"}
            max={row.discountType === "percent" ? 100 : undefined}
            value={row.discountValue}
            onChange={(event) => onChange({ discountValue: event.target.value })}
            placeholder={row.discountType === "percent" ? "e.g. 15" : "e.g. 20"}
            disabled={disabled || !row.discountType}
          />
        </Field>
      </div>
      <p className="text-caption text-muted-foreground">
        Customer pays <span className="font-medium text-foreground">{preview}</span>
      </p>
    </div>
  );
}
