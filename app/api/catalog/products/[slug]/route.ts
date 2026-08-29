import { CATALOG_CACHE_SECONDS, getProductBySlug } from "@/lib/catalog/queries";
import { serializeProduct } from "@/lib/catalog/serialize";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) {
      return errorResponse(request, "Product not found.", 404);
    }
    return jsonResponse(request, serializeProduct(product, request), {
      cacheSeconds: CATALOG_CACHE_SECONDS,
    });
  } catch (error) {
    console.error("[catalog] GET /products/:slug:", error);
    return errorResponse(request, "Could not load product.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
