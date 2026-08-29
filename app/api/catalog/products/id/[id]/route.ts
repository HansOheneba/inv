import { CATALOG_CACHE_SECONDS, getProductByExternalId } from "@/lib/catalog/queries";
import { serializeProduct } from "@/lib/catalog/serialize";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await getProductByExternalId(id);
    if (!product) {
      return errorResponse(request, "Product not found.", 404);
    }
    return jsonResponse(request, serializeProduct(product, request), {
      cacheSeconds: CATALOG_CACHE_SECONDS,
    });
  } catch (error) {
    console.error("[catalog] GET /products/id/:id:", error);
    return errorResponse(request, "Could not load product.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
