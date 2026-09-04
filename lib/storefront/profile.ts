import { getCatalogClient } from "@/lib/catalog/client";
import {
  emailResendLimitPerHour,
  emailVerificationExpiresAt,
  formatDateOfBirth,
  generateEmailToken,
  hashEmailToken,
  isValidEmail,
  normalizeEmail,
  parseDateOfBirth,
  sendEmailVerification,
} from "@/lib/storefront/email";
import { mapCustomer, type StorefrontCustomer } from "@/lib/storefront/session";

interface CustomerProfileRow {
  id: string;
  external_id: string;
  name: string;
  phone: string;
  email: string | null;
  pending_email: string | null;
  date_of_birth: string | null;
}

const PROFILE_SELECT =
  "id, external_id, name, phone, email, pending_email, date_of_birth";

export interface ProfileUpdateInput {
  dateOfBirth?: string | null;
  email?: string | null;
}

async function getCustomerProfile(customerUuid: string): Promise<CustomerProfileRow> {
  const supabase = getCatalogClient();
  const { data, error } = await supabase
    .from("storefront_customers")
    .select(PROFILE_SELECT)
    .eq("id", customerUuid)
    .single();

  if (error || !data) throw error ?? new Error("Could not load profile.");
  return data as CustomerProfileRow;
}

function mapProfileCustomer(row: CustomerProfileRow): StorefrontCustomer {
  return mapCustomer({
    id: row.id,
    external_id: row.external_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    pending_email: row.pending_email,
    date_of_birth: row.date_of_birth,
  });
}

async function assertVerifiedEmailAvailable(email: string, customerUuid: string): Promise<void> {
  const supabase = getCatalogClient();
  const { data } = await supabase
    .from("storefront_customers")
    .select("id")
    .ilike("email", email)
    .neq("id", customerUuid)
    .maybeSingle();

  if (data) {
    throw new Error("That email is already linked to another account.");
  }
}

async function invalidatePendingVerifications(customerUuid: string): Promise<void> {
  const supabase = getCatalogClient();
  await supabase
    .from("customer_email_verifications")
    .update({ used_at: new Date().toISOString() })
    .eq("customer_id", customerUuid)
    .is("used_at", null);
}

async function assertEmailSendAllowed(customerUuid: string, email: string): Promise<void> {
  const supabase = getCatalogClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const limit = emailResendLimitPerHour();

  const [{ count: customerCount }, { count: emailCount }] = await Promise.all([
    supabase
      .from("customer_email_send_log")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerUuid)
      .gte("created_at", since),
    supabase
      .from("customer_email_send_log")
      .select("id", { count: "exact", head: true })
      .ilike("email", email)
      .gte("created_at", since),
  ]);

  if ((customerCount ?? 0) >= limit || (emailCount ?? 0) >= limit) {
    throw new Error("Too many confirmation emails sent. Try again in an hour.");
  }
}

async function queueEmailVerification(
  customer: CustomerProfileRow,
  email: string,
): Promise<StorefrontCustomer> {
  await assertVerifiedEmailAvailable(email, customer.id);
  await assertEmailSendAllowed(customer.id, email);

  const token = generateEmailToken();
  const tokenHash = hashEmailToken(token);
  const supabase = getCatalogClient();

  await invalidatePendingVerifications(customer.id);

  const { error: verificationError } = await supabase.from("customer_email_verifications").insert({
    customer_id: customer.id,
    email,
    token_hash: tokenHash,
    expires_at: emailVerificationExpiresAt(),
  });

  if (verificationError) throw verificationError;

  const { data: updated, error: updateError } = await supabase
    .from("storefront_customers")
    .update({ pending_email: email })
    .eq("id", customer.id)
    .select(PROFILE_SELECT)
    .single();

  if (updateError || !updated) throw updateError ?? new Error("Could not update profile.");

  await sendEmailVerification({
    to: email,
    token,
    customerName: customer.name,
  });

  await supabase.from("customer_email_send_log").insert({
    customer_id: customer.id,
    email,
  });

  return mapProfileCustomer(updated as CustomerProfileRow);
}

