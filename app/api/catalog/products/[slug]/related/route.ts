import { CATALOG_CACHE_SECONDS, getRelatedProducts } from "@/lib/catalog/queries";
import { serializeProducts } from "@/lib/catalog/serialize";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 4;
    const related = await getRelatedProducts(slug, Number.isFinite(limit) ? limit : 4);
    return jsonResponse(request, serializeProducts(related, request), {
      cacheSeconds: CATALOG_CACHE_SECONDS,
    });
  } catch (error) {
    console.error("[catalog] GET /products/:slug/related:", error);
    return errorResponse(request, "Could not load related products.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
