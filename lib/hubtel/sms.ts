import { getHubtelConfig, isHubtelSmsConfigured } from "@/lib/hubtel/config";

const SMS_ENDPOINT = "https://smsc.hubtel.com/v1/messages/send";

export interface SendSmsResult {
  ok: true;
  demo?: boolean;
}

export async function sendSms(input: { to: string; content: string }): Promise<SendSmsResult> {
  if (!isHubtelSmsConfigured()) {
    console.info(`[hubtel:sms] (demo) to ${input.to}: ${input.content}`);
    return { ok: true, demo: true };
  }

  const config = getHubtelConfig();
  if (!config) {
    console.info(`[hubtel:sms] (demo) to ${input.to}: ${input.content}`);
    return { ok: true, demo: true };
  }

  const url = new URL(SMS_ENDPOINT);
  url.searchParams.set("clientid", config.clientId);
  url.searchParams.set("clientsecret", config.clientSecret);
  url.searchParams.set("from", config.smsSenderId);
  url.searchParams.set("to", input.to);
  url.searchParams.set("content", input.content);

  const response = await fetch(url.toString(), { method: "GET" });
  const body = await response.text();

  if (!response.ok) {
    console.error("[hubtel:sms] failed:", response.status, body);
    throw new Error("Could not send verification code. Try again in a moment.");
  }

  return { ok: true };
}
