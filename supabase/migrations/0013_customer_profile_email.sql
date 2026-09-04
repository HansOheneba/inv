-- Customer profile: birthday, pending email, and email verification flow.

alter table public.storefront_customers
  add column if not exists date_of_birth date,
  add column if not exists pending_email text;

create unique index if not exists storefront_customers_verified_email_unique
  on public.storefront_customers (lower(email))
  where email is not null;

create table if not exists public.customer_email_verifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.storefront_customers (id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_email_verifications_customer_idx
  on public.customer_email_verifications (customer_id, created_at desc);

create index if not exists customer_email_verifications_active_idx
  on public.customer_email_verifications (token_hash)
  where used_at is null;

create table if not exists public.customer_email_send_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.storefront_customers (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_email_send_log_customer_idx
  on public.customer_email_send_log (customer_id, created_at desc);

create index if not exists customer_email_send_log_email_idx
  on public.customer_email_send_log (lower(email), created_at desc);

alter table public.customer_email_verifications enable row level security;
alter table public.customer_email_send_log enable row level security;

grant select, insert, update, delete on public.customer_email_verifications to service_role;
grant select, insert, update, delete on public.customer_email_send_log to service_role;
