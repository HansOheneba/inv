const DEFAULT_PORTAL_ORIGIN =
  process.env.PORTAL_ORIGIN ??
  process.env.NEXT_PUBLIC_PORTAL_ORIGIN ??
  "https://portal.rajkollections.com";

/** Origin used to turn `/images/...` paths into absolute catalog asset URLs. */
export function catalogAssetOrigin(request?: Request): string {
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return DEFAULT_PORTAL_ORIGIN.replace(/\/$/, "");
}

export function resolveCatalogImageUrl(path: string, origin: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/$/, "")}${normalized}`;
}

export function resolveCatalogImageUrls(
  urls: string[] | null | undefined,
  origin: string,
): string[] {
  return (urls ?? []).map((url) => resolveCatalogImageUrl(url, origin));
}
