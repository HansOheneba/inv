/**
 * Generates supabase/seed_catalog.sql from docs/admin-api-contract.json.
 * Run: node scripts/generate-catalog-seed.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(readFileSync(join(root, "docs/admin-api-contract.json"), "utf8"));

let imageManifest = {};
try {
  imageManifest = JSON.parse(readFileSync(join(root, "lib/catalog/static-image-urls.json"), "utf8"));
} catch {
  // Run scripts/upload-catalog-images.mjs first to populate Supabase URLs.
}

function resolveCatalogImage(pathOrUrl) {
  if (!pathOrUrl) return pathOrUrl;
  if (imageManifest[pathOrUrl]) return imageManifest[pathOrUrl];
  return pathOrUrl;
}

function resolveCatalogImages(urls) {
  return (urls ?? []).map(resolveCatalogImage);
}

const WAREHOUSE_ID = "11111111-1111-1111-1111-111111111101";

function uuidFromSeed(seed) {
  const hash = createHash("sha256").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function sqlTextArray(values) {
  if (!values?.length) return "'{}'::text[]";
  const items = values.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",");
  return `'{${items}}'::text[]`;
}

/** Assign product gallery images to a variant when the contract has no variant-level photos. */
function variantImageUrls(product, variants, variantIndex) {
  const variant = variants[variantIndex];
  if (variant.imageUrls?.length) return resolveCatalogImages(variant.imageUrls);

  const gallery = resolveCatalogImages(product.imageUrls ?? []);
  if (gallery.length === 0) return null;
  if (variants.length === 1) return gallery;

  return [gallery[variantIndex % gallery.length]];
}

const departmentUuid = new Map(
  contract.seedData.departments.map((dep) => [dep.id, uuidFromSeed(`department:${dep.id}`)]),
);

const lines = [
  "-- Raj Kollections storefront catalog seed (generated from docs/admin-api-contract.json)",
  "-- Safe to re-run: guarded by external_id checks.",
  "",
  "-- Ensure the single warehouse exists for variant stock.",
  `insert into public.locations (id, name, type)`,
  `select ${sqlString(WAREHOUSE_ID)}::uuid, 'Accra Warehouse', 'warehouse'`,
  `where not exists (select 1 from public.locations where id = ${sqlString(WAREHOUSE_ID)}::uuid);`,
  "",
];

for (const dep of contract.seedData.departments) {
  const id = departmentUuid.get(dep.id);
  const parentId = dep.parentId ? departmentUuid.get(dep.parentId) : null;
  lines.push(
    `insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)`,
    `select ${sqlString(id)}::uuid, ${sqlString(dep.id)}, ${sqlString(dep.slug)}, ${sqlString(dep.name)}, ${parentId ? `${sqlString(parentId)}::uuid` : "null"}, ${dep.sortOrder}, ${sqlString(dep.image)}, ${sqlString(dep.description)}`,
    `where not exists (select 1 from public.departments where external_id = ${sqlString(dep.id)});`,
    "",
  );
}

