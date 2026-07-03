export const DENSITY_COOKIE = "density";
export type Density = "compact" | "comfortable";

export function parseDensity(value: string | undefined): Density {
  return value === "comfortable" ? "comfortable" : "compact";
}
