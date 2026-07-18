-- Sample data so the app has something real to show before real operations
-- data exists. Safe to run multiple times (guarded by not-exists checks).
-- Profiles are NOT seeded here — they're created automatically by the
-- handle_new_user trigger the first time someone signs in via Supabase Auth.
--
-- This mirrors RAJ Kollections' actual catalogue: fashion, beauty, home, bags,
-- shoes, accessories and gifts, with size/colour/volume variants that each hold
-- their own stock.

-- RAJ Kollections operates from a single warehouse, so all stock lives here.
insert into public.locations (id, name, type)
select * from (values
  ('11111111-1111-1111-1111-111111111101'::uuid, 'Accra Warehouse', 'warehouse')
) as v (id, name, type)
where not exists (select 1 from public.locations where id = v.id);

insert into public.suppliers (id, name, country, contact_name, contact_phone, notes)
select * from (values
  ('22222222-2222-2222-2222-222222222201'::uuid, 'Guangzhou Trading Co.', 'China', 'Wei Zhang', '+86 138 0000 0001', 'Bags, watches & accessories'),
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

-- Products -------------------------------------------------------------------
insert into public.products (id, name, sku, category, brand, unit, reorder_point, cost_price, sale_price)
select * from (values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'Floral Maxi Dress',          'WMN-001', 'Women''s Fashion', 'Amara Label',    'pcs', 6,  90.00, 240.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'Two-Piece Lounge Set',       'WMN-002', 'Women''s Fashion', 'Amara Label',    'pcs', 6,  110.00, 280.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03'::uuid, 'Open-Front Abaya',           'WMN-003', 'Women''s Fashion', 'Noor Modest',    'pcs', 4,  130.00, 320.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'Men''s Slim Fit Polo',       'MEN-001', 'Men''s Fashion',   'Kensington',     'pcs', 8,  55.00, 130.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'Men''s Embroidered Kaftan',  'MEN-002', 'Men''s Fashion',   'Sahel Menswear', 'pcs', 4,  150.00, 360.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, 'Block Heel Sandals',         'SHO-001', 'Shoes',            'Lagos Sole',     'pcs', 5,  85.00, 210.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, 'Leather Loafers',            'SHO-002', 'Shoes',            'Kensington',     'pcs', 5,  120.00, 300.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'Quilted Crossbody Bag',      'BAG-001', 'Bags',             'Milano Bags',    'pcs', 6,  70.00, 180.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09'::uuid, 'Faux-Leather Tote',          'BAG-002', 'Bags',             'Milano Bags',    'pcs', 5,  95.00, 240.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'Matte Liquid Lipstick',      'BEA-001', 'Beauty',           'Glow Cosmetics', 'pcs', 12, 15.00, 45.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'::uuid, 'Vitamin C Face Serum',       'BEA-002', 'Beauty',           'PureGlow',       'pcs', 10, 28.00, 80.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'::uuid, 'Oud Eau de Parfum',          'BEA-003', 'Beauty',           'Arabian Oud',    'pcs', 6,  60.00, 180.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'Stainless Steel Watch',      'ACC-001', 'Accessories',      'Meridian',       'pcs', 5,  90.00, 230.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14'::uuid, 'Layered Necklace Set',       'ACC-002', 'Accessories',      'Aurelia',        'pcs', 8,  25.00, 70.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'::uuid, 'Cotton Bedsheet Set',        'HOM-001', 'Home',             'HomeNest',       'set', 4,  120.00, 300.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16'::uuid, 'Blackout Curtain Pair',      'HOM-002', 'Home',             'HomeNest',       'pcs', 5,  80.00, 190.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa17'::uuid, 'Personalised Wooden Frame',  'GFT-001', 'Gifts',            'Keepsake Co.',   'pcs', 6,  35.00, 95.00)
) as v (id, name, sku, category, brand, unit, reorder_point, cost_price, sale_price)
where not exists (select 1 from public.products where id = v.id);

