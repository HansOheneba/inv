import { getCatalogClient } from "@/lib/catalog/client";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  SESSION_REFRESH_THRESHOLD_DAYS,
} from "@/lib/storefront/constants";
import { externalId } from "@/lib/storefront/utils";

interface CustomerRow {
  id: string;
  external_id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface SessionRow {
  id: string;
  customer_id: string;
  token: string;
  expires_at: string;
  storefront_customers: CustomerRow | CustomerRow[] | null;
}

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * MS_PER_DAY).toISOString();
}

function shouldRefreshSession(expiresAt: string): boolean {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return remainingMs < SESSION_REFRESH_THRESHOLD_DAYS * MS_PER_DAY;
}

function parseSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export interface StorefrontCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface ResolvedSession {
  customer: StorefrontCustomer;
  customerUuid: string;
  refreshedCookie?: string;
}

export function mapCustomer(row: CustomerRow): StorefrontCustomer {
  const customer: StorefrontCustomer = {
    id: row.external_id,
    name: row.name,
    phone: row.phone,
  };
  if (row.email) customer.email = row.email;
  return customer;
}

export async function createSession(customerId: string): Promise<string> {
  const supabase = getCatalogClient();
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = daysFromNow(SESSION_DAYS);

  const { error } = await supabase.from("customer_sessions").insert({
    customer_id: customerId,
    token,
    expires_at: expiresAt,
  });

  if (error) throw error;
  return token;
}

export async function resolveSessionFromRequest(
  request: Request,
): Promise<ResolvedSession | null> {
  const token = parseSessionToken(request);
  if (!token) return null;

  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("customer_sessions")
    .select("id, customer_id, token, expires_at, storefront_customers(id, external_id, name, phone, email)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as SessionRow;
  const customer = first(row.storefront_customers);
  if (!customer) return null;

  let refreshedCookie: string | undefined;
  if (shouldRefreshSession(row.expires_at)) {
    const { error: updateError } = await supabase
      .from("customer_sessions")
      .update({ expires_at: daysFromNow(SESSION_DAYS) })
      .eq("id", row.id);

    if (!updateError) {
      refreshedCookie = sessionCookieHeader(token);
    }
  }

  return {
    customer: mapCustomer(customer),
    customerUuid: row.customer_id,
    refreshedCookie,
  };
}

export async function resolveCustomerFromRequest(
  request: Request,
): Promise<StorefrontCustomer | null> {
  const session = await resolveSessionFromRequest(request);
  return session?.customer ?? null;
}

export async function resolveCustomerIdFromRequest(request: Request): Promise<string | null> {
  const session = await resolveSessionFromRequest(request);
  return session?.customerUuid ?? null;
}

export function sessionCookieHeader(token: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function upsertCustomerByPhone(input: {
  phone: string;
  name?: string;
  email?: string;
}): Promise<CustomerRow> {
  const supabase = getCatalogClient();
  const { data: existing } = await supabase
    .from("storefront_customers")
    .select("id, external_id, name, phone, email")
    .eq("phone", input.phone)
    .maybeSingle();

  if (existing) {
    if (input.name || input.email) {
      await supabase
        .from("storefront_customers")
        .update({
          name: input.name ?? existing.name,
          email: input.email ?? existing.email,
        })
        .eq("id", existing.id);
    }
    return existing;
  }

  const { data: created, error } = await supabase
    .from("storefront_customers")
    .insert({
      external_id: externalId("cust"),
      name: input.name ?? "",
      phone: input.phone,
      email: input.email ?? null,
    })
    .select("id, external_id, name, phone, email")
    .single();

  if (error || !created) throw error ?? new Error("Could not create customer");
  return created;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const supabase = getCatalogClient();
  await supabase.from("customer_sessions").delete().eq("token", token);
}
