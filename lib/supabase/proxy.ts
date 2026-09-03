import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PREFIXES = [
  "/login",
  "/auth",
  "/catalog",
  "/customer",
  "/webhooks",
  "/api/catalog",
  "/api/auth",
  "/api/customer",
  "/api/webhooks",
];

function isStorefrontApiRequest(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((path) => pathname.startsWith(path))) {
    return true;
  }

  if (pathname.startsWith("/orders/track") || pathname.startsWith("/api/orders/track")) {
    return true;
  }

  // Admin UI and storefront API both live under /orders — allow JSON/API traffic through.
  if (pathname.startsWith("/orders") || pathname.startsWith("/api/orders")) {
    if (request.method !== "GET") return true;
    const accept = request.headers.get("accept") ?? "";
    return accept.includes("application/json");
  }

  return false;
}

/**
 * Refreshes the Supabase session on every navigation and redirects
 * unauthenticated users to /login. Called from the root proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = isStorefrontApiRequest(request);

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Do not redirect /login → / here. The app verifies JWT + profile in
  // Server Components; bouncing authenticated-but-unready sessions between
  // middleware and the app caused an infinite 307 loop.
  return response;
}