for (const product of contract.seedData.products) {
  const productId = uuidFromSeed(`product:${product.id}`);
  const departmentId = departmentUuid.get(product.departmentId);
  const compareAt = product.compareAtPrice ?? null;
  const brand = product.brand ?? null;
  const tags = product.tags ?? [];
  const keywords = product.keywords ?? [];
  const attributes = product.attributes ?? {};
  const imageUrls = resolveCatalogImages(product.imageUrls ?? []);
  const variants = product.variants ?? [];
  const baseVariant = variants[0];
  const costPrice = baseVariant?.price ?? product.price;
  const salePrice = product.price;

  lines.push(
    `insert into public.products (`,
    `  id, external_id, slug, name, department_id, brand, description, image_urls,`,
    `  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,`,
    `  sale_price, cost_price, reorder_point, unit, image_url`,
    `)`,
    `select`,
    `  ${sqlString(productId)}::uuid,`,
    `  ${sqlString(product.id)},`,
    `  ${sqlString(product.slug)},`,
    `  ${sqlString(product.name)},`,
    `  ${sqlString(departmentId)}::uuid,`,
    `  ${sqlString(brand)},`,
    `  ${sqlString(product.description)},`,
    `  ${sqlJson(imageUrls)},`,
    `  ${compareAt ?? "null"},`,
    `  ${product.inStock},`,
    `  ${sqlString(product.createdAt)}::date,`,
    `  ${product.popularity ?? 0},`,
    `  ${sqlJson(attributes)},`,
    `  ${sqlTextArray(tags)},`,
    `  ${sqlTextArray(keywords)},`,
    `  ${salePrice},`,
    `  ${costPrice},`,
    `  0,`,
    `  'pcs',`,
    `  ${sqlString(imageUrls[0] ?? null)}`,
    `where not exists (select 1 from public.products where external_id = ${sqlString(product.id)});`,
    "",
  );

  if (variants.length === 0) {
    const variantId = uuidFromSeed(`variant:${product.id}:default`);
    const defaultImages = imageUrls.length ? imageUrls : null;
    lines.push(
      `insert into public.product_variants (`,
      `  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active`,
      `)`,
      `select`,
      `  ${sqlString(variantId)}::uuid,`,
      `  ${sqlString(`${product.id}-default`)},`,
      `  ${sqlString(productId)}::uuid,`,
      `  'Default',`,
      `  ${sqlString(product.slug.toUpperCase().slice(0, 12))},`,
      `  ${sqlJson(attributes)},`,
      `  ${defaultImages ? sqlJson(defaultImages) : "null"},`,
      `  ${costPrice},`,
      `  ${salePrice},`,
      `  0,`,
      `  true,`,
      `  true`,
      `where not exists (`,
      `  select 1 from public.product_variants where product_id = ${sqlString(productId)}::uuid`,
      `);`,
      "",
      `insert into public.inventory_stock (product_id, variant_id, location_id, quantity)`,
      `select ${sqlString(productId)}::uuid, ${sqlString(variantId)}::uuid, ${sqlString(WAREHOUSE_ID)}::uuid, ${product.inStock ? 10 : 0}`,
      `where not exists (`,
      `  select 1 from public.inventory_stock where variant_id = ${sqlString(variantId)}::uuid`,
      `);`,
      "",
    );
    continue;
  }

  for (const [index, variant] of variants.entries()) {
    const variantId = uuidFromSeed(`variant:${variant.id}`);
    const variantName =
      Object.values(variant.attributes ?? {}).join(" / ") || variant.sku || `Option ${index + 1}`;
    const imageUrlsVariant = variantImageUrls(product, variants, index);

    lines.push(
      `insert into public.product_variants (`,
      `  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active`,
      `)`,
      `select`,
      `  ${sqlString(variantId)}::uuid,`,
      `  ${sqlString(variant.id)},`,
      `  ${sqlString(productId)}::uuid,`,
      `  ${sqlString(variantName)},`,
      `  ${sqlString(variant.sku)},`,
      `  ${sqlJson(variant.attributes ?? {})},`,
      `  ${imageUrlsVariant ? sqlJson(imageUrlsVariant) : "null"},`,
      `  ${variant.price},`,
      `  ${variant.price},`,
      `  0,`,
      `  ${variants.length === 1},`,
      `  true`,
      `where not exists (select 1 from public.product_variants where external_id = ${sqlString(variant.id)});`,
      "",
      `insert into public.inventory_stock (product_id, variant_id, location_id, quantity)`,
      `select ${sqlString(productId)}::uuid, ${sqlString(variantId)}::uuid, ${sqlString(WAREHOUSE_ID)}::uuid, ${variant.stock}`,
      `where not exists (`,
      `  select 1 from public.inventory_stock where variant_id = ${sqlString(variantId)}::uuid`,
      `);`,
      "",
    );
  }
}

const outPath = join(root, "supabase/seed_catalog.sql");
writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath}`);