-- Variants (the real sellable units) — most fashion/beauty/home items carry
-- size/colour/volume options, each with its own stock; simple items keep a
-- single hidden "Default".
insert into public.product_variants (id, product_id, name, sku, attributes, cost_price, sale_price, reorder_point, is_default)
select * from (values
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000101'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'S',  'WMN-001-S',  '{"Size":"S"}'::jsonb,  90.00, 240.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000102'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'M',  'WMN-001-M',  '{"Size":"M"}'::jsonb,  90.00, 240.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000103'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'L',  'WMN-001-L',  '{"Size":"L"}'::jsonb,  90.00, 240.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000104'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'XL', 'WMN-001-XL', '{"Size":"XL"}'::jsonb, 90.00, 240.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000201'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'S', 'WMN-002-S', '{"Size":"S"}'::jsonb, 110.00, 280.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000202'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'M', 'WMN-002-M', '{"Size":"M"}'::jsonb, 110.00, 280.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000203'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'L', 'WMN-002-L', '{"Size":"L"}'::jsonb, 110.00, 280.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000301'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03'::uuid, 'Black', 'WMN-003-BLK', '{"Colour":"Black"}'::jsonb, 130.00, 320.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000302'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03'::uuid, 'Navy',  'WMN-003-NVY', '{"Colour":"Navy"}'::jsonb,  130.00, 320.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000401'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'M',   'MEN-001-M',   '{"Size":"M"}'::jsonb,   55.00, 130.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000402'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'L',   'MEN-001-L',   '{"Size":"L"}'::jsonb,   55.00, 130.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000403'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'XL',  'MEN-001-XL',  '{"Size":"XL"}'::jsonb,  55.00, 130.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000404'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'XXL', 'MEN-001-XXL', '{"Size":"XXL"}'::jsonb, 55.00, 130.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000501'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'M',  'MEN-002-M',  '{"Size":"M"}'::jsonb,  150.00, 360.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000502'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'L',  'MEN-002-L',  '{"Size":"L"}'::jsonb,  150.00, 360.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000503'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'XL', 'MEN-002-XL', '{"Size":"XL"}'::jsonb, 150.00, 360.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000601'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, '37', 'SHO-001-37', '{"Size":"37"}'::jsonb, 85.00, 210.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000602'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, '38', 'SHO-001-38', '{"Size":"38"}'::jsonb, 85.00, 210.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000603'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, '39', 'SHO-001-39', '{"Size":"39"}'::jsonb, 85.00, 210.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000604'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, '40', 'SHO-001-40', '{"Size":"40"}'::jsonb, 85.00, 210.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000701'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, '41', 'SHO-002-41', '{"Size":"41"}'::jsonb, 120.00, 300.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000702'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, '42', 'SHO-002-42', '{"Size":"42"}'::jsonb, 120.00, 300.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000703'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, '43', 'SHO-002-43', '{"Size":"43"}'::jsonb, 120.00, 300.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000704'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, '44', 'SHO-002-44', '{"Size":"44"}'::jsonb, 120.00, 300.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000801'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'Black', 'BAG-001-BLK', '{"Colour":"Black"}'::jsonb, 70.00, 180.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000802'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'Beige', 'BAG-001-BEI', '{"Colour":"Beige"}'::jsonb, 70.00, 180.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000803'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'Brown', 'BAG-001-BRN', '{"Colour":"Brown"}'::jsonb, 70.00, 180.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000900'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09'::uuid, 'Default', 'BAG-002', '{}'::jsonb, 95.00, 240.00, 4, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001001'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'Ruby',  'BEA-001-RBY', '{"Shade":"Ruby"}'::jsonb,  15.00, 45.00, 5, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001002'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'Nude',  'BEA-001-NUD', '{"Shade":"Nude"}'::jsonb,  15.00, 45.00, 5, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001003'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'Plum',  'BEA-001-PLM', '{"Shade":"Plum"}'::jsonb,  15.00, 45.00, 5, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001004'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'Coral', 'BEA-001-CRL', '{"Shade":"Coral"}'::jsonb, 15.00, 45.00, 5, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001100'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'::uuid, 'Default', 'BEA-002', '{}'::jsonb, 28.00, 80.00, 8, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001201'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'::uuid, '50ml',  'BEA-003-50',  '{"Volume":"50ml"}'::jsonb,  60.00, 180.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001202'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'::uuid, '100ml', 'BEA-003-100', '{"Volume":"100ml"}'::jsonb, 95.00, 280.00, 3, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001301'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'Silver',    'ACC-001-SLV', '{"Colour":"Silver"}'::jsonb,    90.00, 230.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001302'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'Gold',      'ACC-001-GLD', '{"Colour":"Gold"}'::jsonb,      90.00, 230.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001303'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'Rose Gold', 'ACC-001-RSG', '{"Colour":"Rose Gold"}'::jsonb, 90.00, 230.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001400'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14'::uuid, 'Default', 'ACC-002', '{}'::jsonb, 25.00, 70.00, 6, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001501'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'::uuid, 'Queen',      'HOM-001-Q',  '{"Size":"Queen"}'::jsonb,      120.00, 300.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001502'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'::uuid, 'King',       'HOM-001-K',  '{"Size":"King"}'::jsonb,       145.00, 360.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001503'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'::uuid, 'Super King', 'HOM-001-SK', '{"Size":"Super King"}'::jsonb, 170.00, 420.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001601'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16'::uuid, 'Grey',  'HOM-002-GRY', '{"Colour":"Grey"}'::jsonb,  80.00, 190.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001602'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16'::uuid, 'Cream', 'HOM-002-CRM', '{"Colour":"Cream"}'::jsonb, 80.00, 190.00, 2, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000001700'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa17'::uuid, 'Default', 'GFT-001', '{}'::jsonb, 35.00, 95.00, 4, true)
) as v (id, product_id, name, sku, attributes, cost_price, sale_price, reorder_point, is_default)
where not exists (select 1 from public.product_variants where id = v.id);

