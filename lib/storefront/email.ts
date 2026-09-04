import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

const EMAIL_VERIFICATION_TTL_HOURS = 24;
const EMAIL_RESEND_LIMIT_PER_HOUR = 3;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getResendFromAddress(): string {
  const domain = process.env.RESEND_DOMAIN?.trim();
  if (!domain) {
    throw new Error("RESEND_DOMAIN is not configured.");
  }
  return `Raj Kollections <verify@${domain}>`;
}

function getStorefrontOrigin(): string {
  return (
    process.env.STOREFRONT_URL?.trim() ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() ||
    "https://www.rajkollections.com"
  ).replace(/\/$/, "");
}

export function hashEmailToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateEmailToken(): string {
  return randomBytes(32).toString("base64url");
}

export function emailVerificationExpiresAt(): string {
  return new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseDateOfBirth(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Enter a valid date (YYYY-MM-DD).");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error("Enter a valid date of birth.");
  }

  if (year < 1900) {
    throw new Error("Year must be 1900 or later.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    throw new Error("Date of birth cannot be in the future.");
  }

  return value;
}

export function formatDateOfBirth(value: string | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

export async function sendEmailVerification(input: {
  to: string;
  token: string;
  customerName: string;
}): Promise<{ demo?: boolean }> {
  const verifyUrl = `${getStorefrontOrigin()}/verify-email?token=${encodeURIComponent(input.token)}`;
  const resend = getResendClient();

  if (!resend) {
    console.info(`[email] (demo) verification for ${input.to}: ${verifyUrl}`);
    return { demo: true };
  }

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: input.to,
    subject: "Confirm your email — Raj Kollections",
    html: `
      <p>Hi ${escapeHtml(input.customerName || "there")},</p>
      <p>Confirm your email address to finish updating your Raj Kollections account.</p>
      <p><a href="${verifyUrl}">Confirm email</a></p>
      <p>This link expires in ${EMAIL_VERIFICATION_TTL_HOURS} hours. If you did not request this, you can ignore this email.</p>
    `,
    text: [
      `Hi ${input.customerName || "there"},`,
      "",
      "Confirm your email address to finish updating your Raj Kollections account.",
      "",
      verifyUrl,
      "",
      `This link expires in ${EMAIL_VERIFICATION_TTL_HOURS} hours.`,
    ].join("\n"),
  });

  if (error) {
    console.error("[email] resend failed:", error);
    throw new Error("Could not send confirmation email. Try again in a moment.");
  }

  return {};
}

export function emailResendLimitPerHour(): number {
  return EMAIL_RESEND_LIMIT_PER_HOUR;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
