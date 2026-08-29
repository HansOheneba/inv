-- Inventory now reflects the live storefront catalogue only (no legacy demo
-- seed products). Stock totals come from inventory_stock; in_stock stays in sync.

create or replace function public.sync_product_in_stock(target_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  stock_total integer;
begin
  select coalesce(sum(s.quantity), 0)::int
  into stock_total
  from public.inventory_stock s
  join public.product_variants v on v.id = s.variant_id
  where v.product_id = target_product_id
    and v.active;

  update public.products
  set in_stock = stock_total > 0
  where id = target_product_id;
end;
$$;

create or replace function public.sync_product_in_stock_from_stock_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_product_in_stock(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists inventory_stock_sync_in_stock on public.inventory_stock;
create trigger inventory_stock_sync_in_stock
  after insert or update or delete on public.inventory_stock
  for each row execute function public.sync_product_in_stock_from_stock_row();

drop view if exists public.product_stock_overview;
create or replace view public.product_stock_overview
with (security_invoker = true) as
select
  p.id as product_id,
  p.external_id,
  p.slug,
  p.name,
  p.sku,
  p.barcode,
  d.name as department_name,
  p.unit,
  p.reorder_point,
  p.cost_price,
  p.sale_price,
  p.image_url,
  p.in_stock,
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
  )::int as variant_count,
  p.brand
from public.products p
left join public.departments d on d.id = p.department_id
left join public.inventory_stock s on s.product_id = p.id
where p.external_id is not null
group by
  p.id,
  p.external_id,
  p.slug,
  p.name,
  p.sku,
  p.barcode,
  d.name,
  p.unit,
  p.reorder_point,
  p.cost_price,
  p.sale_price,
  p.image_url,
  p.in_stock,
  p.brand;

drop view if exists public.variant_stock_overview;
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
  d.name as department_name,
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
left join public.departments d on d.id = p.department_id
left join public.inventory_stock s on s.variant_id = v.id
where p.external_id is not null
group by
  v.id,
  v.product_id,
  p.name,
  v.name,
  v.attributes,
  v.sku,
  v.barcode,
  v.is_default,
  v.active,
  d.name,
  p.unit,
  v.reorder_point,
  v.cost_price,
  v.sale_price;

-- Backfill in_stock from live variant stock.
select public.sync_product_in_stock(p.id)
from public.products p
where p.external_id is not null;

-- Remove legacy demo catalogue (fashion seed) — storefront uses catalog seed only.
delete from public.stock_movements
where product_id in (select id from public.products where external_id is null);

delete from public.inventory_stock
where product_id in (select id from public.products where external_id is null);

delete from public.order_items
where product_id in (select id from public.products where external_id is null);

delete from public.sale_items
where product_id in (select id from public.products where external_id is null);

delete from public.shipment_items
where product_id in (select id from public.products where external_id is null);

delete from public.product_variants
where product_id in (select id from public.products where external_id is null);

delete from public.orders
where id in (
  'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccc04'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccc11'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccc12'::uuid
);

delete from public.products where external_id is null;
