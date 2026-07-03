import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  verifyCredentials,
  createContextClient,
  createAdminClient,
} from "@supabase/server/core";
import type { AuthModeWithKey, SupabaseContext, SupabaseEnv } from "@supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Composes `@supabase/ssr` (cookie session lifecycle) with `@supabase/server`
 * (JWT verification against the project's JWKS + RLS-scoped/admin client
 * creation). `proxy.ts` refreshes the session cookie on every navigation;
 * this reads that (fresh) cookie and verifies it.
 *
 * See: https://github.com/supabase/server/blob/main/docs/ssr-frameworks.md
 */

function resolveEnvFromProcess(): Partial<SupabaseEnv> {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  return {
    url: url ?? undefined,
    publishableKeys: publishableKey ? { default: publishableKey } : {},
    secretKeys: secretKey ? { default: secretKey } : {},
  };
}

let cachedJwks: SupabaseEnv["jwks"] = null;

async function getJwks(supabaseUrl: string): Promise<SupabaseEnv["jwks"]> {
  if (cachedJwks) return cachedJwks;
  const jwksUrl = process.env.SUPABASE_JWKS_URL || `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
  try {
    const res = await fetch(jwksUrl);
    if (!res.ok) return null;
    cachedJwks = await res.json();
    return cachedJwks;
  } catch {
    return null;
  }
}

/**
 * Cached per-request (React `cache()`) so the handful of data-access calls
 * a single page makes (often in a `Promise.all`) share one JWT verification
 * and one JWKS lookup instead of repeating it for every call.
 */
export const getSupabaseContext = cache(async function getSupabaseContext(
  options: { auth?: AuthModeWithKey | AuthModeWithKey[] } = { auth: "user" },
): Promise<
  { data: SupabaseContext<Database>; error: null } | { data: null; error: Error }
> {
  const env = resolveEnvFromProcess();

  if (!env.url || !env.publishableKeys?.default) {
    return { data: null, error: new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY") };
  }

  // Read the @supabase/ssr session cookie. proxy.ts has already refreshed
  // the access token, so getSession() returns a fresh JWT.
  const cookieStore = await cookies();
  const ssrClient = createServerClient(env.url, env.publishableKeys.default, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
            cookieStore.set(name, value, cookieOptions),
          );
        } catch {
          // Server Components can't write cookies — the proxy handles it.
        }
      },
    },
  });

  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  const token = session?.access_token ?? null;

  const jwks = await getJwks(env.url);
  const envWithJwks: Partial<SupabaseEnv> = { ...env, jwks };

  const { data: auth, error } = await verifyCredentials(
    { token, apikey: null },
    { auth: options.auth ?? "user", env: envWithJwks },
  );

  if (error) {
    return { data: null, error };
  }

  const supabase = createContextClient<Database>({
    auth: { token: auth.token },
    env: envWithJwks,
  });
  const supabaseAdmin = createAdminClient<Database>({ env: envWithJwks });

  return {
    data: {
      supabase,
      supabaseAdmin,
      userClaims: auth.userClaims,
      jwtClaims: auth.jwtClaims,
      authMode: auth.authMode,
    },
    error: null,
  };
});

/**
 * Convenience wrapper for the common case: every authenticated screen wants
 * a valid signed-in user and redirects to /login otherwise.
 */
export async function requireSupabaseContext(): Promise<SupabaseContext<Database>> {
  // Called with no args so every call site shares the same `cache()` entry
  // (the default `{ auth: "user" }` lives inside the wrapped function).
  const result = await getSupabaseContext();
  if (result.error || !result.data.userClaims) {
    redirect("/login");
  }
  return result.data;
}