-- Current stock on hand (per variant, all in the single warehouse). A few are
-- deliberately low or zero so the low-stock and out-of-stock badges/counts show up.
insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select * from (values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000101'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000102'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000103'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000104'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000201'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000202'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000203'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000301'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 7),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000302'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000401'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 20),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000402'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 15),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000403'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 9),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000404'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000501'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000502'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000503'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000601'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000602'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000603'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000604'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000701'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000702'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000703'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000704'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000801'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000802'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000803'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 7),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000900'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 23),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001001'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 30),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001002'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 22),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001003'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001004'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001100'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 45),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001201'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 14),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001202'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001301'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001302'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001303'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001400'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 26),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001501'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 9),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001502'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001503'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001601'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001602'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa17'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001700'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 16)
) as v (product_id, variant_id, location_id, quantity)
where not exists (
  select 1 from public.inventory_stock
  where variant_id = v.variant_id and location_id = v.location_id
);

-- Imports in the pipeline (manual records) -----------------------------------
insert into public.shipments (id, supplier_id, reference_code, origin_country, status, currency, shipping_cost, customs_cost, ordered_at, expected_arrival, received_at, notes)
select * from (values
  ('55555555-5555-5555-5555-555555555501'::uuid, '22222222-2222-2222-2222-222222222201'::uuid, 'GZ-2026-014', 'China', 'in_transit', 'USD', 420.00, 0.00, current_date - 18, current_date + 9, null, 'Container consolidated with two other buyers'),
  ('55555555-5555-5555-5555-555555555502'::uuid, '22222222-2222-2222-2222-222222222202'::uuid, 'IST-2026-007', 'Turkey', 'customs', 'USD', 260.00, 180.00, current_date - 25, current_date + 2, null, 'Held at Tema port for inspection'),
  ('55555555-5555-5555-5555-555555555503'::uuid, '22222222-2222-2222-2222-222222222203'::uuid, 'DXB-2026-003', 'UAE', 'received', 'USD', 150.00, 95.00, current_date - 40, current_date - 20, current_date - 18, 'Air freight, arrived early')
) as v (id, supplier_id, reference_code, origin_country, status, currency, shipping_cost, customs_cost, ordered_at, expected_arrival, received_at, notes)
where not exists (select 1 from public.shipments where id = v.id);

