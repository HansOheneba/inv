import type { StorefrontOrderStatus } from "@/lib/storefront/constants";
import { ADMIN_TO_STOREFRONT_STATUS } from "@/lib/storefront/constants";

export interface StorefrontOrderAddress {
  name: string;
  line: string;
  city?: string;
  region: string;
}

export interface StorefrontOrderLine {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  attributes: Record<string, string>;
}

export interface StorefrontOrder {
  id: string;
  trackingNumber?: string;
  invoiceNumber?: string;
  paymentReference?: string;
  placedAt: string;
  status: StorefrontOrderStatus;
  deliveryDate: string;
  address: StorefrontOrderAddress;
  rider?: { name: string };
  shipping: number;
  subtotal: number;
  total: number;
  lines: StorefrontOrderLine[];
}

export interface CreateOrderLineInput {
  productId: string;
  variantId?: string;
  slug: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  attributes?: Record<string, string>;
}

export interface CreateOrderCustomerInput {
  name: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  address: string;
  mapsUrl?: string;
  notes?: string;
}

export interface CreateOrderInput {
  customerId?: string;
  customer: CreateOrderCustomerInput;
  lines: CreateOrderLineInput[];
  subtotal: number;
  shipping: number;
  total: number;
}

export interface CreateOrderResult {
  reference: string;
  orderId: string;
  trackingNumber: string;
  paymentReference?: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  line: string;
  mapsUrl?: string;
  isDefault: boolean;
}

export interface AddressInput {
  label: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  line: string;
  mapsUrl?: string;
  isDefault?: boolean;
}

export interface SavedItemSnapshot {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  optionLabel?: string;
}

export interface SavedItem {
  productId: string;
  variantId?: string;
  snapshot: SavedItemSnapshot;
  savedAt: string;
}

export function mapAdminStatus(status: string): StorefrontOrderStatus {
  return (
    ADMIN_TO_STOREFRONT_STATUS[status as keyof typeof ADMIN_TO_STOREFRONT_STATUS] ?? "processing"
  );
}
