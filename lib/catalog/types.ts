export type ProductTag = "sale" | "new";

export type CatalogSortKey =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "popularity";

export interface CatalogDepartment {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  image: string;
  description: string;
}

export interface CatalogProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  imageUrls?: string[];
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  departmentId: string;
  brand?: string;
  description: string;
  imageUrls: string[];
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  createdAt: string;
  popularity?: number;
  attributes: Record<string, string>;
  variants?: CatalogProductVariant[];
  tags?: ProductTag[];
  keywords?: string[];
}

export interface CatalogProductListResult {
  items: CatalogProduct[];
  total: number;
  bounds: {
    min: number;
    max: number;
  };
}

export interface CatalogProductFilters {
  department?: string;
  q?: string;
  min?: number;
  max?: number;
  stock?: boolean;
  sale?: boolean;
  sort?: CatalogSortKey;
}
