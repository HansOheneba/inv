-- Storefront API: customer accounts, order snapshots, tracking numbers.

create table if not exists public.storefront_customers (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null default '',
  phone text not null unique,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_auth_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_auth_codes_phone_idx
  on public.customer_auth_codes (phone, created_at desc);

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.storefront_customers (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_sessions_customer_idx
  on public.customer_sessions (customer_id);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  customer_id uuid not null references public.storefront_customers (id) on delete cascade,
  label text not null default 'Home',
  name text not null,
  phone text not null,
  region text not null,
  city text not null,
  line text not null,
  maps_url text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists customer_addresses_customer_idx
  on public.customer_addresses (customer_id);

create table if not exists public.customer_saved_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.storefront_customers (id) on delete cascade,
  product_external_id text not null,
  variant_external_id text,
  snapshot jsonb not null,
  saved_at timestamptz not null default now(),
  unique (customer_id, product_external_id, variant_external_id)
);

create index if not exists customer_saved_items_customer_idx
  on public.customer_saved_items (customer_id, saved_at desc);

-- Order extensions for storefront contract (RK-##### tracking, snapshots).
alter table public.orders
  add column if not exists customer_id uuid references public.storefront_customers (id),
  add column if not exists tracking_number text unique,
  add column if not exists subtotal numeric(12, 2),
  add column if not exists total numeric(12, 2),
  add column if not exists delivery_date date;

alter table public.order_items
  add column if not exists product_external_id text,
  add column if not exists product_slug text,
  add column if not exists product_name text,
  add column if not exists image_url text,
  add column if not exists variant_external_id text,
  add column if not exists line_attributes jsonb not null default '{}'::jsonb;

create or replace function public.set_order_tracking_number()
returns trigger
language plpgsql
as $$
begin
  if new.tracking_number is null and new.order_number is not null then
    new.tracking_number := 'RK-' || new.order_number::text;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_tracking_number on public.orders;
create trigger orders_set_tracking_number
  before insert or update on public.orders
  for each row execute function public.set_order_tracking_number();

-- Backfill tracking numbers for existing orders.
update public.orders
set tracking_number = 'RK-' || order_number::text
where tracking_number is null;

-- Demo tracking order RK-73262 for storefront QA.
insert into public.orders (
  id,
  order_number,
  tracking_number,
  customer_name,
  customer_phone,
  customer_email,
  delivery_address,
  delivery_city,
  delivery_region,
  status,
  source,
  shipping_fee,
  subtotal,
  total,
  payment_status,
  payment_method,
  payment_reference,
  created_at
)
select
  'eeeeeeee-eeee-eeee-eeee-eeeeeeee7326'::uuid,
  73262,
  'RK-73262',
  'Ama Mensah',
  '233241234567',
  'ama@example.com',
  '14 Boundary Road, East Legon',
  'Accra',
  'Greater Accra',
  'packed',
  'website',
  25,
  189,
  214,
  'paid',
  'momo',
  'HUBTEL-DEMO-73262',
  '2026-08-28 10:30:00+00'::timestamptz
where not exists (select 1 from public.orders where order_number = 73262);

insert into public.order_items (
  order_id,
  product_id,
  variant_id,
  quantity,
  unit_price,
  product_external_id,
  product_slug,
  product_name,
  image_url,
  variant_external_id,
  line_attributes
)
select
  o.id,
  p.id,
  v.id,
  1,
  189,
  'p-001',
  'golden-basmati-rice',
  'Golden Basmati Rice',
  '/images/products/golden-basmati-rice-1.jpg',
  'v-001-5',
  '{"Weight":"5kg"}'::jsonb
from public.orders o
join public.products p on p.external_id = 'p-001'
join public.product_variants v on v.external_id = 'v-001-5' and v.product_id = p.id
where o.order_number = 73262
  and not exists (
    select 1 from public.order_items oi where oi.order_id = o.id
  );

select setval(
  'public.orders_number_seq',
  greatest((select coalesce(max(order_number), 1042) from public.orders), 73262)
);

-- RLS: storefront tables managed via service role in API routes.
alter table public.storefront_customers enable row level security;
alter table public.customer_auth_codes enable row level security;
alter table public.customer_sessions enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_saved_items enable row level security;

grant select, insert, update, delete on public.storefront_customers to service_role;
grant select, insert, update, delete on public.customer_auth_codes to service_role;
grant select, insert, update, delete on public.customer_sessions to service_role;
grant select, insert, update, delete on public.customer_addresses to service_role;
grant select, insert, update, delete on public.customer_saved_items to service_role;

-- Public order tracking lookup by tracking number.
grant select on public.orders to anon;
grant select on public.order_items to anon;

create policy "public order tracking by tracking number" on public.orders
  for select to anon using (tracking_number is not null);

create policy "public order items for tracked orders" on public.order_items
  for select to anon using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.tracking_number is not null
    )
  );
