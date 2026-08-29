import type {
  CatalogDepartment,
  CatalogProduct,
  CatalogProductVariant,
  ProductTag,
} from "@/lib/catalog/types";

interface DepartmentRow {
  external_id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  image: string;
  description: string;
}

interface VariantRow {
  external_id: string | null;
  sku: string | null;
  attributes: Record<string, string> | null;
  sale_price: number;
  compare_at_price: number | null;
  image_urls: string[] | null;
  stock: number;
}

interface ProductRow {
  external_id: string;
  slug: string;
  name: string;
  department_external_id: string;
  brand: string | null;
  description: string;
  image_urls: string[];
  sale_price: number;
  compare_at_price: number | null;
  in_stock: boolean;
  catalog_created_at: string | null;
  popularity: number;
  attributes: Record<string, string> | null;
  tags: string[] | null;
  keywords: string[] | null;
  variants?: VariantRow[];
}

export function mapDepartment(
  row: DepartmentRow,
  parentExternalId: string | null,
): CatalogDepartment {
  return {
    id: row.external_id,
    slug: row.slug,
    name: row.name,
    parentId: parentExternalId,
    sortOrder: row.sort_order,
    image: row.image,
    description: row.description,
  };
}

function mapVariant(row: VariantRow): CatalogProductVariant | null {
  if (!row.external_id || !row.sku) return null;

  const variant: CatalogProductVariant = {
    id: row.external_id,
    sku: row.sku,
    attributes: row.attributes ?? {},
    price: Number(row.sale_price),
    stock: row.stock,
  };

  if (row.compare_at_price != null && row.compare_at_price > row.sale_price) {
    variant.compareAtPrice = Number(row.compare_at_price);
  }

  if (row.image_urls?.length) {
    variant.imageUrls = row.image_urls;
  }

  return variant;
}

export function mapProduct(row: ProductRow): CatalogProduct {
  const tags = (row.tags ?? []).filter(
    (tag): tag is ProductTag => tag === "sale" || tag === "new",
  );

  const product: CatalogProduct = {
    id: row.external_id,
    slug: row.slug,
    name: row.name,
    departmentId: row.department_external_id,
    description: row.description,
    imageUrls: row.image_urls ?? [],
    price: Number(row.sale_price),
    inStock: row.in_stock,
    createdAt: row.catalog_created_at ?? new Date().toISOString().slice(0, 10),
    attributes: row.attributes ?? {},
  };

  if (row.brand) product.brand = row.brand;
  if (row.compare_at_price != null) product.compareAtPrice = Number(row.compare_at_price);
  if (row.popularity) product.popularity = row.popularity;
  if (tags.length) product.tags = tags;
  if (row.keywords?.length) product.keywords = row.keywords;

  const variants = (row.variants ?? [])
    .map(mapVariant)
    .filter((variant): variant is CatalogProductVariant => variant !== null);

  if (variants.length > 0) {
    product.variants = variants;
  }

  return product;
}

export function isOnSale(product: CatalogProduct): boolean {
  if (product.tags?.includes("sale")) return true;
  return (
    product.compareAtPrice != null &&
    product.compareAtPrice > product.price
  );
}

export function hasAvailableStock(product: CatalogProduct): boolean {
  if (!product.inStock) return false;
  if (!product.variants?.length) return true;
  return product.variants.some((variant) => variant.stock > 0);
}
