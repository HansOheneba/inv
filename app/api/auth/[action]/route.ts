import { completeCustomerProfile, logoutCustomer, requestAuthCode, verifyAuthCode } from "@/lib/storefront/auth";
import { clearSessionCookieHeader } from "@/lib/storefront/session";
import { errorResponse, jsonResponse, emptyResponse, optionsResponse } from "@/lib/api/cors";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();

  try {
    if (action === "request-code") {
      const body = (await request.json()) as { phone?: string; profile?: { name?: string } };
      if (!body.phone) return errorResponse(request, "Phone is required.");
      const result = await requestAuthCode({ phone: body.phone, profile: body.profile });
      return jsonResponse(request, result);
    }

    if (action === "verify-code") {
      const body = (await request.json()) as { phone?: string; code?: string };
      if (!body.phone || !body.code) return errorResponse(request, "Phone and code are required.");
      const result = await verifyAuthCode({ phone: body.phone, code: body.code });
      const { setCookie, ...payload } = result;
      return jsonResponse(request, payload, {
        headers: setCookie ? { "Set-Cookie": setCookie } : undefined,
      });
    }

    if (action === "complete-profile") {
      const body = (await request.json()) as { name?: string };
      if (!body.name) return errorResponse(request, "Name is required.");
      const result = await completeCustomerProfile({ request, name: body.name });
      const { setCookie, ...payload } = result;
      return jsonResponse(request, payload, {
        headers: setCookie ? { "Set-Cookie": setCookie } : undefined,
      });
    }

    if (action === "logout") {
      await logoutCustomer(request);
      return emptyResponse(request, 204, { "Set-Cookie": clearSessionCookieHeader() });
    }

    return errorResponse(request, "Not found.", 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
