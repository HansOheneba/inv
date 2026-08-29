import {
  createStorefrontOrder,
  getOrderByPublicId,
  getOrderByTrackingNumber,
  listCustomerOrders,
} from "@/lib/storefront/orders";
import type { CreateOrderInput } from "@/lib/storefront/types";
import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

export async function GET(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const orders = await listCustomerOrders(session.customerUuid!);
    return jsonResponse(request, orders);
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

    const session = await requireCustomerSession(request);
    const customerUuid = session.customerUuid;

    const result = await createStorefrontOrder(body, customerUuid);
    return jsonResponse(request, result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place order.";
    console.error("[orders] POST /orders:", error);
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
