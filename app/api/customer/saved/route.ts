import type { SavedItem } from "@/lib/storefront/types";
import { addSavedItem, listSavedItems, replaceSavedItems } from "@/lib/storefront/customer";
import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse, sessionResponseHeaders } from "@/lib/api/cors";

export async function GET(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const items = await listSavedItems(session.customerUuid!);
    return jsonResponse(request, items, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    console.error("[customer] GET /customer/saved:", error);
    return errorResponse(request, "Could not load saved items.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const body = (await request.json()) as SavedItem[];
    const items = await replaceSavedItems(session.customerUuid!, body);
    return jsonResponse(request, items, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update saved items.";
    return errorResponse(request, message, 400);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const body = (await request.json()) as SavedItem;
    const items = await addSavedItem(session.customerUuid!, body);
    return jsonResponse(request, items.at(-1) ?? body, {
      status: 201,
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save item.";
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
