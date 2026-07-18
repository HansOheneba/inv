-- Customer orders — the WhatsApp-intake → Ghana-fulfilment workflow.
-- The owner takes an order (payment already handled off-system) and "locks it
-- in"; the Ghana team then advances it through packing, dispatch (recording
-- which rider carries it), and delivery. Reaching "delivered" is what turns the
-- order into a completed sale and draws down stock, so revenue/insights stay
-- accurate without any second data entry.

-- Human-friendly order numbers (e.g. #1042). A sequence keeps them sequential
-- and readable rather than exposing UUIDs to staff and customers.
create sequence if not exists public.orders_number_seq start 1042;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique default nextval('public.orders_number_seq'),
  customer_name text not null,
  customer_phone text,
  delivery_address text,
  -- Google Maps link the owner pastes in, handed to the rider for delivery.
  maps_url text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled')),
  -- The order specs the owner would previously have re-typed into WhatsApp.
  notes text,
  -- Captured by the Ghana team at dispatch; no rider accounts in the system.
  rider_name text,
  rider_phone text,
  packed_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  -- Per-line variant detail from the WhatsApp chat (colour, size, etc.).
  spec_note text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ============================================================================
-- Grants — mirror 0001_init.sql, which applies this schema via plain SQL.
-- ============================================================================
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant usage, select on sequence public.orders_number_seq to authenticated;

-- ============================================================================
-- Row Level Security — single tenant. Every staff member reads orders and can
-- progress them; only the owner creates or cancels/deletes them (she is the
-- sole order-taker). Same idioms as shipments in 0001_init.sql.
-- ============================================================================
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "orders readable by staff" on public.orders
  for select to authenticated using (true);
create policy "owners create orders" on public.orders
  for insert to authenticated with check (public.is_owner());
create policy "staff can progress orders" on public.orders
  for update to authenticated using (true);
create policy "owners delete orders" on public.orders
  for delete to authenticated using (public.is_owner());

create policy "order items readable by staff" on public.order_items
  for select to authenticated using (true);
create policy "owners manage order items" on public.order_items
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ============================================================================
-- Realtime — the fulfilment board subscribes to order changes so new orders
-- and status updates appear instantly, without polling. RLS still applies:
-- the socket is authenticated as the signed-in staff member.
-- ============================================================================
alter publication supabase_realtime add table public.orders;
