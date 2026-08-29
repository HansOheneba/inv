import { CATALOG_CACHE_SECONDS } from "@/lib/catalog/queries";
import { getOrderByTrackingNumber } from "@/lib/storefront/orders";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ trackingNumber: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { trackingNumber } = await params;
    const order = await getOrderByTrackingNumber(decodeURIComponent(trackingNumber));
    if (!order) return errorResponse(request, "Order not found.", 404);

    return jsonResponse(request, order, { cacheSeconds: CATALOG_CACHE_SECONDS });
  } catch (error) {
    console.error("[orders] GET /orders/track/:trackingNumber:", error);
    return errorResponse(request, "Could not load order.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
