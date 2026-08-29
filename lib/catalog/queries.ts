import { getCatalogClient } from "@/lib/catalog/client";
import {
  mapDepartment,
  mapProduct,
} from "@/lib/catalog/mappers";
import type {
  CatalogDepartment,
  CatalogProduct,
  CatalogProductFilters,
  CatalogProductListResult,
  CatalogSortKey,
} from "@/lib/catalog/types";

const CATALOG_CACHE_SECONDS = 60;

interface DepartmentRecord {
  id: string;
  external_id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  image: string;
  description: string;
}

interface ProductRecord {
  id: string;
  external_id: string;
  slug: string;
  name: string;
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
  department_id: string | null;
  departments: { external_id: string } | { external_id: string }[] | null;
}

interface VariantRecord {
  external_id: string | null;
  sku: string | null;
  attributes: Record<string, string> | null;
  sale_price: number;
  compare_at_price: number | null;
  image_urls: string[] | null;
  product_id: string;
  stock: number;
}

async function loadDepartments(): Promise<DepartmentRecord[]> {
  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, external_id, slug, name, parent_id, sort_order, image, description")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

function parentExternalId(
  row: DepartmentRecord,
  departments: DepartmentRecord[],
): string | null {
  if (!row.parent_id) return null;
  return departments.find((dep) => dep.id === row.parent_id)?.external_id ?? null;
}

export async function listDepartments(): Promise<CatalogDepartment[]> {
  const departments = await loadDepartments();
  return departments.map((row) => mapDepartment(row, parentExternalId(row, departments)));
}

export async function getDepartmentBySlug(slug: string): Promise<CatalogDepartment | null> {
  const departments = await loadDepartments();
  const row = departments.find((dep) => dep.slug === slug);
  if (!row) return null;
  return mapDepartment(row, parentExternalId(row, departments));
}

async function departmentIdsForSlug(slug: string): Promise<string[] | null> {
  const departments = await loadDepartments();
  const target = departments.find((dep) => dep.slug === slug);
  if (!target) return null;

  const childIds = departments
    .filter((dep) => dep.parent_id === target.id)
    .map((dep) => dep.id);

  if (childIds.length === 0) return [target.id];
  return childIds;
}

async function loadVariantStock(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, external_id")
    .in("product_id", productIds)
    .eq("active", true);

  if (error) throw error;

  const variantIds = (data ?? []).map((row) => row.id);
  if (variantIds.length === 0) return new Map();

  const { data: stockRows, error: stockError } = await supabase
    .from("inventory_stock")
    .select("variant_id, quantity")
    .in("variant_id", variantIds);

  if (stockError) throw stockError;

  const stockByVariant = new Map<string, number>();
  for (const row of stockRows ?? []) {
    stockByVariant.set(row.variant_id, (stockByVariant.get(row.variant_id) ?? 0) + row.quantity);
  }

  const stockByExternalId = new Map<string, number>();
  for (const variant of data ?? []) {
    if (!variant.external_id) continue;
    stockByExternalId.set(variant.external_id, stockByVariant.get(variant.id) ?? 0);
  }

  return stockByExternalId;
}

async function loadVariants(productIds: string[]): Promise<Map<string, VariantRecord[]>> {
  if (productIds.length === 0) return new Map();

  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("external_id, sku, attributes, sale_price, compare_at_price, image_urls, product_id")
    .in("product_id", productIds)
    .eq("active", true)
    .order("created_at");

  if (error) throw error;

  const stockByExternalId = await loadVariantStock(productIds);
  const byProduct = new Map<string, VariantRecord[]>();

  for (const row of data ?? []) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push({
      ...row,
      stock: row.external_id ? (stockByExternalId.get(row.external_id) ?? 0) : 0,
    });
    byProduct.set(row.product_id, list);
  }

  return byProduct;
}

function departmentExternalId(row: ProductRecord): string {
  const dep = row.departments;
  if (!dep) return "";
  if (Array.isArray(dep)) return dep[0]?.external_id ?? "";
  return dep.external_id;
}

function toProductRow(
  row: ProductRecord,
  variantsByProduct: Map<string, VariantRecord[]>,
): CatalogProduct {
  const variants = variantsByProduct.get(row.id) ?? [];
  const visibleVariants = variants.filter((variant) => variant.external_id);

  return mapProduct({
    external_id: row.external_id,
    slug: row.slug,
    name: row.name,
    department_external_id: departmentExternalId(row),
    brand: row.brand,
    description: row.description,
    image_urls: row.image_urls ?? [],
    sale_price: row.sale_price,
    compare_at_price: row.compare_at_price,
    in_stock: row.in_stock,
    catalog_created_at: row.catalog_created_at,
    popularity: row.popularity,
    attributes: row.attributes,
    tags: row.tags,
    keywords: row.keywords,
    variants: visibleVariants.map((variant) => ({
      external_id: variant.external_id,
      sku: variant.sku,
      attributes: variant.attributes,
      sale_price: variant.sale_price,
      compare_at_price: variant.compare_at_price,
      image_urls: variant.image_urls,
      stock: variant.stock ?? 0,
    })),
  });
}

