-- Raj Kollections storefront catalog seed (generated from docs/admin-api-contract.json)
-- Safe to re-run: guarded by external_id checks.

-- Ensure the single warehouse exists for variant stock.
insert into public.locations (id, name, type)
select '11111111-1111-1111-1111-111111111101'::uuid, 'Accra Warehouse', 'warehouse'
where not exists (select 1 from public.locations where id = '11111111-1111-1111-1111-111111111101'::uuid);

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '0d30273b-5bc3-4bb3-a5df-7b609b5a7a6e'::uuid, 'dep-pantry', 'pantry', 'Pantry', null, 1, '/images/products/golden-basmati-rice-1.jpg', 'Rice, oils, snacks and everyday cooking goods.'
where not exists (select 1 from public.departments where external_id = 'dep-pantry');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '2b31bc53-2333-4302-acb3-36b3b89fc40a'::uuid, 'dep-pantry-rice', 'rice-grains', 'Rice & grains', '0d30273b-5bc3-4bb3-a5df-7b609b5a7a6e'::uuid, 11, '/images/products/golden-basmati-rice-1.jpg', 'Basmati, jasmine and everyday rice.'
where not exists (select 1 from public.departments where external_id = 'dep-pantry-rice');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '7de95327-6fa1-4984-ad6a-9b64003e2dfd'::uuid, 'dep-pantry-oils', 'oils', 'Oils', '0d30273b-5bc3-4bb3-a5df-7b609b5a7a6e'::uuid, 12, '/images/products/extra-virgin-olive-oil-1.jpg', 'Cooking and finishing oils.'
where not exists (select 1 from public.departments where external_id = 'dep-pantry-oils');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '49f735ba-a8e3-4498-a3a6-c11bcbbfd4fd'::uuid, 'dep-pantry-dairy', 'dairy', 'Dairy', '0d30273b-5bc3-4bb3-a5df-7b609b5a7a6e'::uuid, 13, '/images/products/greek-style-yoghurt-1.jpg', 'Yoghurt, milk powder and tinned milk.'
where not exists (select 1 from public.departments where external_id = 'dep-pantry-dairy');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '244f1056-8ff1-45f7-aa22-854f49d56327'::uuid, 'dep-beauty', 'beauty', 'Beauty', null, 2, '/images/products/velvet-musk-body-mist-1.jpg', 'Body lotions, care sets and dressing-table essentials.'
where not exists (select 1 from public.departments where external_id = 'dep-beauty');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '5d202ab0-96eb-4484-a9ac-89bb65a8a44b'::uuid, 'dep-beauty-body', 'body-mists', 'Body mists', '244f1056-8ff1-45f7-aa22-854f49d56327'::uuid, 21, '/images/products/velvet-musk-body-mist-1.jpg', 'Light body sprays for after lotion.'
where not exists (select 1 from public.departments where external_id = 'dep-beauty-body');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select 'bd53cecb-d699-4fbd-a324-f1b78b01a754'::uuid, 'dep-beauty-scent', 'attar-edt', 'Attar & EDT', '244f1056-8ff1-45f7-aa22-854f49d56327'::uuid, 22, '/images/products/saffron-cedar-attar-oil-1.jpg', 'Perfume oils and eau de toilette.'
where not exists (select 1 from public.departments where external_id = 'dep-beauty-scent');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select 'baac7cda-1dbb-4d09-a869-efced4a49f0e'::uuid, 'dep-fashion', 'fashion', 'Fashion', null, 3, '/images/products/ivory-linen-wrap-dress-1.jpg', 'Bags, dresses and accessories.'
where not exists (select 1 from public.departments where external_id = 'dep-fashion');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select 'b04891c2-6cb6-42bc-a013-4056a828c4d9'::uuid, 'dep-fashion-dresses', 'dresses', 'Dresses', 'baac7cda-1dbb-4d09-a869-efced4a49f0e'::uuid, 31, '/images/products/ivory-linen-wrap-dress-1.jpg', 'Day dresses, wraps and occasion pieces.'
where not exists (select 1 from public.departments where external_id = 'dep-fashion-dresses');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select 'ac0745a8-09ef-497d-a8b7-2bc0e512b3f2'::uuid, 'dep-fashion-bags', 'bags', 'Bags', 'baac7cda-1dbb-4d09-a869-efced4a49f0e'::uuid, 32, '/images/products/structured-shoulder-bag-1.jpg', 'Shoulder bags and everyday carry.'
where not exists (select 1 from public.departments where external_id = 'dep-fashion-bags');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '70020aac-2dcc-439d-ac6f-49bab2f4dd69'::uuid, 'dep-footwear', 'footwear', 'Footwear', null, 4, '/images/products/canvas-court-sneakers-1.jpg', 'Slides, sneakers and branded footwear.'
where not exists (select 1 from public.departments where external_id = 'dep-footwear');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select 'dd67387d-dda1-456f-a262-98981e21cf67'::uuid, 'dep-footwear-sneakers', 'sneakers', 'Sneakers', '70020aac-2dcc-439d-ac6f-49bab2f4dd69'::uuid, 41, '/images/products/canvas-court-sneakers-1.jpg', 'Court and canvas sneakers.'
where not exists (select 1 from public.departments where external_id = 'dep-footwear-sneakers');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '320f3b5d-3caa-4d14-ac70-d6b36e95c739'::uuid, 'dep-footwear-slides', 'slides', 'Slides', '70020aac-2dcc-439d-ac6f-49bab2f4dd69'::uuid, 42, '/images/products/pool-slides-1.jpg', 'Pool slides and moulded sandals.'
where not exists (select 1 from public.departments where external_id = 'dep-footwear-slides');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '0bad1c6f-5628-44d0-a1ba-f547e34659d6'::uuid, 'dep-footwear-loafers', 'loafers', 'Loafers', '70020aac-2dcc-439d-ac6f-49bab2f4dd69'::uuid, 43, '/images/products/leather-loafer-1.jpg', 'Penny loafers and leather flats.'
where not exists (select 1 from public.departments where external_id = 'dep-footwear-loafers');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '338fda17-4045-4790-a5c9-a9af29470171'::uuid, 'dep-fragrance', 'fragrance', 'Fragrance', null, 5, '/images/products/amber-oud-eau-de-parfum-1.jpg', 'Men and women fragrances in boxed retail sizes.'
where not exists (select 1 from public.departments where external_id = 'dep-fragrance');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '9785070b-b592-461b-a11e-af44bf61b9b8'::uuid, 'dep-household', 'household', 'Household', null, 6, '/images/products/woven-storage-basket-1.jpg', 'Home pieces and cleaning essentials for everyday use.'
where not exists (select 1 from public.departments where external_id = 'dep-household');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select 'b3b45a67-10f9-408b-acb8-192349795828'::uuid, 'dep-household-kitchen', 'kitchen', 'Kitchen', '9785070b-b592-461b-a11e-af44bf61b9b8'::uuid, 61, '/images/products/ceramic-serving-bowl-set-1.jpg', 'Bowls, utensils and tea towels.'
where not exists (select 1 from public.departments where external_id = 'dep-household-kitchen');

insert into public.departments (id, external_id, slug, name, parent_id, sort_order, image, description)
select '4b682d90-be5f-440c-a1b4-434e73f6a883'::uuid, 'dep-household-home', 'home-care', 'Home care', '9785070b-b592-461b-a11e-af44bf61b9b8'::uuid, 62, '/images/products/lavender-laundry-soap-bar-1.jpg', 'Storage, laundry and everyday home goods.'
where not exists (select 1 from public.departments where external_id = 'dep-household-home');

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '36e346d3-96ad-4bd2-aa4f-c08d009b07a3'::uuid,
  'p-001',
  'golden-basmati-rice',
  'Golden Basmati Rice',
  '2b31bc53-2333-4302-acb3-36b3b89fc40a'::uuid,
  'Raj pantry',
  'Aged long-grain basmati. Cooks separate and stays fluffy. UK packed. Sold by weight.',
  '["/images/products/golden-basmati-rice-1.jpg","/images/products/golden-basmati-rice-2.jpg","/images/products/golden-basmati-rice-3.jpg"]'::jsonb,
  215,
  true,
  '2026-05-12'::date,
  96,
  '{"Origin":"UK packed"}'::jsonb,
  '{"sale"}'::text[],
  '{"rice","basmati","long grain","white rice","staple","pantry"}'::text[],
  189,
  45,
  0,
  'pcs',
  '/images/products/golden-basmati-rice-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-001');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '1614b5e5-ddbd-462e-ac6e-2de0092fbbaf'::uuid,
  'v-001-1',
  '36e346d3-96ad-4bd2-aa4f-c08d009b07a3'::uuid,
  '1kg',
  'RICE-BAS-1',
  '{"Weight":"1kg"}'::jsonb,
  '["/images/products/golden-basmati-rice-1.jpg"]'::jsonb,
  45,
  45,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-001-1');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '36e346d3-96ad-4bd2-aa4f-c08d009b07a3'::uuid, '1614b5e5-ddbd-462e-ac6e-2de0092fbbaf'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 40