export async function updateCustomerProfile(
  customerUuid: string,
  input: ProfileUpdateInput,
): Promise<StorefrontCustomer> {
  const customer = await getCustomerProfile(customerUuid);
  const updates: {
    date_of_birth?: string | null;
    email?: string | null;
    pending_email?: string | null;
  } = {};

  if (Object.prototype.hasOwnProperty.call(input, "dateOfBirth")) {
    if (input.dateOfBirth === null) {
      updates.date_of_birth = null;
    } else if (input.dateOfBirth !== undefined) {
      updates.date_of_birth = parseDateOfBirth(input.dateOfBirth);
    }
  }

  let emailChanged = false;

  if (Object.prototype.hasOwnProperty.call(input, "email")) {
    if (input.email === null) {
      updates.email = null;
      updates.pending_email = null;
      await invalidatePendingVerifications(customer.id);
    } else if (input.email !== undefined) {
      const email = normalizeEmail(input.email);
      if (!isValidEmail(email)) {
        throw new Error("Enter a valid email address.");
      }

      if (customer.email && customer.email.toLowerCase() === email) {
        updates.pending_email = null;
        await invalidatePendingVerifications(customer.id);
      } else if (customer.pending_email?.toLowerCase() === email) {
        emailChanged = true;
      } else {
        emailChanged = true;
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    const supabase = getCatalogClient();
    const { data, error } = await supabase
      .from("storefront_customers")
      .update(updates)
      .eq("id", customer.id)
      .select(PROFILE_SELECT)
      .single();

    if (error || !data) throw error ?? new Error("Could not update profile.");
  }

  if (emailChanged && input.email) {
    return queueEmailVerification(customer, normalizeEmail(input.email));
  }

  return mapProfileCustomer(await getCustomerProfile(customer.id));
}

export async function resendCustomerEmailVerification(
  customerUuid: string,
): Promise<StorefrontCustomer> {
  const customer = await getCustomerProfile(customerUuid);
  if (!customer.pending_email) {
    throw new Error("No email is waiting for confirmation.");
  }

  return queueEmailVerification(customer, customer.pending_email);
}

export async function verifyCustomerEmail(token: string): Promise<{
  customerUuid: string;
  customer: StorefrontCustomer;
}> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("Confirmation link is invalid.");
  }

  const supabase = getCatalogClient();
  const tokenHash = hashEmailToken(trimmed);

  const { data: verification, error } = await supabase
    .from("customer_email_verifications")
    .select("id, customer_id, email, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !verification) {
    throw new Error("Confirmation link is invalid or has expired.");
  }

  if (verification.used_at) {
    throw new Error("This confirmation link has already been used.");
  }

  if (new Date(verification.expires_at) < new Date()) {
    throw new Error("Confirmation link has expired. Request a new one from your account.");
  }

  const email = normalizeEmail(verification.email);
  await assertVerifiedEmailAvailable(email, verification.customer_id);

  const { data: customer, error: customerError } = await supabase
    .from("storefront_customers")
    .select(PROFILE_SELECT)
    .eq("id", verification.customer_id)
    .single();

  if (customerError || !customer) {
    throw customerError ?? new Error("Could not load profile.");
  }

  const profile = customer as CustomerProfileRow;
  if (profile.pending_email?.toLowerCase() !== email && profile.email?.toLowerCase() !== email) {
    throw new Error("Confirmation link is no longer valid.");
  }

  const now = new Date().toISOString();
  const { error: verifyError } = await supabase
    .from("customer_email_verifications")
    .update({ used_at: now })
    .eq("id", verification.id)
    .is("used_at", null);

  if (verifyError) throw verifyError;

  const { data: updated, error: updateError } = await supabase
    .from("storefront_customers")
    .update({
      email,
      pending_email: null,
    })
    .eq("id", verification.customer_id)
    .select(PROFILE_SELECT)
    .single();

  if (updateError || !updated) {
    throw updateError ?? new Error("Could not confirm email.");
  }

  return {
    customerUuid: verification.customer_id,
    customer: mapProfileCustomer(updated as CustomerProfileRow),
  };
}

export { formatDateOfBirth };
