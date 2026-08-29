import type { AddressInput } from "@/lib/storefront/types";
import { deleteAddress, updateAddress } from "@/lib/storefront/customer";
import { requireCustomerSession } from "@/lib/api/session";
import { errorResponse, jsonResponse, emptyResponse, optionsResponse } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const { id } = await params;
    const body = (await request.json()) as Partial<AddressInput>;
    const address = await updateAddress(session.customerUuid!, id, body);
    return jsonResponse(request, address);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update address.";
    return errorResponse(request, message, 400);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requireCustomerSession(request);
    if (session.response) return session.response;

    const { id } = await params;
    await deleteAddress(session.customerUuid!, id);
    return emptyResponse(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete address.";
    return errorResponse(request, message, 400);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
