-- Variant-level discounts (fixed amount or percentage off list price) and
-- public Supabase Storage bucket for uploaded product/variant images.

alter table public.product_variants
  add column if not exists compare_at_price numeric(12, 2),
  add column if not exists discount_type text check (discount_type in ('amount', 'percent')),
  add column if not exists discount_value numeric(12, 2);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "owners upload product images" on storage.objects;
create policy "owners upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_owner());

drop policy if exists "owners update product images" on storage.objects;
create policy "owners update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_owner())
  with check (bucket_id = 'product-images' and public.is_owner());

drop policy if exists "owners delete product images" on storage.objects;
create policy "owners delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_owner());