const PRODUCT_SELECT = `
  id,
  external_id,
  slug,
  name,
  brand,
  description,
  image_urls,
  sale_price,
  compare_at_price,
  in_stock,
  catalog_created_at,
  popularity,
  attributes,
  tags,
  keywords,
  department_id,
  departments ( external_id )
`;

async function loadCatalogProducts(filters?: CatalogProductFilters): Promise<CatalogProduct[]> {
  const supabase = getCatalogClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .not("external_id", "is", null)
    .not("slug", "is", null);

  if (filters?.department) {
    const departmentIds = await departmentIdsForSlug(filters.department);
    if (!departmentIds) return [];
    query = query.in("department_id", departmentIds);
  }

  if (filters?.q) {
    const term = filters.q.trim();
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,description.ilike.%${term}%,slug.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as ProductRecord[];
  const productIds = rows.map((row) => row.id);
  const variantsByProduct = await loadVariants(productIds);

  let products = rows.map((row) => toProductRow(row, variantsByProduct));

  if (filters?.q) {
    const term = filters.q.trim().toLowerCase();
    products = products.filter((product) => {
      const haystack = [
        product.name,
        product.description,
        product.slug,
        ...(product.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  if (filters?.min != null) {
    products = products.filter((product) => product.price >= filters.min!);
  }

  if (filters?.max != null) {
    products = products.filter((product) => product.price <= filters.max!);
  }

  if (filters?.stock) {
    products = products.filter((product) => product.inStock);
  }

  if (filters?.sale) {
    products = products.filter(
      (product) =>
        product.compareAtPrice != null && product.compareAtPrice > product.price,
    );
  }

  return products;
}

function sortProducts(products: CatalogProduct[], sort: CatalogSortKey = "featured"): CatalogProduct[] {
  const sorted = [...products];

  switch (sort) {
    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "popularity":
    case "featured":
    default:
      sorted.sort(
        (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || b.createdAt.localeCompare(a.createdAt),
      );
      break;
  }

  return sorted;
}

function listBounds(products: CatalogProduct[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 0 };
  const prices = products.map((product) => product.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export async function listProducts(
  filters: CatalogProductFilters = {},
): Promise<CatalogProductListResult> {
  const products = sortProducts(await loadCatalogProducts(filters), filters.sort);
  return {
    items: products,
    total: products.length,
    bounds: listBounds(products),
  };
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .not("external_id", "is", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ProductRecord;
  const variantsByProduct = await loadVariants([row.id]);
  return toProductRow(row, variantsByProduct);
}

export async function getProductByExternalId(id: string): Promise<CatalogProduct | null> {
  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("external_id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ProductRecord;
  const variantsByProduct = await loadVariants([row.id]);
  return toProductRow(row, variantsByProduct);
}

export async function getRelatedProducts(
  slug: string,
  limit = 4,
): Promise<CatalogProduct[]> {
  const product = await getProductBySlug(slug);
  if (!product) return [];

  const supabase = getCatalogClient();
  const { data: department } = await supabase
    .from("departments")
    .select("slug")
    .eq("external_id", product.departmentId)
    .maybeSingle();

  if (!department) return [];

  const result = await listProducts({
    department: department.slug,
    stock: true,
    sort: "popularity",
  });

  return result.items.filter((item) => item.slug !== slug).slice(0, limit);
}

export async function searchProducts(q: string, limit = 6): Promise<CatalogProduct[]> {
  const term = q.trim().toLowerCase();
  if (!term) return [];

  const products = await loadCatalogProducts({ q: term });

  const scored = products
    .map((product) => ({
      product,
      score: searchScore(product, term),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.product);
}

function searchScore(product: CatalogProduct, term: string): number {
  let score = 0;
  const name = product.name.toLowerCase();
  const slug = product.slug.toLowerCase();
  const description = product.description.toLowerCase();

  if (name.includes(term)) score += 12;
  if (slug.includes(term)) score += 10;
  if (description.includes(term)) score += 4;
  if (product.keywords?.some((keyword) => keyword.toLowerCase().includes(term))) score += 6;
  if (product.inStock) score += 5;
  score += (product.popularity ?? 0) / 25;
  return score;
}

export { CATALOG_CACHE_SECONDS };