where not exists (
  select 1 from public.inventory_stock where variant_id = '1614b5e5-ddbd-462e-ac6e-2de0092fbbaf'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '8e0faab4-4b93-4cd9-a278-2aa6294beae0'::uuid,
  'v-001-5',
  '36e346d3-96ad-4bd2-aa4f-c08d009b07a3'::uuid,
  '5kg',
  'RICE-BAS-5',
  '{"Weight":"5kg"}'::jsonb,
  '["/images/products/golden-basmati-rice-2.jpg"]'::jsonb,
  189,
  189,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-001-5');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '36e346d3-96ad-4bd2-aa4f-c08d009b07a3'::uuid, '8e0faab4-4b93-4cd9-a278-2aa6294beae0'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 22
where not exists (
  select 1 from public.inventory_stock where variant_id = '8e0faab4-4b93-4cd9-a278-2aa6294beae0'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '84e5a1c2-6b5c-479b-a524-d406bdc26c59'::uuid,
  'v-001-10',
  '36e346d3-96ad-4bd2-aa4f-c08d009b07a3'::uuid,
  '10kg',
  'RICE-BAS-10',
  '{"Weight":"10kg"}'::jsonb,
  '["/images/products/golden-basmati-rice-3.jpg"]'::jsonb,
  349,
  349,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-001-10');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '36e346d3-96ad-4bd2-aa4f-c08d009b07a3'::uuid, '84e5a1c2-6b5c-479b-a524-d406bdc26c59'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 8
where not exists (
  select 1 from public.inventory_stock where variant_id = '84e5a1c2-6b5c-479b-a524-d406bdc26c59'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '5a5ada82-2b59-4802-a61a-75da1f73f299'::uuid,
  'p-002',
  'jasmine-fragrant-rice',
  'Jasmine Fragrant Rice',
  '2b31bc53-2333-4302-acb3-36b3b89fc40a'::uuid,
  'Raj pantry',
  'Soft, floral jasmine rice milled for everyday pots. Packed in the UK.',
  '["/images/products/jasmine-fragrant-rice-1.jpg","/images/products/jasmine-fragrant-rice-2.jpg","/images/products/jasmine-fragrant-rice-3.jpg"]'::jsonb,
  null,
  true,
  '2026-04-02'::date,
  88,
  '{"Origin":"UK packed"}'::jsonb,
  '{}'::text[],
  '{"rice","jasmine","fragrant rice","thai rice","staple","pantry"}'::text[],
  165,
  42,
  0,
  'pcs',
  '/images/products/jasmine-fragrant-rice-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-002');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '52b1e932-e199-4ed5-a3ae-83bad39f7994'::uuid,
  'v-002-1',
  '5a5ada82-2b59-4802-a61a-75da1f73f299'::uuid,
  '1kg',
  'RICE-JAS-1',
  '{"Weight":"1kg"}'::jsonb,
  '["/images/products/jasmine-fragrant-rice-1.jpg"]'::jsonb,
  42,
  42,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-002-1');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '5a5ada82-2b59-4802-a61a-75da1f73f299'::uuid, '52b1e932-e199-4ed5-a3ae-83bad39f7994'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 30
where not exists (
  select 1 from public.inventory_stock where variant_id = '52b1e932-e199-4ed5-a3ae-83bad39f7994'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '8db4065b-b5ea-45e4-a21d-bd2270854799'::uuid,
  'v-002-5',
  '5a5ada82-2b59-4802-a61a-75da1f73f299'::uuid,
  '5kg',
  'RICE-JAS-5',
  '{"Weight":"5kg"}'::jsonb,
  '["/images/products/jasmine-fragrant-rice-2.jpg"]'::jsonb,
  165,
  165,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-002-5');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '5a5ada82-2b59-4802-a61a-75da1f73f299'::uuid, '8db4065b-b5ea-45e4-a21d-bd2270854799'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 18
where not exists (
  select 1 from public.inventory_stock where variant_id = '8db4065b-b5ea-45e4-a21d-bd2270854799'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'f7ef9bc0-85b1-4669-aeaa-ca2ffcfb8fa3'::uuid,
  'p-003',
  'brown-long-grain-rice',
  'Brown Long Grain Rice',
  '2b31bc53-2333-4302-acb3-36b3b89fc40a'::uuid,
  null,
  'Wholegrain rice with the bran left on. Nutty, slower cook.',
  '["/images/products/brown-long-grain-rice-1.jpg","/images/products/brown-long-grain-rice-2.jpg","/images/products/brown-long-grain-rice-3.jpg"]'::jsonb,
  null,
  true,
  '2026-03-18'::date,
  71,
  '{"Weight":"5kg"}'::jsonb,
  '{}'::text[],
  '{"rice","brown rice","wholegrain","whole grain","staple","pantry"}'::text[],
  155,
  155,
  0,
  'pcs',
  '/images/products/brown-long-grain-rice-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-003');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '8106cc0f-0da5-4fb0-a80b-e57830da9142'::uuid,
  'p-003-default',
  'f7ef9bc0-85b1-4669-aeaa-ca2ffcfb8fa3'::uuid,
  'Default',
  'BROWN-LONG-G',
  '{"Weight":"5kg"}'::jsonb,
  '["/images/products/brown-long-grain-rice-1.jpg","/images/products/brown-long-grain-rice-2.jpg","/images/products/brown-long-grain-rice-3.jpg"]'::jsonb,
  155,
  155,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = 'f7ef9bc0-85b1-4669-aeaa-ca2ffcfb8fa3'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'f7ef9bc0-85b1-4669-aeaa-ca2ffcfb8fa3'::uuid, '8106cc0f-0da5-4fb0-a80b-e57830da9142'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '8106cc0f-0da5-4fb0-a80b-e57830da9142'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '0fc80430-ce5f-469c-adbc-f8d00ebee990'::uuid,
  'p-004',
  'extra-virgin-olive-oil',
  'Extra Virgin Olive Oil',
  '7de95327-6fa1-4984-ad6a-9b64003e2dfd'::uuid,
  null,
  'First cold press in dark glass. For finishing, not deep frying.',
  '["/images/products/extra-virgin-olive-oil-1.jpg","/images/products/extra-virgin-olive-oil-2.jpg","/images/products/extra-virgin-olive-oil-3.jpg"]'::jsonb,
  null,
  true,
  '2026-03-11'::date,
  70,
  '{"Origin":"Mediterranean"}'::jsonb,
  '{}'::text[],
  '{"olive oil","extra virgin","cooking oil","salad oil","evoo"}'::text[],
  95,
  55,
  0,
  'pcs',
  '/images/products/extra-virgin-olive-oil-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-004');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '32f884e8-2298-425e-a023-3ac1b90800ac'::uuid,
  'v-004-250',
  '0fc80430-ce5f-469c-adbc-f8d00ebee990'::uuid,
  '250ml',
  'OIL-OLV-250',
  '{"Volume":"250ml"}'::jsonb,
  '["/images/products/extra-virgin-olive-oil-1.jpg"]'::jsonb,
  55,
  55,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-004-250');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '0fc80430-ce5f-469c-adbc-f8d00ebee990'::uuid, '32f884e8-2298-425e-a023-3ac1b90800ac'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 16
where not exists (
  select 1 from public.inventory_stock where variant_id = '32f884e8-2298-425e-a023-3ac1b90800ac'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'e57417dd-d523-4b89-a1b8-bbdd27254e3f'::uuid,
  'v-004-500',
  '0fc80430-ce5f-469c-adbc-f8d00ebee990'::uuid,
  '500ml',
  'OIL-OLV-500',
  '{"Volume":"500ml"}'::jsonb,
  '["/images/products/extra-virgin-olive-oil-2.jpg"]'::jsonb,
  95,
  95,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-004-500');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '0fc80430-ce5f-469c-adbc-f8d00ebee990'::uuid, 'e57417dd-d523-4b89-a1b8-bbdd27254e3f'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 12
where not exists (
  select 1 from public.inventory_stock where variant_id = 'e57417dd-d523-4b89-a1b8-bbdd27254e3f'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '6a9fe91d-f914-4c24-a977-f98a999605ca'::uuid,
  'v-004-1',
  '0fc80430-ce5f-469c-adbc-f8d00ebee990'::uuid,
  '1L',
  'OIL-OLV-1L',
  '{"Volume":"1L"}'::jsonb,
  '["/images/products/extra-virgin-olive-oil-3.jpg"]'::jsonb,
  165,
  165,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-004-1');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '0fc80430-ce5f-469c-adbc-f8d00ebee990'::uuid, '6a9fe91d-f914-4c24-a977-f98a999605ca'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6
where not exists (
  select 1 from public.inventory_stock where variant_id = '6a9fe91d-f914-4c24-a977-f98a999605ca'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '4149b67c-791e-4f1e-ac04-a8ea87ae7c79'::uuid,
  'p-005',
  'coconut-cooking-oil',
  'Coconut Cooking Oil',
  '7de95327-6fa1-4984-ad6a-9b64003e2dfd'::uuid,
  null,
  'Refined coconut oil for high-heat cooking. Neutral taste.',
  '["/images/products/coconut-cooking-oil-1.jpg","/images/products/coconut-cooking-oil-2.jpg","/images/products/coconut-cooking-oil-3.jpg"]'::jsonb,
  null,
  true,
  '2026-02-14'::date,
  66,
  '{"Volume":"500ml"}'::jsonb,
  '{}'::text[],
  '{"coconut oil","cooking oil","frying oil"}'::text[],
  62,
  62,
  0,
  'pcs',
  '/images/products/coconut-cooking-oil-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-005');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '2a64af34-15d6-409d-ab23-45535ac2fdd1'::uuid,
  'p-005-default',
  '4149b67c-791e-4f1e-ac04-a8ea87ae7c79'::uuid,
  'Default',
  'COCONUT-COOK',
  '{"Volume":"500ml"}'::jsonb,
  '["/images/products/coconut-cooking-oil-1.jpg","/images/products/coconut-cooking-oil-2.jpg","/images/products/coconut-cooking-oil-3.jpg"]'::jsonb,
  62,
  62,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '4149b67c-791e-4f1e-ac04-a8ea87ae7c79'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '4149b67c-791e-4f1e-ac04-a8ea87ae7c79'::uuid, '2a64af34-15d6-409d-ab23-45535ac2fdd1'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '2a64af34-15d6-409d-ab23-45535ac2fdd1'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '9b9aa6cc-9d09-41c5-a5df-109acff38b80'::uuid,
  'p-006',
  'cold-pressed-groundnut-oil',
  'Cold Pressed Groundnut Oil',
  '7de95327-6fa1-4984-ad6a-9b64003e2dfd'::uuid,
  null,
  'Peanut oil with a light roast note. For frying and marinades.',
  '["/images/products/cold-pressed-groundnut-oil-1.jpg","/images/products/cold-pressed-groundnut-oil-2.jpg","/images/products/cold-pressed-groundnut-oil-3.jpg"]'::jsonb,
  null,
  true,
  '2026-01-30'::date,
  61,
  '{"Volume":"500ml"}'::jsonb,
  '{}'::text[],
  '{"groundnut oil","peanut oil","cooking oil"}'::text[],
  58,
  58,
  0,
  'pcs',
  '/images/products/cold-pressed-groundnut-oil-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-006');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '8798b810-e4da-42e5-aac6-cca544d72eb5'::uuid,
  'p-006-default',
  '9b9aa6cc-9d09-41c5-a5df-109acff38b80'::uuid,
  'Default',
  'COLD-PRESSED',
  '{"Volume":"500ml"}'::jsonb,
  '["/images/products/cold-pressed-groundnut-oil-1.jpg","/images/products/cold-pressed-groundnut-oil-2.jpg","/images/products/cold-pressed-groundnut-oil-3.jpg"]'::jsonb,
  58,
  58,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '9b9aa6cc-9d09-41c5-a5df-109acff38b80'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '9b9aa6cc-9d09-41c5-a5df-109acff38b80'::uuid, '8798b810-e4da-42e5-aac6-cca544d72eb5'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '8798b810-e4da-42e5-aac6-cca544d72eb5'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'dc8a7bfc-8a36-4e16-a7a4-eab1959ae769'::uuid,
  'p-007',
  'greek-style-yoghurt',
  'Greek Style Yoghurt',
  '49f735ba-a8e3-4498-a3a6-c11bcbbfd4fd'::uuid,
  null,
  'Thick strained yoghurt. Keep chilled after opening.',
  '["/images/products/greek-style-yoghurt-1.jpg","/images/products/greek-style-yoghurt-2.jpg","/images/products/greek-style-yoghurt-3.jpg"]'::jsonb,
  null,
  true,
  '2026-07-08'::date,
  74,
  '{"Pack":"500g"}'::jsonb,
  '{"new"}'::text[],
  '{"yogurt","yoghurt","greek yogurt","dairy"}'::text[],
  28,
  28,
  0,
  'pcs',
  '/images/products/greek-style-yoghurt-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-007');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '5b30c3b1-ea8a-486e-a9ae-a90d3dcbd77b'::uuid,
  'p-007-default',
  'dc8a7bfc-8a36-4e16-a7a4-eab1959ae769'::uuid,
  'Default',
  'GREEK-STYLE-',
  '{"Pack":"500g"}'::jsonb,
  '["/images/products/greek-style-yoghurt-1.jpg","/images/products/greek-style-yoghurt-2.jpg","/images/products/greek-style-yoghurt-3.jpg"]'::jsonb,
  28,
  28,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = 'dc8a7bfc-8a36-4e16-a7a4-eab1959ae769'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'dc8a7bfc-8a36-4e16-a7a4-eab1959ae769'::uuid, '5b30c3b1-ea8a-486e-a9ae-a90d3dcbd77b'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '5b30c3b1-ea8a-486e-a9ae-a90d3dcbd77b'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '25b18b05-ba49-4b1c-a341-82e202247ad0'::uuid,
  'p-008',
  'full-cream-milk-powder',
  'Full Cream Milk Powder',
  '49f735ba-a8e3-4498-a3a6-c11bcbbfd4fd'::uuid,
  null,
  'Whole milk powder for tea, baking and emergency fridge days.',
  '["/images/products/full-cream-milk-powder-1.jpg","/images/products/full-cream-milk-powder-2.jpg","/images/products/full-cream-milk-powder-3.jpg"]'::jsonb,
  null,
  true,
  '2026-04-21'::date,
  68,
  '{"Weight":"900g"}'::jsonb,
  '{}'::text[],
  '{"milk powder","powdered milk","full cream","dairy"}'::text[],
  85,
  85,
  0,
  'pcs',
  '/images/products/full-cream-milk-powder-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-008');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '91c23ea8-e3cc-45bd-ad79-97ca3a939bca'::uuid,
  'p-008-default',
  '25b18b05-ba49-4b1c-a341-82e202247ad0'::uuid,
  'Default',
  'FULL-CREAM-M',
  '{"Weight":"900g"}'::jsonb,
  '["/images/products/full-cream-milk-powder-1.jpg","/images/products/full-cream-milk-powder-2.jpg","/images/products/full-cream-milk-powder-3.jpg"]'::jsonb,
  85,
  85,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '25b18b05-ba49-4b1c-a341-82e202247ad0'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '25b18b05-ba49-4b1c-a341-82e202247ad0'::uuid, '91c23ea8-e3cc-45bd-ad79-97ca3a939bca'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '91c23ea8-e3cc-45bd-ad79-97ca3a939bca'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '4f4e47e6-0755-4d6e-a530-0c0e08324c18'::uuid,
  'p-009',
  'evaporated-milk-six-pack',
  'Evaporated Milk Six Pack',
  '49f735ba-a8e3-4498-a3a6-c11bcbbfd4fd'::uuid,
  null,
  'Shelf-stable evaporated milk. Six tins in a wrap.',
  '["/images/products/evaporated-milk-six-pack-1.jpg","/images/products/evaporated-milk-six-pack-2.jpg","/images/products/evaporated-milk-six-pack-3.jpg"]'::jsonb,
  null,
  true,
  '2026-05-03'::date,
  69,
  '{"Pack":"6 x 410g"}'::jsonb,
  '{}'::text[],
  '{"evaporated milk","tinned milk","canned milk","dairy"}'::text[],
  72,
  72,
  0,
  'pcs',
  '/images/products/evaporated-milk-six-pack-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-009');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '4960bb52-d5c7-4222-a2db-10bbdd4ebf18'::uuid,
  'p-009-default',
  '4f4e47e6-0755-4d6e-a530-0c0e08324c18'::uuid,
  'Default',
  'EVAPORATED-M',
  '{"Pack":"6 x 410g"}'::jsonb,
  '["/images/products/evaporated-milk-six-pack-1.jpg","/images/products/evaporated-milk-six-pack-2.jpg","/images/products/evaporated-milk-six-pack-3.jpg"]'::jsonb,
  72,
  72,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '4f4e47e6-0755-4d6e-a530-0c0e08324c18'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '4f4e47e6-0755-4d6e-a530-0c0e08324c18'::uuid, '4960bb52-d5c7-4222-a2db-10bbdd4ebf18'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '4960bb52-d5c7-4222-a2db-10bbdd4ebf18'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'a3bb290c-1406-415f-a7b5-d3f4ae5df3e6'::uuid,
  'p-010',
  'velvet-musk-body-mist',
  'Velvet Musk Body Mist',
  '5d202ab0-96eb-4484-a9ac-89bb65a8a44b'::uuid,
  null,
  'Light body mist for after lotion. UK retail bottle.',
  '["/images/products/velvet-musk-body-mist-1.jpg","/images/products/velvet-musk-body-mist-2.jpg","/images/products/velvet-musk-body-mist-3.jpg"]'::jsonb,
  null,
  true,
  '2026-06-08'::date,
  77,
  '{"Volume":"200ml"}'::jsonb,
  '{}'::text[],
  '{"body spray","body mist","perfume","fragrance","musk","scent"}'::text[],
  89,
  89,
  0,
  'pcs',
  '/images/products/velvet-musk-body-mist-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-010');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '1c681112-da3a-4b4d-a05e-18b0ced26118'::uuid,
  'p-010-default',
  'a3bb290c-1406-415f-a7b5-d3f4ae5df3e6'::uuid,
  'Default',
  'VELVET-MUSK-',
  '{"Volume":"200ml"}'::jsonb,
  '["/images/products/velvet-musk-body-mist-1.jpg","/images/products/velvet-musk-body-mist-2.jpg","/images/products/velvet-musk-body-mist-3.jpg"]'::jsonb,
  89,
  89,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = 'a3bb290c-1406-415f-a7b5-d3f4ae5df3e6'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'a3bb290c-1406-415f-a7b5-d3f4ae5df3e6'::uuid, '1c681112-da3a-4b4d-a05e-18b0ced26118'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '1c681112-da3a-4b4d-a05e-18b0ced26118'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '82103456-cdcf-4311-aed9-247fba00247c'::uuid,
  'p-011',
  'saffron-cedar-attar-oil',
  'Saffron Cedar Attar Oil',
  'bd53cecb-d699-4fbd-a324-f1b78b01a754'::uuid,
  null,
  'Concentrated perfume oil. Roll on pulse points. Boxed.',
  '["/images/products/saffron-cedar-attar-oil-1.jpg","/images/products/saffron-cedar-attar-oil-2.jpg","/images/products/saffron-cedar-attar-oil-3.jpg"]'::jsonb,
  null,
  true,
  '2026-08-01'::date,
  64,
  '{"Volume":"12ml"}'::jsonb,
  '{"new"}'::text[],
  '{"perfume oil","attar","fragrance","concentrated perfume","oud","scent"}'::text[],
  145,
  145,
  0,
  'pcs',
  '/images/products/saffron-cedar-attar-oil-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-011');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '2299676f-f3fb-414f-a343-357205dc6fcc'::uuid,
  'p-011-default',
  '82103456-cdcf-4311-aed9-247fba00247c'::uuid,
  'Default',
  'SAFFRON-CEDA',
  '{"Volume":"12ml"}'::jsonb,
  '["/images/products/saffron-cedar-attar-oil-1.jpg","/images/products/saffron-cedar-attar-oil-2.jpg","/images/products/saffron-cedar-attar-oil-3.jpg"]'::jsonb,
  145,
  145,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '82103456-cdcf-4311-aed9-247fba00247c'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '82103456-cdcf-4311-aed9-247fba00247c'::uuid, '2299676f-f3fb-414f-a343-357205dc6fcc'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '2299676f-f3fb-414f-a343-357205dc6fcc'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '10fbab3e-5990-4307-a0cc-afcf3b31bbc8'::uuid,
  'p-012',
  'rose-nectar-eau-de-toilette',
  'Rose Nectar Eau de Toilette',
  'bd53cecb-d699-4fbd-a324-f1b78b01a754'::uuid,
  null,
  'Soft rose EDT for daytime. Retail boxed 50ml.',
  '["/images/products/rose-nectar-eau-de-toilette-1.jpg","/images/products/rose-nectar-eau-de-toilette-2.jpg","/images/products/rose-nectar-eau-de-toilette-3.jpg"]'::jsonb,
  null,
  true,
  '2026-06-19'::date,
  63,
  '{"Volume":"50ml"}'::jsonb,
  '{}'::text[],
  '{"perfume","fragrance","edt","eau de toilette","rose perfume","scent"}'::text[],
  210,
  210,
  0,
  'pcs',
  '/images/products/rose-nectar-eau-de-toilette-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-012');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '69910f85-32f2-4a4a-a8c9-664efef15532'::uuid,
  'p-012-default',
  '10fbab3e-5990-4307-a0cc-afcf3b31bbc8'::uuid,
  'Default',
  'ROSE-NECTAR-',
  '{"Volume":"50ml"}'::jsonb,
  '["/images/products/rose-nectar-eau-de-toilette-1.jpg","/images/products/rose-nectar-eau-de-toilette-2.jpg","/images/products/rose-nectar-eau-de-toilette-3.jpg"]'::jsonb,
  210,
  210,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '10fbab3e-5990-4307-a0cc-afcf3b31bbc8'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '10fbab3e-5990-4307-a0cc-afcf3b31bbc8'::uuid, '69910f85-32f2-4a4a-a8c9-664efef15532'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '69910f85-32f2-4a4a-a8c9-664efef15532'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '8fe8e378-7722-4852-a16f-74b3f9095b63'::uuid,
  'p-013',
  'ivory-linen-wrap-dress',
  'Ivory Linen Wrap Dress',
  'b04891c2-6cb6-42bc-a013-4056a828c4d9'::uuid,
  null,
  'Cotton-linen wrap cut for warm weather. UK goods.',
  '["/images/products/ivory-linen-wrap-dress-1.jpg","/images/products/ivory-linen-wrap-dress-2.jpg","/images/products/ivory-linen-wrap-dress-3.jpg"]'::jsonb,
  null,
  true,
  '2026-05-22'::date,
  60,
  '{"Fabric":"Linen"}'::jsonb,
  '{}'::text[],
  '{"dress","wrap dress","linen dress","women clothing","outfit"}'::text[],
  420,
  420,
  0,
  'pcs',
  '/images/products/ivory-linen-wrap-dress-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-013');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '6ae52147-c67f-4a85-a817-a99c4fa1b280'::uuid,
  'v-013-s',
  '8fe8e378-7722-4852-a16f-74b3f9095b63'::uuid,
  'S',
  'DRS-LIN-S',
  '{"Size":"S"}'::jsonb,
  '["/images/products/ivory-linen-wrap-dress-1.jpg"]'::jsonb,
  420,
  420,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-013-s');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '8fe8e378-7722-4852-a16f-74b3f9095b63'::uuid, '6ae52147-c67f-4a85-a817-a99c4fa1b280'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4
