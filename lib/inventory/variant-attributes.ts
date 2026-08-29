export interface VariantAttributeFields {
  color: string;
  size: string;
  weight: string;
  volume: string;
}

export function variantFieldsFromAttributes(
  attributes: Record<string, string>,
): VariantAttributeFields {
  return {
    color: attributes.Color ?? "",
    size: attributes.Size ?? "",
    weight: attributes.Weight ?? "",
    volume: attributes.Volume ?? "",
  };
}

export function buildVariantAttributes(
  fields: VariantAttributeFields,
  existing: Record<string, string> = {},
): Record<string, string> {
  const next = { ...existing };

  for (const [key, value] of Object.entries(fields)) {
    const attributeKey =
      key === "color"
        ? "Color"
        : key === "size"
          ? "Size"
          : key === "weight"
            ? "Weight"
            : "Volume";
    const trimmed = value.trim();
    if (trimmed) next[attributeKey] = trimmed;
    else delete next[attributeKey];
  }

  return next;
}

export function variantNameFromAttributes(
  attributes: Record<string, string>,
  fallback = "",
): string {
  if (attributes.Color && attributes.Size) return `${attributes.Color} / ${attributes.Size}`;
  if (attributes.Color) return attributes.Color;
  if (attributes.Size) return attributes.Size;
  if (attributes.Weight) return attributes.Weight;
  if (attributes.Volume) return attributes.Volume;
  if (attributes.Pack) return attributes.Pack;
  return fallback.trim() || "Default";
}

export function variantSummary(attributes: Record<string, string>): string {
  const parts = [
    attributes.Color,
    attributes.Size,
    attributes.Weight,
    attributes.Volume,
    attributes.Pack,
  ].filter(Boolean);
  return parts.join(" · ");
}
