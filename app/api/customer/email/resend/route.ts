import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, optionsResponse, sessionResponseHeaders } from "@/lib/api/cors";
import { resendCustomerEmailVerification } from "@/lib/storefront/profile";

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const customer = await resendCustomerEmailVerification(session.customerUuid!);
    return jsonResponse(request, customer, {
      headers: sessionResponseHeaders(session.refreshedCookie),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not resend confirmation email.";
    console.error("[customer] POST /customer/email/resend:", error);
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
