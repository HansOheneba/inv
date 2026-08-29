/**
 * Uploads public/images/products/* to Supabase Storage and rewrites catalog
 * image_urls in the database to stable public Supabase URLs.
 *
 * Run: node scripts/upload-catalog-images.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = join(root, ".env");
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeAssetPath(url) {
  if (!url) return "";
  if (url.startsWith("/images/")) return url;
  try {
    return new URL(url).pathname;
  } catch {
    return url.startsWith("/") ? url : `/images/products/${url}`;
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];

if (!supabaseUrl || !secretKey || !accessToken || !projectRef) {
  console.error("Missing SUPABASE_URL, SUPABASE_SECRET_KEY, or SUPABASE_ACCESS_TOKEN in .env");
  process.exit(1);
}

const bucket = "product-images";
const storagePrefix = "catalog";
const productsDir = join(root, "public/images/products");
const manifestPath = join(root, "lib/catalog/static-image-urls.json");

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runQuery(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(body);
  }
  return body ? JSON.parse(body) : [];
}

async function uploadCatalogImages() {
  const files = readdirSync(productsDir).filter((name) => name.endsWith(".jpg"));
  const manifest = {};

  console.log(`Uploading ${files.length} product images…`);

  for (const filename of files) {
    const localPath = `/images/products/${filename}`;
    const storagePath = `${storagePrefix}/${filename}`;
    const bytes = readFileSync(join(productsDir, filename));

    const { error } = await supabase.storage.from(bucket).upload(storagePath, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });

    if (error) {
      throw new Error(`Upload failed for ${filename}: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    manifest[localPath] = data.publicUrl;
    console.log(`  ${filename}`);
  }

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${manifestPath}`);
  return manifest;
}

function mapUrls(urls, manifest) {
  if (!urls?.length) return [];
  return urls.map((url) => {
    const path = normalizeAssetPath(url);
    return manifest[path] ?? url;
  });
}

async function rewriteDatabaseUrls(manifest) {
  const rows = await runQuery(`
    select v.id, v.image_urls
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where p.external_id is not null
      and v.image_urls is not null
      and jsonb_array_length(v.image_urls) > 0
  `);

  console.log(`Updating ${rows.length} variants…`);

  for (const row of rows) {
    const current = row.image_urls ?? [];
    const next = mapUrls(current, manifest);
    if (JSON.stringify(current) === JSON.stringify(next)) continue;

    await runQuery(`
      update public.product_variants
      set image_urls = ${sqlJson(next)}
      where id = '${row.id}'::uuid
    `);
  }

  await runQuery(`
    with variant_images as (
      select
        v.product_id,
        jsonb_array_elements_text(v.image_urls) as url,
        v.is_default,
        v.name
      from public.product_variants v
      where v.active
        and v.image_urls is not null
        and jsonb_array_length(v.image_urls) > 0
    ),
    deduped as (
      select distinct on (product_id, url)
        product_id,
        url,
        is_default,
        name
      from variant_images
      order by product_id, url, is_default desc, name
    ),
    ordered as (
      select
        product_id,
        url,
        row_number() over (
          partition by product_id
          order by is_default desc, name, url
        ) as ord
      from deduped
    ),
    aggregated as (
      select
        product_id,
        jsonb_agg(to_jsonb(url) order by ord) as urls
      from ordered
      group by product_id
    )
    update public.products p
    set
      image_urls = a.urls,
      image_url = a.urls ->> 0
    from aggregated a
    where p.id = a.product_id
  `);

  console.log("Synced product galleries from variants.");
}

function sqlJson(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

try {
  const manifest = await uploadCatalogImages();
  await rewriteDatabaseUrls(manifest);
  console.log("Done.");
} catch (error) {
  console.error(error);
  process.exit(1);
}
