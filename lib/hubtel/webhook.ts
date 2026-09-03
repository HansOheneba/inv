export function isHubtelPaymentSuccess(responseCode: string): boolean {
  return responseCode === "0000";
}

export function extractClientReference(payload: Record<string, unknown>): string {
  const data = payload.Data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = (data as Record<string, unknown>).ClientReference;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }

  const topLevel = payload.ClientReference;
  if (typeof topLevel === "string" && topLevel.trim()) return topLevel.trim();

  return "";
}
