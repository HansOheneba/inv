-- Enrich orders for website checkout fields. WhatsApp / manual rows keep
-- working; website orders carry email, shipping split, payment, and an
-- optional storefront external_id. No public ingest yet — admin + seed only.

alter table public.orders
  add column if not exists source text not null default 'whatsapp'
    check (source in ('whatsapp', 'website', 'manual')),
  add column if not exists customer_email text,
  add column if not exists delivery_city text,
  add column if not exists delivery_region text,
  add column if not exists shipping_fee numeric(12, 2) not null default 0,
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded', 'cod')),
  add column if not exists payment_method text
    check (payment_method is null or payment_method in ('momo', 'card', 'cash', 'bank_transfer')),
  add column if not exists payment_reference text,
  add column if not exists external_id text;

create unique index if not exists orders_external_id_uidx
  on public.orders (external_id)
  where external_id is not null;
