import { removeSavedItem } from "@/lib/storefront/customer";
import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, emptyResponse, optionsResponse } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const { productId } = await params;
    const variantId = new URL(request.url).searchParams.get("variantId");
    await removeSavedItem(session.customerUuid!, productId, variantId);
    return emptyResponse(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove saved item.";
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
