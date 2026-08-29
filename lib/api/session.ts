import {
  resolveCustomerFromRequest,
  resolveCustomerIdFromRequest,
} from "@/lib/storefront/session";
import { errorResponse } from "@/lib/api/cors";

export async function requireCustomerSession(request: Request) {
  const [customer, customerUuid] = await Promise.all([
    resolveCustomerFromRequest(request),
    resolveCustomerIdFromRequest(request),
  ]);

  if (!customer || !customerUuid) {
    return {
      customer: null,
      customerUuid: null,
      response: errorResponse(request, "Sign in required.", 401),
    };
  }

  return { customer, customerUuid, response: null };
}
