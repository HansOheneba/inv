-- Product variants — the real sellable unit.
--
-- RAJ Kollections sells fashion, beauty and home goods where a single product
-- (a dress, a perfume, a bedsheet) exists in several size / colour / volume
-- combinations, each with its own stock. Storing stock on the product would
-- lose that: "12 dresses" tells you nothing about how many Black / M are left.
--
-- So every product now has one or more variants, and stock, movements, and
-- every order/sale/shipment line reference a *variant*. Products with no real
-- options still get a single "Default" variant, so the whole system speaks one
-- language — the product is the catalogue entry, the variant is what actually
-- moves. Product-level price/reorder columns are kept as creation defaults and
-- as the base figure shown in the product-level inventory list.

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- Human label for the combination, e.g. "Black / M", "100ml", "Queen".
  -- "Default" for products that have no real options.
  name text not null default 'Default',
  sku text unique,
  barcode text,
  -- Flexible per-category options ({"Size":"M","Colour":"Black"} / {"Volume":"100ml"}).
  -- Kept as a map rather than rigid columns so beauty/home/fashion can each
  -- carry whatever axes make sense without schema churn.
  attributes jsonb not null default '{}'::jsonb,
  cost_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  reorder_point integer not null default 0,
  active boolean not null default true,
  -- The lone auto-created variant for an options-less product. Lets the UI hide
  -- variant pickers when there's nothing to choose.
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx on public.product_variants (product_id);

-- ============================================================================
-- Backfill: give every existing product a Default variant seeded from its own
-- price/reorder, so installs that already hold data migrate cleanly. On a fresh
-- database there are no products yet, so this is a no-op and seed.sql creates
-- variants directly.
-- ============================================================================
insert into public.product_variants (product_id, name, sku, cost_price, sale_price, reorder_point, is_default)
select p.id, 'Default', p.sku, p.cost_price, p.sale_price, p.reorder_point, true
from public.products p
where not exists (
  select 1 from public.product_variants v where v.product_id = p.id
);

-- ============================================================================
-- Point stock and every line-item table at variants. product_id is kept as a
-- denormalised column so product-level rollups (the inventory list, product
-- history) stay simple, while variant_id is the unit stock actually moves in.
-- ============================================================================

-- inventory_stock: stock is now held per (variant, location).
alter table public.inventory_stock
  add column if not exists variant_id uuid references public.product_variants (id) on delete cascade;

update public.inventory_stock s
set variant_id = v.id
from public.product_variants v
where v.product_id = s.product_id and v.is_default and s.variant_id is null;

alter table public.inventory_stock alter column variant_id set not null;
alter table public.inventory_stock drop constraint if exists inventory_stock_pkey;
alter table public.inventory_stock add primary key (variant_id, location_id);

-- stock_movements
alter table public.stock_movements
  add column if not exists variant_id uuid references public.product_variants (id);

update public.stock_movements m
set variant_id = v.id
from public.product_variants v
where v.product_id = m.product_id and v.is_default and m.variant_id is null;

alter table public.stock_movements alter column variant_id set not null;
create index if not exists stock_movements_variant_idx on public.stock_movements (variant_id, created_at desc);

-- sale_items
alter table public.sale_items
  add column if not exists variant_id uuid references public.product_variants (id);

update public.sale_items si
set variant_id = v.id
from public.product_variants v
where v.product_id = si.product_id and v.is_default and si.variant_id is null;

alter table public.sale_items alter column variant_id set not null;

-- order_items
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants (id);

update public.order_items oi
set variant_id = v.id
from public.product_variants v
where v.product_id = oi.product_id and v.is_default and oi.variant_id is null;

alter table public.order_items alter column variant_id set not null;

-- shipment_items
alter table public.shipment_items
  add column if not exists variant_id uuid references public.product_variants (id);

update public.shipment_items shi
set variant_id = v.id
from public.product_variants v
where v.product_id = shi.product_id and v.is_default and shi.variant_id is null;

alter table public.shipment_items alter column variant_id set not null;

-- ============================================================================
-- Order-level discount — a single amount the owner knocks off when locking in
-- an order (a haggled price, a loyalty gesture). Deliberately NOT a coupon
-- system; just one number that reduces the order total and the sale it becomes.
-- ============================================================================
alter table public.orders
  add column if not exists discount numeric(12, 2) not null default 0;

-- ============================================================================
-- variant_stock_overview — one row per variant with stock totalled across
-- locations. Mirrors product_stock_overview but at the sellable-unit grain, and
-- carries the product name so pickers can show "Ankara Dress · Black / M".
-- ============================================================================
create or replace view public.variant_stock_overview
with (security_invoker = true) as
select
  v.id as variant_id,
  v.product_id,
  p.name as product_name,
  v.name as variant_name,
  v.attributes,
  v.sku,
  v.barcode,
  v.is_default,
  v.active,
  p.category,
  p.unit,
  v.reorder_point,
  v.cost_price,
  v.sale_price,
  coalesce(sum(s.quantity), 0)::int as total_stock,
  (
    select l.name from public.inventory_stock s2
    join public.locations l on l.id = s2.location_id
    where s2.variant_id = v.id and s2.quantity > 0
    order by s2.quantity desc
    limit 1
  ) as primary_location
from public.product_variants v
join public.products p on p.id = v.product_id
left join public.inventory_stock s on s.variant_id = v.id
group by v.id, p.name, p.category, p.unit;

-- product_stock_overview keeps summing stock by product (unchanged join, since
-- inventory_stock still carries product_id) but now also reports how many
-- active variants a product has, so the list can show "3 variants".
create or replace view public.product_stock_overview
with (security_invoker = true) as
select
  p.id as product_id,
  p.name,
  p.sku,
  p.barcode,
  p.category,
  p.unit,
  p.reorder_point,
  p.cost_price,
  p.sale_price,
  p.image_url,
  coalesce(sum(s.quantity), 0)::int as total_stock,
  (
    select l.name from public.inventory_stock s2
    join public.locations l on l.id = s2.location_id
    where s2.product_id = p.id and s2.quantity > 0
    order by s2.quantity desc
    limit 1
  ) as primary_location,
  (
    select count(*) from public.inventory_stock s3
    where s3.product_id = p.id and s3.quantity > 0
  )::int as location_count,
  (
    select count(*) from public.product_variants pv
    where pv.product_id = p.id and pv.active
  )::int as variant_count
from public.products p
left join public.inventory_stock s on s.product_id = p.id
group by p.id;

-- ============================================================================
-- Grants + RLS — variants follow the same rules as products: any staff member
-- reads and edits them; only the owner deletes.
-- ============================================================================
grant select, insert, update, delete on public.product_variants to authenticated;
grant select on public.variant_stock_overview to authenticated;

alter table public.product_variants enable row level security;

create policy "variants readable by staff" on public.product_variants
  for select to authenticated using (true);
create policy "staff can add variants" on public.product_variants
  for insert to authenticated with check (true);
create policy "staff can update variants" on public.product_variants
  for update to authenticated using (true);
create policy "owners can delete variants" on public.product_variants
  for delete to authenticated using (public.is_owner());
