export interface HubtelConfig {
  clientId: string;
  clientSecret: string;
  merchantId: string;
  smsSenderId: string;
}

function readPortalUrl(): string {
  const base =
    process.env.PORTAL_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "production"
        ? "https://portal.rajkollections.com"
        : "http://localhost:3000");

  return base.replace(/\/$/, "");
}

export function getHubtelConfig(): HubtelConfig | null {
  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
  const merchantId = process.env.HUBTEL_MERCHANT_ID;

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    merchantId: merchantId ?? "",
    smsSenderId: process.env.HUBTEL_SMS_SENDER_ID ?? "RajKol",
  };
}

export function isHubtelSmsConfigured(): boolean {
  const config = getHubtelConfig();
  return config !== null && config.smsSenderId.length > 0;
}

export function isHubtelPaymentsConfigured(): boolean {
  const config = getHubtelConfig();
  return config !== null && config.merchantId.length > 0;
}

export function getPaymentCallbackUrl(): string {
  return `${readPortalUrl()}/webhooks/hubtel`;
}
