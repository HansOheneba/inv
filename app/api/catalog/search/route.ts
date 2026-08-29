import { CATALOG_CACHE_SECONDS, searchProducts } from "@/lib/catalog/queries";
import { serializeProducts } from "@/lib/catalog/serialize";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    if (!q) {
      return errorResponse(request, "Query parameter q is required.");
    }

    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 6;
    const results = await searchProducts(q, Number.isFinite(limit) ? limit : 6);

    return jsonResponse(request, serializeProducts(results, request), {
      cacheSeconds: CATALOG_CACHE_SECONDS,
    });
  } catch (error) {
    console.error("[catalog] GET /search:", error);
    return errorResponse(request, "Could not search products.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
