export type DiscountType = "amount" | "percent";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeVariantSalePrice(
  listPrice: number,
  discountType: DiscountType | null,
  discountValue: number,
): number {
  if (listPrice <= 0) return 0;
  if (!discountType || discountValue <= 0) return roundMoney(listPrice);
  if (discountType === "amount") return roundMoney(Math.max(0, listPrice - discountValue));
  return roundMoney(Math.max(0, listPrice * (1 - discountValue / 100)));
}

export function variantCompareAtPrice(
  listPrice: number,
  discountType: DiscountType | null,
  discountValue: number,
): number | null {
  if (!discountType || discountValue <= 0 || listPrice <= 0) return null;
  return roundMoney(listPrice);
}

export interface VariantDiscountFields {
  listPrice: number;
  discountType: DiscountType | null;
  discountValue: number;
  salePrice: number;
  compareAtPrice: number | null;
}

export function resolveVariantPricing(input: {
  listPrice: number;
  discountType: DiscountType | "" | null;
  discountValue: number;
}): VariantDiscountFields {
  const listPrice = roundMoney(Math.max(0, input.listPrice));
  const discountType = input.discountType === "amount" || input.discountType === "percent"
    ? input.discountType
    : null;
  const discountValue = roundMoney(Math.max(0, input.discountValue));
  const salePrice = computeVariantSalePrice(listPrice, discountType, discountValue);
  const compareAtPrice = variantCompareAtPrice(listPrice, discountType, discountValue);

  return {
    listPrice,
    discountType,
    discountValue: discountType ? discountValue : 0,
    salePrice,
    compareAtPrice,
  };
}

export function formatDiscountPreview(
  listPrice: number,
  discountType: DiscountType | "" | null,
  discountValue: number,
): string {
  const pricing = resolveVariantPricing({ listPrice, discountType, discountValue });
  if (!pricing.compareAtPrice) {
    return `GHS ${pricing.salePrice.toFixed(2)}`;
  }
  return `GHS ${pricing.salePrice.toFixed(2)} (was GHS ${pricing.listPrice.toFixed(2)})`;
}
