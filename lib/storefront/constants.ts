export const SHIPPING_FLAT_RATE = 25;
export const SHIPPING_FREE_THRESHOLD = 350;
export const CURRENCY = "GHS";

export const SESSION_COOKIE = "rk_customer_session";
/** Sliding window: session extends by this many days on activity. */
export const SESSION_DAYS = 400;
/** Re-issue cookie + extend DB expiry when fewer than this many days remain. */
export const SESSION_REFRESH_THRESHOLD_DAYS = 30;
export const OTP_EXPIRY_MINUTES = 10;

export const ADMIN_TO_STOREFRONT_STATUS = {
  confirmed: "processing",
  packed: "packed",
  out_for_delivery: "on_the_way",
  delivered: "delivered",
  cancelled: "cancelled",
} as const;

export type StorefrontOrderStatus =
  (typeof ADMIN_TO_STOREFRONT_STATUS)[keyof typeof ADMIN_TO_STOREFRONT_STATUS];
