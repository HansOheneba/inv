import type { CatalogProductFilters, CatalogSortKey } from "@/lib/catalog/types";
import { CATALOG_CACHE_SECONDS, listProducts } from "@/lib/catalog/queries";
import { serializeProductList } from "@/lib/catalog/serialize";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

const SORT_KEYS: CatalogSortKey[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "popularity",
];

function parseFilters(url: URL): CatalogProductFilters {
  const sort = url.searchParams.get("sort");
  const min = url.searchParams.get("min");
  const max = url.searchParams.get("max");

  return {
    department: url.searchParams.get("department") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    min: min != null && min !== "" ? Number(min) : undefined,
    max: max != null && max !== "" ? Number(max) : undefined,
    stock: url.searchParams.get("stock") === "1",
    sale: url.searchParams.get("sale") === "1",
    sort: SORT_KEYS.includes(sort as CatalogSortKey)
      ? (sort as CatalogSortKey)
      : "featured",
  };
}

export async function GET(request: Request) {
  try {
    const filters = parseFilters(new URL(request.url));
    const result = await listProducts(filters);
    return jsonResponse(request, serializeProductList(result, request), {
      cacheSeconds: CATALOG_CACHE_SECONDS,
    });
  } catch (error) {
    console.error("[catalog] GET /products:", error);
    return errorResponse(request, "Could not load products.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
