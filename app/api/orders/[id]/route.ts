import { getOrderByPublicId } from "@/lib/storefront/orders";
import { getCatalogClient } from "@/lib/catalog/client";
import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse, sessionResponseHeaders } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const { id } = await params;
    const orderNumber = Number(id);
    if (!Number.isFinite(orderNumber)) return errorResponse(request, "Order not found.", 404);

    const supabase = getCatalogClient();
    const { data: owned } = await supabase
      .from("orders")
      .select("order_number")
      .eq("order_number", orderNumber)
      .eq("customer_id", session.customerUuid!)
      .maybeSingle();

    if (!owned) return errorResponse(request, "Order not found.", 404);

    const order = await getOrderByPublicId(id);

    if (!order) return errorResponse(request, "Order not found.", 404);

    return jsonResponse(request, order, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    console.error("[orders] GET /orders/:id:", error);
    return errorResponse(request, "Could not load order.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
