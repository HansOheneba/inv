import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse, sessionResponseHeaders } from "@/lib/api/cors";
import { updateCustomerProfile } from "@/lib/storefront/profile";

export async function GET(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;
    return jsonResponse(request, session.customer, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    console.error("[customer] GET /customer/me:", error);
    return errorResponse(request, "Could not load profile.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const body = (await request.json()) as {
      dateOfBirth?: string | null;
      email?: string | null;
    };

    const customer = await updateCustomerProfile(session.customerUuid!, {
      dateOfBirth: body.dateOfBirth,
      email: body.email,
    });

    return jsonResponse(request, customer, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update profile.";
    console.error("[customer] PATCH /customer/me:", error);
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
