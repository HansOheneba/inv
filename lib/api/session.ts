import { resolveSessionFromRequest } from "@/lib/storefront/session";
import { errorResponse } from "@/lib/api/cors";

export async function requireCustomerSession(request: Request) {
  const session = await resolveSessionFromRequest(request);
  if (!session) {
    return {
      customer: null,
      customerUuid: null,
      refreshedCookie: undefined,
      response: errorResponse(request, "Sign in required.", 401),
    };
  }

  return { ...session, response: null };
}
