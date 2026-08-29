import {
  CATALOG_CACHE_SECONDS,
  getDepartmentBySlug,
} from "@/lib/catalog/queries";
import { serializeDepartment } from "@/lib/catalog/serialize";
import { errorResponse, jsonResponse, optionsResponse } from "@/lib/api/cors";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const department = await getDepartmentBySlug(slug);
    if (!department) {
      return errorResponse(request, "Department not found.", 404);
    }
    return jsonResponse(request, serializeDepartment(department, request), {
      cacheSeconds: CATALOG_CACHE_SECONDS,
    });
  } catch (error) {
    console.error("[catalog] GET /departments/:slug:", error);
    return errorResponse(request, "Could not load department.", 500);
  }
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}
