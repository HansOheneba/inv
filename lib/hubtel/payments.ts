import { resolveMomoChannel, toLocalMsisdn } from "@/lib/hubtel/channels";
import { getHubtelConfig, getPaymentCallbackUrl, isHubtelPaymentsConfigured } from "@/lib/hubtel/config";

export interface InitiatePaymentInput {
  clientReference: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  description: string;
}

export interface InitiatePaymentResult {
  clientReference: string;
  transactionId?: string;
  responseCode: string;
  message: string;
  status: "initiated" | "demo";
  demo?: boolean;
}

interface HubtelPaymentResponse {
  ResponseCode?: string;
  Message?: string;
  Data?: {
    TransactionId?: string;
    ClientReference?: string;
  };
}

const ACCEPTED_INIT_CODES = new Set(["0000", "0001"]);

export function createPaymentReference(): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `RK-PAY-${suffix}`;
}

export async function initiateReceiveMoney(
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  if (!isHubtelPaymentsConfigured()) {
    return {
      clientReference: input.clientReference,
      responseCode: "DEMO",
      message: "MoMo prompt skipped — add Hubtel credentials to enable live payments.",
      status: "demo",
      demo: true,
    };
  }

  const config = getHubtelConfig();
  if (!config?.merchantId) {
    return {
      clientReference: input.clientReference,
      responseCode: "DEMO",
      message: "MoMo prompt skipped — HUBTEL_MERCHANT_ID is not set.",
      status: "demo",
      demo: true,
    };
  }

  const url = `https://api.hubtel.com/v1/merchantaccount/merchants/${config.merchantId}/receive/mobilemoney`;
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const payload = {
    CustomerName: input.customerName,
    CustomerMsisdn: toLocalMsisdn(input.customerPhone),
    CustomerEmail: input.customerEmail || "orders@rajkollections.com",
    Channel: resolveMomoChannel(input.customerPhone),
    Amount: input.amount,
    PrimaryCallbackUrl: getPaymentCallbackUrl(),
    Description: input.description,
    ClientReference: input.clientReference,
    FeesOnCustomer: false,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as HubtelPaymentResponse;
  const responseCode = data.ResponseCode ?? "unknown";
  const message = data.Message ?? "Payment request sent";

  if (!ACCEPTED_INIT_CODES.has(responseCode)) {
    console.error("[hubtel:payments] initiate failed:", responseCode, data);
    throw new Error(message || "Could not start MoMo payment");
  }

  return {
    clientReference: input.clientReference,
    transactionId: data.Data?.TransactionId,
    responseCode,
    message,
    status: "initiated",
  };
}
