-- Sample data so the app has something real to show before real operations
-- data exists. Safe to run multiple times (guarded by not-exists checks).
-- Profiles are NOT seeded here — they're created automatically by the
-- handle_new_user trigger the first time someone signs in via Supabase Auth.

insert into public.locations (id, name, type)
select * from (values
  ('11111111-1111-1111-1111-111111111101'::uuid, 'Accra Warehouse', 'warehouse'),
  ('11111111-1111-1111-1111-111111111102'::uuid, 'Osu Retail Store', 'store'),
  ('11111111-1111-1111-1111-111111111103'::uuid, 'Online Store', 'online')
) as v (id, name, type)
where not exists (select 1 from public.locations where id = v.id);

insert into public.suppliers (id, name, country, contact_name, contact_phone, notes)
select * from (values
  ('22222222-2222-2222-2222-222222222201'::uuid, 'Guangzhou Trading Co.', 'China', 'Wei Zhang', '+86 138 0000 0001', 'Bulk electronics & accessories'),
  ('22222222-2222-2222-2222-222222222202'::uuid, 'Istanbul Textiles Ltd.', 'Turkey', 'Ayşe Kaya', '+90 532 000 0002', 'Clothing & fabrics'),
  ('22222222-2222-2222-2222-222222222203'::uuid, 'Dubai Beauty Hub', 'UAE', 'Fatima Al-Sayed', '+971 50 000 0003', 'Cosmetics & fragrances')
) as v (id, name, country, contact_name, contact_phone, notes)
where not exists (select 1 from public.suppliers where id = v.id);

insert into public.sales_channels (id, name, type)
select * from (values
  ('33333333-3333-3333-3333-333333333301'::uuid, 'Instagram', 'instagram'),
  ('33333333-3333-3333-3333-333333333302'::uuid, 'WhatsApp', 'whatsapp'),
  ('33333333-3333-3333-3333-333333333303'::uuid, 'Facebook', 'facebook'),
  ('33333333-3333-3333-3333-333333333304'::uuid, 'Osu Store (walk-in)', 'physical_store'),
  ('33333333-3333-3333-3333-333333333305'::uuid, 'Online Store', 'online')
) as v (id, name, type)
where not exists (select 1 from public.sales_channels where id = v.id);

insert into public.products (id, name, sku, barcode, category, unit, reorder_point, cost_price, sale_price, image_url)
select * from (values
  ('44444444-4444-4444-4444-444444444401'::uuid, 'Wireless Earbuds Pro', 'ELC-001', '6901234500011', 'Electronics', 'pcs', 20, 45.00, 120.00, null),
  ('44444444-4444-4444-4444-444444444402'::uuid, 'Portable Power Bank 20000mAh', 'ELC-002', '6901234500028', 'Electronics', 'pcs', 15, 60.00, 150.00, null),
  ('44444444-4444-4444-4444-444444444403'::uuid, 'LED Ring Light 10"', 'ELC-003', '6901234500035', 'Electronics', 'pcs', 10, 80.00, 190.00, null),
  ('44444444-4444-4444-4444-444444444404'::uuid, 'Ladies Ankara Dress', 'CLO-001', '8690123450012', 'Clothing', 'pcs', 12, 55.00, 140.00, null),
  ('44444444-4444-4444-4444-444444444405'::uuid, 'Men''s Slim Fit Shirt', 'CLO-002', '8690123450029', 'Clothing', 'pcs', 15, 35.00, 90.00, null),
  ('44444444-4444-4444-4444-444444444406'::uuid, 'Turkish Silk Scarf', 'CLO-003', '8690123450036', 'Clothing', 'pcs', 20, 18.00, 55.00, null),
  ('44444444-4444-4444-4444-444444444407'::uuid, 'Matte Lipstick Set (6pc)', 'BTY-001', '9710123450013', 'Beauty', 'set', 10, 22.00, 65.00, null),
  ('44444444-4444-4444-4444-444444444408'::uuid, 'Argan Oil Hair Serum', 'BTY-002', '9710123450020', 'Beauty', 'pcs', 25, 12.00, 38.00, null),
  ('44444444-4444-4444-4444-444444444409'::uuid, 'Perfume Oil Discovery Set', 'BTY-003', '9710123450037', 'Beauty', 'set', 8, 30.00, 85.00, null),
  ('44444444-4444-4444-4444-444444444410'::uuid, 'Bluetooth Neck Speaker', 'ELC-004', '6901234500042', 'Electronics', 'pcs', 10, 40.00, 110.00, null)
) as v (id, name, sku, barcode, category, unit, reorder_point, cost_price, sale_price, image_url)
where not exists (select 1 from public.products where id = v.id);

