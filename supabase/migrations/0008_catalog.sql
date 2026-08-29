-- Storefront catalog schema: departments, product merchandising fields, and
-- stable external IDs that match docs/admin-api-contract.json (p-001, dep-pantry, …).

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  slug text not null unique,
  name text not null,
  parent_id uuid references public.departments (id) on delete set null,
  sort_order integer not null default 0,
  image text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists departments_parent_idx on public.departments (parent_id);
create index if not exists departments_sort_idx on public.departments (sort_order);

alter table public.products
  add column if not exists external_id text unique,
  add column if not exists slug text unique,
  add column if not exists department_id uuid references public.departments (id),
  add column if not exists description text not null default '',
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists compare_at_price numeric(12, 2),
  add column if not exists in_stock boolean not null default true,
  add column if not exists popularity integer not null default 0,
  add column if not exists attributes jsonb not null default '{}'::jsonb,
  add column if not exists tags text[] not null default '{}',
  add column if not exists keywords text[] not null default '{}',
  add column if not exists catalog_created_at date;

alter table public.product_variants
  add column if not exists external_id text unique,
  add column if not exists image_urls jsonb;

create index if not exists products_department_idx on public.products (department_id);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_popularity_idx on public.products (popularity desc);
create index if not exists products_catalog_created_idx on public.products (catalog_created_at desc);
create index if not exists products_keywords_gin_idx on public.products using gin (keywords);
create index if not exists products_tags_gin_idx on public.products using gin (tags);

-- Public catalog reads (storefront API uses the service role in route handlers;
-- anon policies allow direct Supabase reads if needed later).
alter table public.departments enable row level security;
grant select on public.departments to anon, authenticated;

create policy "departments readable by anyone" on public.departments
  for select to anon, authenticated using (true);

create policy "owners manage departments" on public.departments
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

grant select on public.products to anon;
grant select on public.product_variants to anon;

create policy "catalog products readable by anyone" on public.products
  for select to anon using (external_id is not null and slug is not null);

create policy "catalog variants readable by anyone" on public.product_variants
  for select to anon using (
    exists (
      select 1
      from public.products p
      where p.id = product_id and p.external_id is not null
    )
  );

create policy "catalog stock readable by anyone" on public.inventory_stock
  for select to anon using (true);
