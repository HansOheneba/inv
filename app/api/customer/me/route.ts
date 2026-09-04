import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse, sessionResponseHeaders } from "@/lib/api/cors";

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

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
