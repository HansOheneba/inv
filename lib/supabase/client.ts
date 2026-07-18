"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Browser Supabase client — used *only* for Realtime subscriptions (e.g. the
 * orders fulfilment board). All data reads/writes still happen server-side;
 * this just opens a socket so the UI reacts to changes the instant they land.
 *
 * Realtime needs the URL + publishable key in the browser, so these two are
 * exposed with the NEXT_PUBLIC_ prefix (unlike the server-only keys). The
 * socket authenticates as the signed-in user via the @supabase/ssr session
 * cookie, so RLS still applies.
 */
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;

  client = createBrowserClient<Database>(url, publishableKey);
  return client;
}
