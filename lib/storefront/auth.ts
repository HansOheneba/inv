import { getCatalogClient } from "@/lib/catalog/client";
import { OTP_EXPIRY_MINUTES } from "@/lib/storefront/constants";
import { sendSms } from "@/lib/hubtel/sms";
import {
  createSession,
  mapCustomer,
  resolveSessionFromRequest,
  sessionCookieHeader,
  upsertCustomerByPhone,
  type StorefrontCustomer,
} from "@/lib/storefront/session";
import { isValidGhanaPhone, normalizePhone } from "@/lib/storefront/utils";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestAuthCode(input: {
  phone: string;
  profile?: { name?: string };
}): Promise<{ ok: true; demoCode?: string }> {
  const phone = normalizePhone(input.phone);
  if (!isValidGhanaPhone(phone)) {
    throw new Error("Enter a valid Ghana phone number");
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const supabase = getCatalogClient();

  await supabase.from("customer_auth_codes").insert({ phone, code, expires_at: expiresAt });

  if (input.profile?.name) {
    await upsertCustomerByPhone({ phone, name: input.profile.name });
  }

  const sms = await sendSms({
    to: phone,
    content: `Your Raj Kollections verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
  });

  // Hubtel not configured — return the code so the storefront can show it (dev/demo).
  if (sms.demo) {
    console.info(`[auth] demo OTP for ${phone}: ${code}`);
    return { ok: true, demoCode: code };
  }

  return { ok: true };
}

export async function verifyAuthCode(input: {
  phone: string;
  code: string;
}): Promise<{
  ok: true;
  needsProfile?: boolean;
  setCookie: string;
  customer?: StorefrontCustomer;
}> {
  const phone = normalizePhone(input.phone);
  const code = input.code.trim();

  if (!isValidGhanaPhone(phone)) {
    throw new Error("Enter a valid Ghana phone number");
  }
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Enter the 6-digit code");
  }

  const supabase = getCatalogClient();
  const { data: otpRow } = await supabase
    .from("customer_auth_codes")
    .select("id, code, expires_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow || otpRow.code !== code || new Date(otpRow.expires_at) < new Date()) {
    throw new Error("Invalid or expired code");
  }

  await supabase.from("customer_auth_codes").delete().eq("id", otpRow.id);

  const customer = await upsertCustomerByPhone({ phone });
  const token = await createSession(customer.id);
  const needsProfile = !customer.name.trim();

  return {
    ok: true,
    needsProfile: needsProfile || undefined,
    setCookie: sessionCookieHeader(token),
    customer: needsProfile ? undefined : mapCustomer(customer),
  };
}

export async function completeCustomerProfile(input: {
  request: Request;
  name: string;
}): Promise<{ customer: StorefrontCustomer; setCookie?: string }> {
  const session = await resolveSessionFromRequest(input.request);
  if (!session) throw new Error("Sign in to complete your profile");

  const name = input.name.trim();
  if (!name) throw new Error("Enter your name");

  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("storefront_customers")
    .update({ name })
    .eq("id", session.customerUuid)
    .select("id, external_id, name, phone, email")
    .single();

  if (error || !data) throw error ?? new Error("Could not update profile");
  return {
    customer: mapCustomer(data),
    setCookie: session.refreshedCookie,
  };
}

export async function logoutCustomer(request: Request): Promise<void> {
  const match = (request.headers.get("cookie") ?? "").match(/rk_customer_session=([^;]+)/);
  const token = match?.[1];
  if (!token) return;

  const supabase = getCatalogClient();
  await supabase.from("customer_sessions").delete().eq("token", token);
}
