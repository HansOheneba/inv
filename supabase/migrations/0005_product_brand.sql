-- Brand on products — RAJ Kollections resells many labels (boutiques, beauty
-- houses, home brands), and the owner wants to know which brand each product
-- comes from so she can track what sells and who to reorder from. Kept as a
-- simple free-text column rather than a brands table: it's a label for
-- filtering/grouping, not an entity with its own data (yet).

alter table public.products add column if not exists brand text;

-- Recreate product_stock_overview to surface brand. `create or replace view`
-- only allows appending columns at the end, so brand goes last.
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
  )::int as variant_count,
  p.brand
from public.products p
left join public.inventory_stock s on s.product_id = p.id
group by p.id;
