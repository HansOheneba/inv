const STOREFRONT_ORIGINS = [
  "https://www.rajkollections.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const allowedOrigin =
    origin && STOREFRONT_ORIGINS.includes(origin) ? origin : STOREFRONT_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function sessionResponseHeaders(refreshedCookie?: string): HeadersInit | undefined {
  return refreshedCookie ? { "Set-Cookie": refreshedCookie } : undefined;
}

export function jsonResponse(
  request: Request,
  body: unknown,
  init?: ResponseInit & { cacheSeconds?: number },
): Response {
  const headers = new Headers(init?.headers);
  const cors = corsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  headers.set("Content-Type", "application/json; charset=utf-8");

  if (init?.cacheSeconds) {
    headers.set("Cache-Control", `public, s-maxage=${init.cacheSeconds}, stale-while-revalidate=300`);
  } else {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function emptyResponse(
  request: Request,
  status = 204,
  extraHeaders?: HeadersInit,
): Response {
  const headers = new Headers(corsHeaders(request));
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value);
    }
  }
  return new Response(null, { status, headers });
}

export function optionsResponse(request: Request): Response {
  return emptyResponse(request);
}

export function errorResponse(
  request: Request,
  message: string,
  status = 400,
): Response {
  return jsonResponse(request, { error: message }, { status });
}
