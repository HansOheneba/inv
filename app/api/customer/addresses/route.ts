import type { AddressInput } from "@/lib/storefront/types";
import { createAddress, listAddresses } from "@/lib/storefront/customer";
import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse, sessionResponseHeaders } from "@/lib/api/cors";

export async function GET(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const addresses = await listAddresses(session.customerUuid!);
    return jsonResponse(request, addresses, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    console.error("[customer] GET /customer/addresses:", error);
    return errorResponse(request, "Could not load addresses.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const body = (await request.json()) as AddressInput;
    const address = await createAddress(session.customerUuid!, body);
    return jsonResponse(request, address, {
      status: 201,
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save address.";
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
