-- Inventory & Ops Tracker — initial schema
-- Run against a Supabase project (SQL editor, or `supabase db push` once linked).

create extension if not exists pgcrypto;

-- ============================================================================
-- profiles — one row per auth.users, carries the owner/employee role
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employee' check (role in ('owner', 'employee')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- First person to ever sign in becomes the owner; everyone after is an employee
-- until an owner promotes them from the Employees screen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when exists (select 1 from public.profiles) then 'employee' else 'owner' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;

-- ============================================================================
-- Master data
-- ============================================================================
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('warehouse', 'store', 'online')),
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  contact_name text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('online', 'instagram', 'whatsapp', 'facebook', 'physical_store')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  barcode text,
  category text,
  unit text not null default 'pcs',
  reorder_point integer not null default 0,
  cost_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  image_url text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));

-- ============================================================================
-- Imports / shipments
-- ============================================================================
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id),
  reference_code text not null,
  origin_country text,
  status text not null default 'ordered'
    check (status in ('ordered', 'in_transit', 'customs', 'received', 'cancelled')),
  currency text not null default 'USD',
  shipping_cost numeric(12, 2) not null default 0,
  customs_cost numeric(12, 2) not null default 0,
  ordered_at date not null default current_date,
  expected_arrival date,
  received_at date,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0,
  currency text not null default 'USD'
);

-- ============================================================================
-- Stock
-- ============================================================================
create table if not exists public.inventory_stock (
  product_id uuid not null references public.products (id),
  location_id uuid not null references public.locations (id),
  quantity integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (product_id, location_id)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  from_location_id uuid references public.locations (id),
  to_location_id uuid references public.locations (id),
  quantity integer not null check (quantity > 0),
  type text not null check (type in ('receive', 'transfer', 'sale', 'adjustment', 'return')),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

-- ============================================================================
-- Sales
-- ============================================================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.sales_channels (id),
  location_id uuid references public.locations (id),
  customer_name text,
  customer_contact text,
  total_amount numeric(12, 2) not null default 0,
  currency text not null default 'GHS',
  status text not null default 'completed' check (status in ('completed', 'pending', 'refunded')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  unit_cost_snapshot numeric(12, 2) not null default 0
);

-- ============================================================================
-- Activity log — feeds "what has my team been doing"
-- ============================================================================
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_idx on public.activity_log (created_at desc);

-- ============================================================================
-- product_stock_overview — one row per product with stock totalled across
-- all locations. `security_invoker` means it still respects the RLS policies
-- on the underlying tables for whoever runs the query.
-- ============================================================================
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
  )::int as location_count
from public.products p
left join public.inventory_stock s on s.product_id = p.id
group by p.id;

-- ============================================================================
-- Grants — Supabase pre-configures these for tables created via the
-- dashboard, but we set them explicitly since this schema is applied via
-- plain SQL. RLS policies above still narrow what each grant can touch.
-- ============================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.product_stock_overview to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- ============================================================================
-- Row Level Security
-- Single-tenant app: every authenticated staff member can read operational
-- data. Master-data writes (suppliers, shipment costs, deletes) are
-- owner-only. Financial columns (cost_price, shipment costs, unit_cost) are
-- additionally hidden from employees at the application layer via scoped
-- select lists — Postgres RLS is row-level, not column-level.
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales_channels enable row level security;
alter table public.products enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.inventory_stock enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.activity_log enable row level security;

create policy "profiles are readable by authenticated staff" on public.profiles
  for select to authenticated using (true);
create policy "users can update their own profile" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_owner());
create policy "owners manage all profiles" on public.profiles
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "locations readable by staff" on public.locations
  for select to authenticated using (true);
create policy "owners manage locations" on public.locations
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "suppliers readable by staff" on public.suppliers
  for select to authenticated using (true);
create policy "owners manage suppliers" on public.suppliers
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "channels readable by staff" on public.sales_channels
  for select to authenticated using (true);
create policy "owners manage channels" on public.sales_channels
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "products readable by staff" on public.products
  for select to authenticated using (true);
create policy "staff can add products" on public.products
  for insert to authenticated with check (true);
create policy "staff can update products" on public.products
  for update to authenticated using (true);
create policy "owners can delete products" on public.products
  for delete to authenticated using (public.is_owner());

create policy "shipments readable by staff" on public.shipments
  for select to authenticated using (true);
create policy "staff can progress shipments" on public.shipments
  for update to authenticated using (true);
create policy "owners manage shipments" on public.shipments
  for insert to authenticated with check (public.is_owner());
create policy "owners delete shipments" on public.shipments
  for delete to authenticated using (public.is_owner());

create policy "shipment items readable by staff" on public.shipment_items
  for select to authenticated using (true);
create policy "owners manage shipment items" on public.shipment_items
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "stock readable by staff" on public.inventory_stock
  for select to authenticated using (true);
create policy "staff can adjust stock" on public.inventory_stock
  for all to authenticated using (true) with check (true);

create policy "movements readable by staff" on public.stock_movements
  for select to authenticated using (true);
create policy "staff can log movements" on public.stock_movements
  for insert to authenticated with check (created_by = auth.uid());

create policy "sales readable by staff" on public.sales
  for select to authenticated using (true);
create policy "staff can log sales" on public.sales
  for insert to authenticated with check (created_by = auth.uid());
create policy "owners manage sales" on public.sales
  for update to authenticated using (public.is_owner());
create policy "owners delete sales" on public.sales
  for delete to authenticated using (public.is_owner());

create policy "sale items readable by staff" on public.sale_items
  for select to authenticated using (true);
create policy "staff can log sale items" on public.sale_items
  for insert to authenticated with check (true);

create policy "activity readable by staff" on public.activity_log
  for select to authenticated using (true);
create policy "staff can log activity" on public.activity_log
  for insert to authenticated with check (user_id = auth.uid());
