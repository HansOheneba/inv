import { createAdminClient } from "@supabase/server/core";
import type { Database } from "@/lib/supabase/types";

/** Service-role client for public storefront catalog routes. */
export function getCatalogClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  return createAdminClient<Database>({
    env: {
      url,
      secretKeys: { default: secretKey },
    },
  });
}
