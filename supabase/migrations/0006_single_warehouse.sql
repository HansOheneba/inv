-- Collapse to a single warehouse.
--
-- RAJ Kollections operates from one physical location, so the multi-location
-- model (warehouse + retail store + online) is dead weight: it only produced a
-- pointless "transfer stock" flow and an extra column to scan past. This folds
-- all on-hand stock and movement/sales history into one canonical warehouse and
-- removes the rest. Idempotent — re-running is a no-op once only one location
-- remains.

do $$
declare
  warehouse uuid;
begin
  -- Canonical warehouse: the seeded Accra Warehouse if present, otherwise the
  -- first warehouse-type location, otherwise any location at all.
  select id into warehouse
  from public.locations
  where id = '11111111-1111-1111-1111-111111111101';

  if warehouse is null then
    select id into warehouse from public.locations where type = 'warehouse' order by id limit 1;
  end if;
  if warehouse is null then
    select id into warehouse from public.locations order by id limit 1;
  end if;
  if warehouse is null then
    return; -- no locations, nothing to collapse
  end if;

  -- Fold stock held at other locations into the warehouse row, creating it when
  -- the variant only ever had stock elsewhere.
  insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
  select product_id, variant_id, warehouse, sum(quantity)
  from public.inventory_stock
  where location_id <> warehouse
  group by product_id, variant_id
  on conflict (variant_id, location_id)
  do update set quantity = inventory_stock.quantity + excluded.quantity,
                updated_at = now();

  delete from public.inventory_stock where location_id <> warehouse;

  -- Repoint history so the extra locations can be dropped without FK violations.
  update public.stock_movements set from_location_id = warehouse
  where from_location_id is not null and from_location_id <> warehouse;
  update public.stock_movements set to_location_id = warehouse
  where to_location_id is not null and to_location_id <> warehouse;
  update public.sales set location_id = warehouse
  where location_id is not null and location_id <> warehouse;

  delete from public.locations where id <> warehouse;
end $$;
