import { getCatalogClient } from "@/lib/catalog/client";
import { extractClientReference, isHubtelPaymentSuccess } from "@/lib/hubtel/webhook";

export async function POST(request: Request) {
  try {
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return new Response("Invalid payload", { status: 400 });
    }

    const responseCode = String(payload.ResponseCode ?? "");
    const clientReference = extractClientReference(payload);

    console.info("[hubtel:webhook]", JSON.stringify(payload));

    if (!clientReference) {
      return new Response("Missing ClientReference", { status: 400 });
    }

    if (isHubtelPaymentSuccess(responseCode)) {
      const supabase = getCatalogClient();
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("payment_reference", clientReference)
        .eq("payment_status", "unpaid");

      if (error) {
        console.error("[hubtel:webhook] order update failed:", error);
        return new Response("Could not update order", { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[hubtel:webhook]", error);
    return new Response("Error", { status: 500 });
  }
}