insert into public.shipment_items (id, shipment_id, product_id, variant_id, quantity, unit_cost, currency)
select * from (values
  ('66666666-6666-6666-6666-666666666601'::uuid, '55555555-5555-5555-5555-555555555501'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001301'::uuid, 40, 22.00, 'USD'),
  ('66666666-6666-6666-6666-666666666602'::uuid, '55555555-5555-5555-5555-555555555501'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000801'::uuid, 60, 17.00, 'USD'),
  ('66666666-6666-6666-6666-666666666603'::uuid, '55555555-5555-5555-5555-555555555502'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000102'::uuid, 30, 22.00, 'USD'),
  ('66666666-6666-6666-6666-666666666604'::uuid, '55555555-5555-5555-5555-555555555502'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000402'::uuid, 50, 9.00, 'USD'),
  ('66666666-6666-6666-6666-666666666605'::uuid, '55555555-5555-5555-5555-555555555503'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001201'::uuid, 20, 15.00, 'USD')
) as v (id, shipment_id, product_id, variant_id, quantity, unit_cost, currency)
where not exists (select 1 from public.shipment_items where id = v.id);

-- WhatsApp orders across the fulfilment pipeline, so the Orders board and the
-- dashboard's pipeline card have something to show. created_by is left null —
-- these predate any real staff account.
insert into public.orders (id, customer_name, customer_phone, delivery_address, maps_url, status, notes, discount, rider_name, rider_phone, packed_at, dispatched_at, delivered_at, created_at)
select * from (values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'Ama Boateng', '+233 24 111 2233', 'East Legon, near A&C Mall', null, 'confirmed', 'Customer wants delivery before the weekend', 0.00, null, null, null, null, null, now() - interval '3 hours'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 'Kwabena Mensah', '+233 20 555 8899', 'Spintex, Coastal Estate gate', null, 'confirmed', 'Agreed GHS 20 off for buying two items', 20.00, null, null, null, null, null, now() - interval '1 hour'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid, 'Efua Sarpong', '+233 27 333 4455', 'Osu, Oxford Street side', null, 'packed', 'Gift wrap the necklace', 0.00, null, null, now() - interval '2 hours', null, null, now() - interval '6 hours'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc04'::uuid, 'Yaw Owusu', '+233 55 777 1212', 'Tema Community 7', 'https://maps.app.goo.gl/example', 'out_for_delivery', 'Call on arrival, gated house', 0.00, 'Kofi (Okada)', '+233 26 909 0909', now() - interval '1 day', now() - interval '4 hours', null, now() - interval '1 day')
) as v (id, customer_name, customer_phone, delivery_address, maps_url, status, notes, discount, rider_name, rider_phone, packed_at, dispatched_at, delivered_at, created_at)
where not exists (select 1 from public.orders where id = v.id);

insert into public.order_items (id, order_id, product_id, variant_id, quantity, unit_price, spec_note)
select * from (values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000102'::uuid, 1, 240.00, 'Floral Maxi Dress, size M'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001001'::uuid, 2, 45.00, 'Ruby shade'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000402'::uuid, 2, 130.00, 'Polo, size L'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd04'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000703'::uuid, 1, 300.00, 'Loafers, size 43'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd05'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000000802'::uuid, 1, 180.00, 'Beige crossbody'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd06'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001400'::uuid, 1, 70.00, null),
  ('dddddddd-dddd-dddd-dddd-dddddddddd07'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc04'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-000000001202'::uuid, 1, 280.00, '100ml bottle')
) as v (id, order_id, product_id, variant_id, quantity, unit_price, spec_note)
where not exists (select 1 from public.order_items where id = v.id);
