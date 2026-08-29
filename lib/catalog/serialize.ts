import {
  catalogAssetOrigin,
  resolveCatalogImageUrl,
  resolveCatalogImageUrls,
} from "@/lib/catalog/images";
import type {
  CatalogDepartment,
  CatalogProduct,
  CatalogProductListResult,
} from "@/lib/catalog/types";

export function serializeDepartment(
  department: CatalogDepartment,
  request?: Request,
): CatalogDepartment {
  const origin = catalogAssetOrigin(request);
  return {
    ...department,
    image: resolveCatalogImageUrl(department.image, origin),
  };
}

export function serializeProduct(product: CatalogProduct, request?: Request): CatalogProduct {
  const origin = catalogAssetOrigin(request);
  return {
    ...product,
    imageUrls: resolveCatalogImageUrls(product.imageUrls, origin),
    variants: product.variants?.map((variant) => ({
      ...variant,
      imageUrls: variant.imageUrls
        ? resolveCatalogImageUrls(variant.imageUrls, origin)
        : undefined,
    })),
  };
}

export function serializeProductList(
  result: CatalogProductListResult,
  request?: Request,
): CatalogProductListResult {
  return {
    ...result,
    items: result.items.map((item) => serializeProduct(item, request)),
  };
}

export function serializeDepartments(
  departments: CatalogDepartment[],
  request?: Request,
): CatalogDepartment[] {
  return departments.map((department) => serializeDepartment(department, request));
}

export function serializeProducts(
  products: CatalogProduct[],
  request?: Request,
): CatalogProduct[] {
  return products.map((product) => serializeProduct(product, request));
}
