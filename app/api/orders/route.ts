import {
  createStorefrontOrder,
  getOrderByPublicId,
  getOrderByTrackingNumber,
  listCustomerOrders,
} from "@/lib/storefront/orders";
import type { CreateOrderInput } from "@/lib/storefront/types";
import { resolveSessionFromRequest } from "@/lib/storefront/session";
import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse, sessionResponseHeaders } from "@/lib/api/cors";

export async function GET(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const orders = await listCustomerOrders(session.customerUuid!);
    return jsonResponse(request, orders, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    console.error("[orders] GET /orders:", error);
    return errorResponse(request, "Could not load orders.", 500);
  }
}

export async function POST(request: Request) {
  try {
    let body: CreateOrderInput;
    try {
      body = (await request.json()) as CreateOrderInput;
    } catch {
      return errorResponse(request, "Invalid order payload.");
    }

    const session = await resolveSessionFromRequest(request);
    const result = await createStorefrontOrder(body, session?.customerUuid ?? null);
    return jsonResponse(request, result, {
      status: 201,
      headers: sessionResponseHeaders(session?.refreshedCookie),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place order.";
    console.error("[orders] POST /orders:", error);
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
