# Stockline

A mobile-first inventory and operations tracker for a business that imports goods and sells
through both online and physical stores. Built for fast scanning on the warehouse floor, not for
looking pretty on a desktop dashboard.

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** with a density-first design system (compact rows, tight type scale)
- **shadcn/ui** for every UI primitive — no bespoke buttons/cards/inputs
- **Supabase** (Postgres + Auth + RLS) for the backend, via **`@supabase/ssr`** (cookie session
  lifecycle) composed with **`@supabase/server`** (JWT verification + RLS-scoped/admin clients —
  Supabase's newer publishable/secret key model, no `anon`/`service_role` JWTs)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com/dashboard), then:

1. Open the **SQL Editor** and run `supabase/migrations/0001_init.sql`, followed by
   `supabase/seed.sql`. This creates every table, the `product_stock_overview` view, RLS
   policies, and a handful of sample products/shipments/locations so the app isn't empty.
2. Under **Authentication → Users**, create a login (email + password) for yourself. The
   **first** person who ever signs in automatically becomes the **owner** — everyone created
   after that starts as an **employee** (promote them from the Team screen).
3. Open the **Connect** dialog (or **Project Settings → API**) and copy your **Project URL**,
   **publishable key**, and **secret key**.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Connect dialog / Project Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | Same place — starts with `sb_publishable_` |
| `SUPABASE_SECRET_KEY` | Same place — starts with `sb_secret_`. **Never commit this.** |
| `SUPABASE_JWKS_URL` | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` |

None of these need a `NEXT_PUBLIC_` prefix — every Supabase call in this app happens on the
server (Server Components / Server Actions), never in the browser.

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the account you created in
step 2.

## What's here

| Screen | Route | Notes |
| --- | --- | --- |
| Dashboard | `/` | Stock value (owner-only), sales today, shipments in transit, low/out-of-stock counts, team activity feed |
| Inventory | `/inventory` | The centerpiece — dense, virtualized, searchable list. Tap a row for full detail (stock by location, movement history). Use the kebab menu for quick stock adjustments/transfers. Toggle Compact/Comfortable density top-right |
| Sales | `/sales` | Record a sale (deducts stock automatically) and see recent orders |
| Shipments | `/shipments` | Pipeline view (ordered → in transit → customs → received). Advancing to "received" adds stock into the location you choose |
| Team | `/employees` | Owner-only. Promote/demote roles, deactivate accounts |

Cost prices, shipment freight/customs costs, and margins are only ever sent to the browser for
accounts with the `owner` role — employees see stock levels and sale prices, not what anything
cost to bring in.

## Project structure

```
app/
  (auth)/login/        Public login page
  (app)/                Authenticated shell (top bar + bottom nav) and all screens
components/
  ui/                   shadcn/ui primitives (generated — avoid hand-editing)
  app-shell/            Top bar, bottom nav
  inventory/            The list, row, detail sheet, adjust/transfer dialogs, density toggle
  sales/ shipments/     Screen-specific composed components
lib/
  supabase/
    server.ts            Raw `@supabase/ssr` client — only for sign-in/sign-out (cookie writes)
    proxy.ts              Session-cookie refresh, used by the root proxy.ts
    context.ts            `getSupabaseContext()` / `requireSupabaseContext()` — composes
                           `@supabase/ssr` (reads the session cookie) with `@supabase/server`
                           (verifies the JWT against the project's JWKS, then builds an
                           RLS-scoped `supabase` client and an RLS-bypassing `supabaseAdmin`
                           client). Cached per-request via React `cache()`.
    types.ts               Hand-written `Database` type (see below)
  data/                 Read-only data-access functions (Server Components call these)
  actions/              Server Actions (mutations: sales, stock, shipments, employees, auth)
supabase/
  migrations/0001_init.sql   Full schema + RLS policies
  seed.sql                    Sample locations/suppliers/products/shipments
```

### Regenerating database types

`lib/supabase/types.ts` is hand-written to match the SQL migration. Once your Supabase project is
linked with the CLI, you can regenerate it for a perfect match:

```bash
npx supabase gen types typescript --linked > lib/supabase/types.ts
```

(You'll need to re-add the `NoRelationships` / view typings if you do, or keep the hand-written
version — both work.)

## Design system notes

- Type scale is intentionally tiny: 20px page titles, 15px row titles/values, 12.5px metadata —
  see the `text-page-title` / `text-row-title` / `text-row-value` / `text-meta` / `text-btn`
  Tailwind utilities in `app/globals.css`.
- Row height is driven by CSS variables (`--row-h`, `--row-py`, `--row-px`) that flip between
  Compact (52px, default) and Comfortable (64px) via `[data-density]` on `<html>`. The toggle in
  the inventory header updates this instantly with no reload.
- Status colors (`available` / `low` / `out`) are theme tokens (`bg-status-*`, `text-status-*`),
  not one-off hex values, so they stay consistent across badges everywhere.