-- Current stock on hand per location
insert into public.inventory_stock (product_id, location_id, quantity)
select * from (values
  ('44444444-4444-4444-4444-444444444401'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 86),
  ('44444444-4444-4444-4444-444444444401'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 14),
  ('44444444-4444-4444-4444-444444444402'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5),
  ('44444444-4444-4444-4444-444444444402'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 3),
  ('44444444-4444-4444-4444-444444444403'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0),
  ('44444444-4444-4444-4444-444444444404'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 22),
  ('44444444-4444-4444-4444-444444444404'::uuid, '11111111-1111-1111-1111-111111111103'::uuid, 9),
  ('44444444-4444-4444-4444-444444444405'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 41),
  ('44444444-4444-4444-4444-444444444406'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 8),
  ('44444444-4444-4444-4444-444444444407'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 33),
  ('44444444-4444-4444-4444-444444444408'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 60),
  ('44444444-4444-4444-4444-444444444409'::uuid, '11111111-1111-1111-1111-111111111103'::uuid, 2),
  ('44444444-4444-4444-4444-444444444410'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 17)
) as v (product_id, location_id, quantity)
where not exists (
  select 1 from public.inventory_stock
  where product_id = v.product_id and location_id = v.location_id
);

insert into public.shipments (id, supplier_id, reference_code, origin_country, status, currency, shipping_cost, customs_cost, ordered_at, expected_arrival, received_at, notes)
select * from (values
  ('55555555-5555-5555-5555-555555555501'::uuid, '22222222-2222-2222-2222-222222222201'::uuid, 'GZ-2026-014', 'China', 'in_transit', 'USD', 420.00, 0.00, current_date - 18, current_date + 9, null, 'Container consolidated with two other buyers'),
  ('55555555-5555-5555-5555-555555555502'::uuid, '22222222-2222-2222-2222-222222222202'::uuid, 'IST-2026-007', 'Turkey', 'customs', 'USD', 260.00, 180.00, current_date - 25, current_date + 2, null, 'Held at Tema port for inspection'),
  ('55555555-5555-5555-5555-555555555503'::uuid, '22222222-2222-2222-2222-222222222203'::uuid, 'DXB-2026-003', 'UAE', 'received', 'USD', 150.00, 95.00, current_date - 40, current_date - 20, current_date - 18, 'Air freight, arrived early')
) as v (id, supplier_id, reference_code, origin_country, status, currency, shipping_cost, customs_cost, ordered_at, expected_arrival, received_at, notes)
where not exists (select 1 from public.shipments where id = v.id);

insert into public.shipment_items (id, shipment_id, product_id, quantity, unit_cost, currency)
select * from (values
  ('66666666-6666-6666-6666-666666666601'::uuid, '55555555-5555-5555-5555-555555555501'::uuid, '44444444-4444-4444-4444-444444444401'::uuid, 100, 9.50, 'USD'),
  ('66666666-6666-6666-6666-666666666602'::uuid, '55555555-5555-5555-5555-555555555501'::uuid, '44444444-4444-4444-4444-444444444410'::uuid, 40, 8.00, 'USD'),
  ('66666666-6666-6666-6666-666666666603'::uuid, '55555555-5555-5555-5555-555555555502'::uuid, '44444444-4444-4444-4444-444444444404'::uuid, 30, 11.00, 'USD'),
  ('66666666-6666-6666-6666-666666666604'::uuid, '55555555-5555-5555-5555-555555555502'::uuid, '44444444-4444-4444-4444-444444444406'::uuid, 50, 3.50, 'USD'),
  ('66666666-6666-6666-6666-666666666605'::uuid, '55555555-5555-5555-5555-555555555503'::uuid, '44444444-4444-4444-4444-444444444409'::uuid, 20, 6.00, 'USD')
) as v (id, shipment_id, product_id, quantity, unit_cost, currency)
where not exists (select 1 from public.shipment_items where id = v.id);