where not exists (
  select 1 from public.inventory_stock where variant_id = '6ae52147-c67f-4a85-a817-a99c4fa1b280'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'e1e0133f-930e-43c1-ad15-08f8c621887f'::uuid,
  'v-013-m',
  '8fe8e378-7722-4852-a16f-74b3f9095b63'::uuid,
  'M',
  'DRS-LIN-M',
  '{"Size":"M"}'::jsonb,
  '["/images/products/ivory-linen-wrap-dress-2.jpg"]'::jsonb,
  420,
  420,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-013-m');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '8fe8e378-7722-4852-a16f-74b3f9095b63'::uuid, 'e1e0133f-930e-43c1-ad15-08f8c621887f'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 6
where not exists (
  select 1 from public.inventory_stock where variant_id = 'e1e0133f-930e-43c1-ad15-08f8c621887f'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'f84bbf97-3e75-46f4-a734-0cd18407bb89'::uuid,
  'v-013-l',
  '8fe8e378-7722-4852-a16f-74b3f9095b63'::uuid,
  'L',
  'DRS-LIN-L',
  '{"Size":"L"}'::jsonb,
  '["/images/products/ivory-linen-wrap-dress-3.jpg"]'::jsonb,
  420,
  420,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-013-l');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '8fe8e378-7722-4852-a16f-74b3f9095b63'::uuid, 'f84bbf97-3e75-46f4-a734-0cd18407bb89'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3
where not exists (
  select 1 from public.inventory_stock where variant_id = 'f84bbf97-3e75-46f4-a734-0cd18407bb89'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'c008a0f7-a582-4b4f-aff5-a55d749181de'::uuid,
  'p-014',
  'cotton-poplin-day-dress',
  'Cotton Poplin Day Dress',
  'b04891c2-6cb6-42bc-a013-4056a828c4d9'::uuid,
  null,
  'Crisp poplin day dress. Machine wash cold.',
  '["/images/products/cotton-poplin-day-dress-1.jpg","/images/products/cotton-poplin-day-dress-2.jpg","/images/products/cotton-poplin-day-dress-3.jpg"]'::jsonb,
  null,
  true,
  '2026-04-09'::date,
  57,
  '{"Fabric":"Cotton"}'::jsonb,
  '{}'::text[],
  '{"dress","day dress","cotton dress","women clothing","outfit"}'::text[],
  380,
  380,
  0,
  'pcs',
  '/images/products/cotton-poplin-day-dress-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-014');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'f02c7260-6588-451f-a0d2-a10cf1085372'::uuid,
  'v-014-s',
  'c008a0f7-a582-4b4f-aff5-a55d749181de'::uuid,
  'S',
  'DRS-POP-S',
  '{"Size":"S"}'::jsonb,
  '["/images/products/cotton-poplin-day-dress-1.jpg"]'::jsonb,
  380,
  380,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-014-s');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'c008a0f7-a582-4b4f-aff5-a55d749181de'::uuid, 'f02c7260-6588-451f-a0d2-a10cf1085372'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5
where not exists (
  select 1 from public.inventory_stock where variant_id = 'f02c7260-6588-451f-a0d2-a10cf1085372'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'a0893173-a05c-4e74-af5c-519d807c6dab'::uuid,
  'v-014-m',
  'c008a0f7-a582-4b4f-aff5-a55d749181de'::uuid,
  'M',
  'DRS-POP-M',
  '{"Size":"M"}'::jsonb,
  '["/images/products/cotton-poplin-day-dress-2.jpg"]'::jsonb,
  380,
  380,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-014-m');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'c008a0f7-a582-4b4f-aff5-a55d749181de'::uuid, 'a0893173-a05c-4e74-af5c-519d807c6dab'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5
where not exists (
  select 1 from public.inventory_stock where variant_id = 'a0893173-a05c-4e74-af5c-519d807c6dab'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '9e313435-91a2-4278-ae73-46bb96e4d204'::uuid,
  'v-014-l',
  'c008a0f7-a582-4b4f-aff5-a55d749181de'::uuid,
  'L',
  'DRS-POP-L',
  '{"Size":"L"}'::jsonb,
  '["/images/products/cotton-poplin-day-dress-3.jpg"]'::jsonb,
  380,
  380,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-014-l');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'c008a0f7-a582-4b4f-aff5-a55d749181de'::uuid, '9e313435-91a2-4278-ae73-46bb96e4d204'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2
where not exists (
  select 1 from public.inventory_stock where variant_id = '9e313435-91a2-4278-ae73-46bb96e4d204'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '128272fd-b2f1-4ef6-a48f-527f4f73866c'::uuid,
  'p-015',
  'ankara-print-a-line-dress',
  'Ankara Print A-Line Dress',
  'b04891c2-6cb6-42bc-a013-4056a828c4d9'::uuid,
  null,
  'A-line wax print dress. Pattern placement varies by piece.',
  '["/images/products/ankara-print-a-line-dress-1.jpg","/images/products/ankara-print-a-line-dress-2.jpg","/images/products/ankara-print-a-line-dress-3.jpg"]'::jsonb,
  null,
  true,
  '2026-07-11'::date,
  72,
  '{"Fabric":"Wax print"}'::jsonb,
  '{"new"}'::text[],
  '{"dress","ankara","print dress","women clothing","outfit"}'::text[],
  455,
  455,
  0,
  'pcs',
  '/images/products/ankara-print-a-line-dress-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-015');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '874f264e-a361-492a-a53b-7f4444357fe6'::uuid,
  'v-015-s',
  '128272fd-b2f1-4ef6-a48f-527f4f73866c'::uuid,
  'S',
  'DRS-ANK-S',
  '{"Size":"S"}'::jsonb,
  '["/images/products/ankara-print-a-line-dress-1.jpg"]'::jsonb,
  455,
  455,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-015-s');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '128272fd-b2f1-4ef6-a48f-527f4f73866c'::uuid, '874f264e-a361-492a-a53b-7f4444357fe6'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3
where not exists (
  select 1 from public.inventory_stock where variant_id = '874f264e-a361-492a-a53b-7f4444357fe6'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'f46b7abb-d532-4ea1-aa64-71ad8b11eabf'::uuid,
  'v-015-m',
  '128272fd-b2f1-4ef6-a48f-527f4f73866c'::uuid,
  'M',
  'DRS-ANK-M',
  '{"Size":"M"}'::jsonb,
  '["/images/products/ankara-print-a-line-dress-2.jpg"]'::jsonb,
  455,
  455,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-015-m');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '128272fd-b2f1-4ef6-a48f-527f4f73866c'::uuid, 'f46b7abb-d532-4ea1-aa64-71ad8b11eabf'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4
where not exists (
  select 1 from public.inventory_stock where variant_id = 'f46b7abb-d532-4ea1-aa64-71ad8b11eabf'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '3596d185-9fb9-4a30-a484-cd6624935b10'::uuid,
  'v-015-l',
  '128272fd-b2f1-4ef6-a48f-527f4f73866c'::uuid,
  'L',
  'DRS-ANK-L',
  '{"Size":"L"}'::jsonb,
  '["/images/products/ankara-print-a-line-dress-3.jpg"]'::jsonb,
  455,
  455,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-015-l');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '128272fd-b2f1-4ef6-a48f-527f4f73866c'::uuid, '3596d185-9fb9-4a30-a484-cd6624935b10'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 1
where not exists (
  select 1 from public.inventory_stock where variant_id = '3596d185-9fb9-4a30-a484-cd6624935b10'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '42a0d7c3-71ed-41e6-a2a9-6243ba32d56b'::uuid,
  'p-016',
  'terracotta-midi-shirt-dress',
  'Terracotta Midi Shirt Dress',
  'b04891c2-6cb6-42bc-a013-4056a828c4d9'::uuid,
  null,
  'Midi shirt dress with a belt. USA goods.',
  '["/images/products/terracotta-midi-shirt-dress-1.jpg","/images/products/terracotta-midi-shirt-dress-2.jpg","/images/products/terracotta-midi-shirt-dress-3.jpg"]'::jsonb,
  470,
  true,
  '2026-03-28'::date,
  55,
  '{"Length":"Midi"}'::jsonb,
  '{"sale"}'::text[],
  '{"dress","shirt dress","midi dress","women clothing","outfit"}'::text[],
  399,
  399,
  0,
  'pcs',
  '/images/products/terracotta-midi-shirt-dress-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-016');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'e709b75c-a475-40ca-a3db-fc0895bbf979'::uuid,
  'p-016-default',
  '42a0d7c3-71ed-41e6-a2a9-6243ba32d56b'::uuid,
  'Default',
  'TERRACOTTA-M',
  '{"Length":"Midi"}'::jsonb,
  '["/images/products/terracotta-midi-shirt-dress-1.jpg","/images/products/terracotta-midi-shirt-dress-2.jpg","/images/products/terracotta-midi-shirt-dress-3.jpg"]'::jsonb,
  399,
  399,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '42a0d7c3-71ed-41e6-a2a9-6243ba32d56b'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '42a0d7c3-71ed-41e6-a2a9-6243ba32d56b'::uuid, 'e709b75c-a475-40ca-a3db-fc0895bbf979'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = 'e709b75c-a475-40ca-a3db-fc0895bbf979'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'e43b4dc6-8028-4f1c-ab83-895fff388734'::uuid,
  'p-017',
  'pleated-chiffon-maxi-dress',
  'Pleated Chiffon Maxi Dress',
  'b04891c2-6cb6-42bc-a013-4056a828c4d9'::uuid,
  null,
  'Floaty chiffon maxi. Lined to the knee.',
  '["/images/products/pleated-chiffon-maxi-dress-1.jpg","/images/products/pleated-chiffon-maxi-dress-2.jpg","/images/products/pleated-chiffon-maxi-dress-3.jpg"]'::jsonb,
  null,
  true,
  '2026-05-30'::date,
  59,
  '{"Length":"Maxi"}'::jsonb,
  '{}'::text[],
  '{"dress","maxi dress","chiffon","women clothing","outfit"}'::text[],
  520,
  520,
  0,
  'pcs',
  '/images/products/pleated-chiffon-maxi-dress-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-017');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '99e204ea-c07d-4659-ae25-22683a5bf501'::uuid,
  'p-017-default',
  'e43b4dc6-8028-4f1c-ab83-895fff388734'::uuid,
  'Default',
  'PLEATED-CHIF',
  '{"Length":"Maxi"}'::jsonb,
  '["/images/products/pleated-chiffon-maxi-dress-1.jpg","/images/products/pleated-chiffon-maxi-dress-2.jpg","/images/products/pleated-chiffon-maxi-dress-3.jpg"]'::jsonb,
  520,
  520,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = 'e43b4dc6-8028-4f1c-ab83-895fff388734'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'e43b4dc6-8028-4f1c-ab83-895fff388734'::uuid, '99e204ea-c07d-4659-ae25-22683a5bf501'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '99e204ea-c07d-4659-ae25-22683a5bf501'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'fec996a1-fdad-421d-af01-3dc25d065baf'::uuid,
  'p-018',
  'structured-shoulder-bag',
  'Structured Shoulder Bag',
  'ac0745a8-09ef-497d-a8b7-2bc0e512b3f2'::uuid,
  'UK goods',
  'Black structured shoulder bag. Not affiliated with any high-street house. Check the listing photos.',
  '["/images/products/structured-shoulder-bag-1.jpg","/images/products/structured-shoulder-bag-2.jpg","/images/products/structured-shoulder-bag-3.jpg"]'::jsonb,
  null,
  true,
  '2026-07-28'::date,
  82,
  '{"Material":"Faux leather"}'::jsonb,
  '{}'::text[],
  '{"handbag","purse","shoulder bag","ladies bag"}'::text[],
  399,
  399,
  0,
  'pcs',
  '/images/products/structured-shoulder-bag-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-018');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '9ed4b3bd-ddee-4427-a4fd-3e4cbf8fc33b'::uuid,
  'v-018-blk',
  'fec996a1-fdad-421d-af01-3dc25d065baf'::uuid,
  'Black',
  'BAG-STR-BLK',
  '{"Color":"Black"}'::jsonb,
  '["/images/products/structured-shoulder-bag-1.jpg"]'::jsonb,
  399,
  399,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-018-blk');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'fec996a1-fdad-421d-af01-3dc25d065baf'::uuid, '9ed4b3bd-ddee-4427-a4fd-3e4cbf8fc33b'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 5
where not exists (
  select 1 from public.inventory_stock where variant_id = '9ed4b3bd-ddee-4427-a4fd-3e4cbf8fc33b'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'e0470aea-004a-4ff1-a063-80c244ee690f'::uuid,
  'v-018-tan',
  'fec996a1-fdad-421d-af01-3dc25d065baf'::uuid,
  'Tan',
  'BAG-STR-TAN',
  '{"Color":"Tan"}'::jsonb,
  '["/images/products/structured-shoulder-bag-2.jpg"]'::jsonb,
  399,
  399,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-018-tan');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'fec996a1-fdad-421d-af01-3dc25d065baf'::uuid, 'e0470aea-004a-4ff1-a063-80c244ee690f'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3
where not exists (
  select 1 from public.inventory_stock where variant_id = 'e0470aea-004a-4ff1-a063-80c244ee690f'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'abb86643-e441-4556-a8d6-57469ede0c48'::uuid,
  'p-019',
  'canvas-court-sneakers',
  'Canvas Court Sneakers',
  'dd67387d-dda1-456f-a262-98981e21cf67'::uuid,
  null,
  'Low court sneakers. USA stock. Pick colour and size.',
  '["/images/products/canvas-court-sneakers-1.jpg","/images/products/canvas-court-sneakers-2.jpg","/images/products/canvas-court-sneakers-3.jpg"]'::jsonb,
  null,
  true,
  '2026-08-05'::date,
  80,
  '{"Style":"Low top"}'::jsonb,
  '{"new"}'::text[],
  '{"shoes","trainers","canvas shoes","tennis shoes","kicks","footwear"}'::text[],
  890,
  890,
  0,
  'pcs',
  '/images/products/canvas-court-sneakers-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-019');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'dd54f619-836f-4183-a141-29cbc2a922f6'::uuid,
  'v-019-w40',
  'abb86643-e441-4556-a8d6-57469ede0c48'::uuid,
  'White / 40',
  'SNK-WHT-40',
  '{"Color":"White","Size":"40"}'::jsonb,
  '["/images/products/canvas-court-sneakers-1.jpg"]'::jsonb,
  890,
  890,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-019-w40');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'abb86643-e441-4556-a8d6-57469ede0c48'::uuid, 'dd54f619-836f-4183-a141-29cbc2a922f6'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4
where not exists (
  select 1 from public.inventory_stock where variant_id = 'dd54f619-836f-4183-a141-29cbc2a922f6'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'dcbc2b73-3c0d-4c87-aab5-f402b3a1c037'::uuid,
  'v-019-w41',
  'abb86643-e441-4556-a8d6-57469ede0c48'::uuid,
  'White / 41',
  'SNK-WHT-41',
  '{"Color":"White","Size":"41"}'::jsonb,
  '["/images/products/canvas-court-sneakers-1.jpg"]'::jsonb,
  890,
  890,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-019-w41');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'abb86643-e441-4556-a8d6-57469ede0c48'::uuid, 'dcbc2b73-3c0d-4c87-aab5-f402b3a1c037'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 3
where not exists (
  select 1 from public.inventory_stock where variant_id = 'dcbc2b73-3c0d-4c87-aab5-f402b3a1c037'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '5c6ef4a9-fa51-4141-a42b-5143c1f3a615'::uuid,
  'v-019-w42',
  'abb86643-e441-4556-a8d6-57469ede0c48'::uuid,
  'White / 42',
  'SNK-WHT-42',
  '{"Color":"White","Size":"42"}'::jsonb,
  '["/images/products/canvas-court-sneakers-1.jpg"]'::jsonb,
  890,
  890,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-019-w42');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'abb86643-e441-4556-a8d6-57469ede0c48'::uuid, '5c6ef4a9-fa51-4141-a42b-5143c1f3a615'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0
where not exists (
  select 1 from public.inventory_stock where variant_id = '5c6ef4a9-fa51-4141-a42b-5143c1f3a615'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '2f195dbd-5474-4ef9-af2f-db96c058932c'::uuid,
  'v-019-n40',
  'abb86643-e441-4556-a8d6-57469ede0c48'::uuid,
  'Navy / 40',
  'SNK-NVY-40',
  '{"Color":"Navy","Size":"40"}'::jsonb,
  '["/images/products/canvas-court-sneakers-2.jpg"]'::jsonb,
  890,
  890,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-019-n40');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'abb86643-e441-4556-a8d6-57469ede0c48'::uuid, '2f195dbd-5474-4ef9-af2f-db96c058932c'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2
where not exists (
  select 1 from public.inventory_stock where variant_id = '2f195dbd-5474-4ef9-af2f-db96c058932c'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'e1c56a75-6eae-4592-a210-40309e3dc473'::uuid,
  'v-019-n41',
  'abb86643-e441-4556-a8d6-57469ede0c48'::uuid,
  'Navy / 41',
  'SNK-NVY-41',
  '{"Color":"Navy","Size":"41"}'::jsonb,
  '["/images/products/canvas-court-sneakers-2.jpg"]'::jsonb,
  890,
  890,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-019-n41');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'abb86643-e441-4556-a8d6-57469ede0c48'::uuid, 'e1c56a75-6eae-4592-a210-40309e3dc473'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2
where not exists (
  select 1 from public.inventory_stock where variant_id = 'e1c56a75-6eae-4592-a210-40309e3dc473'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'ddace233-7fa4-41e7-ac57-5fc74e33b1f6'::uuid,
  'v-019-n42',
  'abb86643-e441-4556-a8d6-57469ede0c48'::uuid,
  'Navy / 42',
  'SNK-NVY-42',
  '{"Color":"Navy","Size":"42"}'::jsonb,
  '["/images/products/canvas-court-sneakers-2.jpg"]'::jsonb,
  890,
  890,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-019-n42');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'abb86643-e441-4556-a8d6-57469ede0c48'::uuid, 'ddace233-7fa4-41e7-ac57-5fc74e33b1f6'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 1
where not exists (
  select 1 from public.inventory_stock where variant_id = 'ddace233-7fa4-41e7-ac57-5fc74e33b1f6'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'e7b578a8-bf47-4e3a-a8f1-8a1a9271e07b'::uuid,
  'p-020',
  'pool-slides',
  'Pool Slides',
  '320f3b5d-3caa-4d14-ac70-d6b36e95c739'::uuid,
  null,
  'Moulded footbed slides. Size 40 is waiting on a restock.',
  '["/images/products/pool-slides-1.jpg","/images/products/pool-slides-2.jpg","/images/products/pool-slides-3.jpg"]'::jsonb,
  null,
  true,
  '2026-07-15'::date,
  73,
  '{"Color":"Black"}'::jsonb,
  '{}'::text[],
  '{"slippers","sandals","shoes","pool slides","footwear"}'::text[],
  249,
  249,
  0,
  'pcs',
  '/images/products/pool-slides-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-020');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'fd00e62e-34cb-42f8-a870-d3d52898dc95'::uuid,
  'v-020-38',
  'e7b578a8-bf47-4e3a-a8f1-8a1a9271e07b'::uuid,
  '38',
  'SLD-BLK-38',
  '{"Size":"38"}'::jsonb,
  '["/images/products/pool-slides-1.jpg"]'::jsonb,
  249,
  249,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-020-38');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'e7b578a8-bf47-4e3a-a8f1-8a1a9271e07b'::uuid, 'fd00e62e-34cb-42f8-a870-d3d52898dc95'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 4
where not exists (
  select 1 from public.inventory_stock where variant_id = 'fd00e62e-34cb-42f8-a870-d3d52898dc95'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'feb35762-7f37-418e-aa2e-31692e43aaee'::uuid,
  'v-020-39',
  'e7b578a8-bf47-4e3a-a8f1-8a1a9271e07b'::uuid,
  '39',
  'SLD-BLK-39',
  '{"Size":"39"}'::jsonb,
  '["/images/products/pool-slides-2.jpg"]'::jsonb,
  249,
  249,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-020-39');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'e7b578a8-bf47-4e3a-a8f1-8a1a9271e07b'::uuid, 'feb35762-7f37-418e-aa2e-31692e43aaee'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 2
where not exists (
  select 1 from public.inventory_stock where variant_id = 'feb35762-7f37-418e-aa2e-31692e43aaee'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '4358350e-4cb7-4be9-a71f-0e822ad1d7a1'::uuid,
  'v-020-40',
  'e7b578a8-bf47-4e3a-a8f1-8a1a9271e07b'::uuid,
  '40',
  'SLD-BLK-40',
  '{"Size":"40"}'::jsonb,
  '["/images/products/pool-slides-3.jpg"]'::jsonb,
  249,
  249,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-020-40');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'e7b578a8-bf47-4e3a-a8f1-8a1a9271e07b'::uuid, '4358350e-4cb7-4be9-a71f-0e822ad1d7a1'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0
where not exists (
  select 1 from public.inventory_stock where variant_id = '4358350e-4cb7-4be9-a71f-0e822ad1d7a1'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'cd8ea0f2-cea0-423f-a5e6-bb309ea857fa'::uuid,
  'p-021',
  'leather-loafer',
  'Leather Loafer',
  '0bad1c6f-5628-44d0-a1ba-f547e34659d6'::uuid,
  null,
  'Penny loafer in smooth leather. UK last. Currently sold out.',
  '["/images/products/leather-loafer-1.jpg","/images/products/leather-loafer-2.jpg","/images/products/leather-loafer-3.jpg"]'::jsonb,
  null,
  false,
  '2026-06-30'::date,
  75,
  '{"Color":"Black"}'::jsonb,
  '{}'::text[],
  '{"shoes","penny loafer","formal shoes","leather shoes","footwear"}'::text[],
  1290,
  1290,
  0,
  'pcs',
  '/images/products/leather-loafer-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-021');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '2e501254-d424-4402-a038-3a26c2cb3571'::uuid,
  'v-021-40',
  'cd8ea0f2-cea0-423f-a5e6-bb309ea857fa'::uuid,
  '40',
  'LOF-BLK-40',
  '{"Size":"40"}'::jsonb,
  '["/images/products/leather-loafer-1.jpg"]'::jsonb,
  1290,
  1290,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-021-40');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'cd8ea0f2-cea0-423f-a5e6-bb309ea857fa'::uuid, '2e501254-d424-4402-a038-3a26c2cb3571'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0
where not exists (
  select 1 from public.inventory_stock where variant_id = '2e501254-d424-4402-a038-3a26c2cb3571'::uuid
);

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '7b5d28ef-407b-4f18-a9d8-260004a611df'::uuid,
  'v-021-41',
  'cd8ea0f2-cea0-423f-a5e6-bb309ea857fa'::uuid,
  '41',
  'LOF-BLK-41',
  '{"Size":"41"}'::jsonb,
  '["/images/products/leather-loafer-2.jpg"]'::jsonb,
  1290,
  1290,
  0,
  false,
  true
where not exists (select 1 from public.product_variants where external_id = 'v-021-41');

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'cd8ea0f2-cea0-423f-a5e6-bb309ea857fa'::uuid, '7b5d28ef-407b-4f18-a9d8-260004a611df'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 0
where not exists (
  select 1 from public.inventory_stock where variant_id = '7b5d28ef-407b-4f18-a9d8-260004a611df'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'b6b0f40b-c399-43cd-acc2-847a223bb84a'::uuid,
  'p-022',
  'amber-oud-eau-de-parfum',
  'Amber Oud Eau de Parfum',
  '338fda17-4045-4790-a5c9-a9af29470171'::uuid,
  null,
  'Warm amber and oud. Boxed 100ml. Check the bottle in the photos.',
  '["/images/products/amber-oud-eau-de-parfum-1.jpg","/images/products/amber-oud-eau-de-parfum-2.jpg","/images/products/amber-oud-eau-de-parfum-3.jpg"]'::jsonb,
  null,
  true,
  '2026-07-02'::date,
  79,
  '{"Volume":"100ml"}'::jsonb,
  '{}'::text[],
  '{"perfume","cologne","parfum","oud","mens perfume","fragrance","scent"}'::text[],
  345,
  345,
  0,
  'pcs',
  '/images/products/amber-oud-eau-de-parfum-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-022');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'c87f08fa-d63a-4532-ab85-7a534a2dc39b'::uuid,
  'p-022-default',
  'b6b0f40b-c399-43cd-acc2-847a223bb84a'::uuid,
  'Default',
  'AMBER-OUD-EA',
  '{"Volume":"100ml"}'::jsonb,
  '["/images/products/amber-oud-eau-de-parfum-1.jpg","/images/products/amber-oud-eau-de-parfum-2.jpg","/images/products/amber-oud-eau-de-parfum-3.jpg"]'::jsonb,
  345,
  345,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = 'b6b0f40b-c399-43cd-acc2-847a223bb84a'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'b6b0f40b-c399-43cd-acc2-847a223bb84a'::uuid, 'c87f08fa-d63a-4532-ab85-7a534a2dc39b'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = 'c87f08fa-d63a-4532-ab85-7a534a2dc39b'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '65c275a8-35df-42a1-abc5-f20cabca1ce5'::uuid,
  'p-023',
  'ivory-jasmine-eau-de-parfum',
  'Ivory Jasmine Eau de Parfum',
  '338fda17-4045-4790-a5c9-a9af29470171'::uuid,
  null,
  'White floral jasmine. Retail boxed 100ml.',
  '["/images/products/ivory-jasmine-eau-de-parfum-1.jpg","/images/products/ivory-jasmine-eau-de-parfum-2.jpg","/images/products/ivory-jasmine-eau-de-parfum-3.jpg"]'::jsonb,
  null,
  true,
  '2026-04-18'::date,
  58,
  '{"Volume":"100ml"}'::jsonb,
  '{}'::text[],
  '{"perfume","parfum","womens perfume","jasmine","floral","fragrance","scent"}'::text[],
  345,
  345,
  0,
  'pcs',
  '/images/products/ivory-jasmine-eau-de-parfum-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-023');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '4d9f6b80-8156-45d1-abdc-c4181e571431'::uuid,
  'p-023-default',
  '65c275a8-35df-42a1-abc5-f20cabca1ce5'::uuid,
  'Default',
  'IVORY-JASMIN',
  '{"Volume":"100ml"}'::jsonb,
  '["/images/products/ivory-jasmine-eau-de-parfum-1.jpg","/images/products/ivory-jasmine-eau-de-parfum-2.jpg","/images/products/ivory-jasmine-eau-de-parfum-3.jpg"]'::jsonb,
  345,
  345,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '65c275a8-35df-42a1-abc5-f20cabca1ce5'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '65c275a8-35df-42a1-abc5-f20cabca1ce5'::uuid, '4d9f6b80-8156-45d1-abdc-c4181e571431'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '4d9f6b80-8156-45d1-abdc-c4181e571431'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '9beab148-4a11-447f-a28b-ee21cc8330ee'::uuid,
  'p-024',
  'woven-storage-basket',
  'Woven Storage Basket',
  '4b682d90-be5f-440c-a1b4-434e73f6a883'::uuid,
  null,
  'Open weave basket for market runs and laundry.',
  '["/images/products/woven-storage-basket-1.jpg","/images/products/woven-storage-basket-2.jpg","/images/products/woven-storage-basket-3.jpg"]'::jsonb,
  null,
  true,
  '2026-02-09'::date,
  54,
  '{"Material":"Rattan"}'::jsonb,
  '{}'::text[],
  '{"laundry basket","storage basket","rattan","hamper","basket"}'::text[],
  180,
  180,
  0,
  'pcs',
  '/images/products/woven-storage-basket-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-024');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '6bb47e23-cbb2-4ca5-a912-ca95c81de3a8'::uuid,
  'p-024-default',
  '9beab148-4a11-447f-a28b-ee21cc8330ee'::uuid,
  'Default',
  'WOVEN-STORAG',
  '{"Material":"Rattan"}'::jsonb,
  '["/images/products/woven-storage-basket-1.jpg","/images/products/woven-storage-basket-2.jpg","/images/products/woven-storage-basket-3.jpg"]'::jsonb,
  180,
  180,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '9beab148-4a11-447f-a28b-ee21cc8330ee'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '9beab148-4a11-447f-a28b-ee21cc8330ee'::uuid, '6bb47e23-cbb2-4ca5-a912-ca95c81de3a8'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '6bb47e23-cbb2-4ca5-a912-ca95c81de3a8'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '18e784bc-601a-4751-a6d7-6473b59ca1fa'::uuid,
  'p-025',
  'ceramic-serving-bowl-set',
  'Ceramic Serving Bowl Set',
  'b3b45a67-10f9-408b-acb8-192349795828'::uuid,
  null,
  'Set of stoneware bowls. Dishwasher safe.',
  '["/images/products/ceramic-serving-bowl-set-1.jpg","/images/products/ceramic-serving-bowl-set-2.jpg","/images/products/ceramic-serving-bowl-set-3.jpg"]'::jsonb,
  175,
  true,
  '2026-01-20'::date,
  49,
  '{"Set":"3 pieces"}'::jsonb,
  '{"sale"}'::text[],
  '{"serving bowls","dishes","tableware","stoneware","kitchen"}'::text[],
  145,
  145,
  0,
  'pcs',
  '/images/products/ceramic-serving-bowl-set-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-025');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '73e773ea-0b62-4fab-adba-fcabbedb426f'::uuid,
  'p-025-default',
  '18e784bc-601a-4751-a6d7-6473b59ca1fa'::uuid,
  'Default',
  'CERAMIC-SERV',
  '{"Set":"3 pieces"}'::jsonb,
  '["/images/products/ceramic-serving-bowl-set-1.jpg","/images/products/ceramic-serving-bowl-set-2.jpg","/images/products/ceramic-serving-bowl-set-3.jpg"]'::jsonb,
  145,
  145,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '18e784bc-601a-4751-a6d7-6473b59ca1fa'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '18e784bc-601a-4751-a6d7-6473b59ca1fa'::uuid, '73e773ea-0b62-4fab-adba-fcabbedb426f'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '73e773ea-0b62-4fab-adba-fcabbedb426f'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  'cb6b482c-c695-47f5-ab63-91f0879b1a46'::uuid,
  'p-026',
  'bamboo-kitchen-utensil-set',
  'Bamboo Kitchen Utensil Set',
  'b3b45a67-10f9-408b-acb8-192349795828'::uuid,
  null,
  'Spoon, spatula and ladle in one bundle.',
  '["/images/products/bamboo-kitchen-utensil-set-1.jpg","/images/products/bamboo-kitchen-utensil-set-2.jpg","/images/products/bamboo-kitchen-utensil-set-3.jpg"]'::jsonb,
  null,
  true,
  '2026-02-22'::date,
  52,
  '{"Set":"4 pieces"}'::jsonb,
  '{}'::text[],
  '{"kitchen tools","cooking utensils","spatula","spoon","kitchen"}'::text[],
  95,
  95,
  0,
  'pcs',
  '/images/products/bamboo-kitchen-utensil-set-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-026');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '5e62621f-c2c9-4d60-a361-feb2b31f80a0'::uuid,
  'p-026-default',
  'cb6b482c-c695-47f5-ab63-91f0879b1a46'::uuid,
  'Default',
  'BAMBOO-KITCH',
  '{"Set":"4 pieces"}'::jsonb,
  '["/images/products/bamboo-kitchen-utensil-set-1.jpg","/images/products/bamboo-kitchen-utensil-set-2.jpg","/images/products/bamboo-kitchen-utensil-set-3.jpg"]'::jsonb,
  95,
  95,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = 'cb6b482c-c695-47f5-ab63-91f0879b1a46'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select 'cb6b482c-c695-47f5-ab63-91f0879b1a46'::uuid, '5e62621f-c2c9-4d60-a361-feb2b31f80a0'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '5e62621f-c2c9-4d60-a361-feb2b31f80a0'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '8c75752b-dad7-451a-a1db-88b206c8cc23'::uuid,
  'p-027',
  'linen-tea-towels',
  'Linen Tea Towels',
  'b3b45a67-10f9-408b-acb8-192349795828'::uuid,
  null,
  'Pair of linen towels. Soften after the first wash.',
  '["/images/products/linen-tea-towels-1.jpg","/images/products/linen-tea-towels-2.jpg","/images/products/linen-tea-towels-3.jpg"]'::jsonb,
  null,
  true,
  '2026-03-05'::date,
  48,
  '{"Pack":"2"}'::jsonb,
  '{}'::text[],
  '{"kitchen towels","dish towels","tea towel","linen","kitchen"}'::text[],
  75,
  75,
  0,
  'pcs',
  '/images/products/linen-tea-towels-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-027');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  'da7f3079-07d3-4a7b-acb0-da5169f9f018'::uuid,
  'p-027-default',
  '8c75752b-dad7-451a-a1db-88b206c8cc23'::uuid,
  'Default',
  'LINEN-TEA-TO',
  '{"Pack":"2"}'::jsonb,
  '["/images/products/linen-tea-towels-1.jpg","/images/products/linen-tea-towels-2.jpg","/images/products/linen-tea-towels-3.jpg"]'::jsonb,
  75,
  75,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '8c75752b-dad7-451a-a1db-88b206c8cc23'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '8c75752b-dad7-451a-a1db-88b206c8cc23'::uuid, 'da7f3079-07d3-4a7b-acb0-da5169f9f018'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = 'da7f3079-07d3-4a7b-acb0-da5169f9f018'::uuid
);

insert into public.products (
  id, external_id, slug, name, department_id, brand, description, image_urls,
  compare_at_price, in_stock, catalog_created_at, popularity, attributes, tags, keywords,
  sale_price, cost_price, reorder_point, unit, image_url
)
select
  '816eac7b-e43e-40b1-a9ee-fdb13b245d4e'::uuid,
  'p-028',
  'lavender-laundry-soap-bar',
  'Lavender Laundry Soap Bar',
  '4b682d90-be5f-440c-a1b4-434e73f6a883'::uuid,
  null,
  'Solid laundry soap with lavender. UK goods.',
  '["/images/products/lavender-laundry-soap-bar-1.jpg","/images/products/lavender-laundry-soap-bar-2.jpg","/images/products/lavender-laundry-soap-bar-3.jpg"]'::jsonb,
  null,
  true,
  '2026-06-12'::date,
  50,
  '{"Weight":"200g"}'::jsonb,
  '{}'::text[],
  '{"laundry soap","detergent","washing soap","laundry bar","soap"}'::text[],
  32,
  32,
  0,
  'pcs',
  '/images/products/lavender-laundry-soap-bar-1.jpg'
where not exists (select 1 from public.products where external_id = 'p-028');

insert into public.product_variants (
  id, external_id, product_id, name, sku, attributes, image_urls, cost_price, sale_price, reorder_point, is_default, active
)
select
  '8b5223e3-9de3-4fe0-a1c3-6ee0ac1171ce'::uuid,
  'p-028-default',
  '816eac7b-e43e-40b1-a9ee-fdb13b245d4e'::uuid,
  'Default',
  'LAVENDER-LAU',
  '{"Weight":"200g"}'::jsonb,
  '["/images/products/lavender-laundry-soap-bar-1.jpg","/images/products/lavender-laundry-soap-bar-2.jpg","/images/products/lavender-laundry-soap-bar-3.jpg"]'::jsonb,
  32,
  32,
  0,
  true,
  true
where not exists (
  select 1 from public.product_variants where product_id = '816eac7b-e43e-40b1-a9ee-fdb13b245d4e'::uuid
);

insert into public.inventory_stock (product_id, variant_id, location_id, quantity)
select '816eac7b-e43e-40b1-a9ee-fdb13b245d4e'::uuid, '8b5223e3-9de3-4fe0-a1c3-6ee0ac1171ce'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 10
where not exists (
  select 1 from public.inventory_stock where variant_id = '8b5223e3-9de3-4fe0-a1c3-6ee0ac1171ce'::uuid
);

