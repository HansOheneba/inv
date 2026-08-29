import { CATALOG_CACHE_SECONDS, listDepartments } from "@/lib/catalog/queries";
import { serializeDepartments } from "@/lib/catalog/serialize";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

export async function GET(request: Request) {
  try {
    const departments = await listDepartments();
    return jsonResponse(request, serializeDepartments(departments, request), {
      cacheSeconds: CATALOG_CACHE_SECONDS,
    });
  } catch (error) {
    console.error("[catalog] GET /departments:", error);
    return errorResponse(request, "Could not load departments.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
