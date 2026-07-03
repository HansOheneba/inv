import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Raw cookie-session Supabase client (`@supabase/ssr`). This is only for
 * the sign-in/sign-out flows, which need `auth.signInWithPassword()` /
 * `auth.signOut()` to actually write session cookies.
 *
 * Everywhere else (Server Components, Server Actions doing data access)
 * should use `getSupabaseContext()` from `@/lib/supabase/context`, which
 * layers `@supabase/server`'s JWT verification and RLS-scoped client
 * creation on top of this session.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component during render — safe to ignore
          // because the proxy already refreshes the session on navigation.
        }
      },
    },
  });
}
