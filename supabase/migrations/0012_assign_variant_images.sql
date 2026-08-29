-- Move product-level gallery images onto variants (each image belongs to a sellable option).
-- Product image_urls/image_url are then rebuilt from active variant photos.

do $$
declare
  product_row record;
  variant_row record;
  idx integer;
  imgs jsonb;
  missing_count integer;
begin
  for product_row in
    select p.id, p.image_urls
    from public.products p
    where p.external_id is not null
      and jsonb_array_length(coalesce(p.image_urls, '[]'::jsonb)) > 0
  loop
    imgs := product_row.image_urls;

    select count(*) into missing_count
    from public.product_variants v
    where v.product_id = product_row.id
      and v.active
      and (
        v.image_urls is null
        or jsonb_array_length(v.image_urls) = 0
      );

    if missing_count = 0 then
      continue;
    end if;

    if missing_count = 1 then
      update public.product_variants v
      set image_urls = imgs
      where v.product_id = product_row.id
        and v.active
        and (
          v.image_urls is null
          or jsonb_array_length(v.image_urls) = 0
        );
      continue;
    end if;

    idx := 0;
    for variant_row in
      select v.id
      from public.product_variants v
      where v.product_id = product_row.id
        and v.active
        and (
          v.image_urls is null
          or jsonb_array_length(v.image_urls) = 0
        )
      order by v.is_default desc, v.name
    loop
      update public.product_variants
      set image_urls = jsonb_build_array(imgs ->> (idx % jsonb_array_length(imgs)))
      where id = variant_row.id;
      idx := idx + 1;
    end loop;
  end loop;
end $$;

-- Rebuild product gallery from variant photos (default variant first).
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
where p.id = a.product_id;
