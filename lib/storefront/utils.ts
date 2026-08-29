import { SHIPPING_FLAT_RATE, SHIPPING_FREE_THRESHOLD } from "@/lib/storefront/constants";

export function computeShipping(subtotal: number): number {
  return subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

/** Ghana numbers stored as 233XXXXXXXXX (no +). */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `233${digits.slice(1)}`;
  if (!digits.startsWith("233")) digits = `233${digits}`;
  return digits;
}

export function isValidGhanaPhone(phone: string): boolean {
  return /^233[0-9]{9}$/.test(phone);
}

export function trackingNumber(orderNumber: number): string {
  return `RK-${orderNumber}`;
}

export function parseTrackingNumber(value: string): number | null {
  const match = value.trim().toUpperCase().match(/^RK-(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function externalId(prefix: string): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${prefix}-${suffix}`;
}
