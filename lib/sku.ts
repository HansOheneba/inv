// Suggests short, human-readable SKUs from a product's own details, instead of
// leaving the field blank or making the owner invent a code from scratch. The
// result is only a starting point — it's rendered into an editable input, and
// the database's `unique` constraint on sku is the real guard against
// collisions.

const FILLER_WORDS = new Set(["the", "a", "an", "of", "and", "with", "for", "by"]);

function significantWords(text: string): string[] {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !FILLER_WORDS.has(word.toLowerCase()));
}

function prefixCode(source: string | null | undefined): string {
  const word = source ? significantWords(source)[0] : undefined;
  return (word ?? "GEN").slice(0, 3).toUpperCase();
}

/** A stable 2-digit suffix, generated once per form session to avoid the
 * suggested SKU changing on every keystroke while the owner is still typing
 * the product name. */
export function randomSkuSuffix(): number {
  return Math.floor(10 + Math.random() * 90);
}

export function suggestProductSku(input: {
  name: string;
  category?: string | null;
  brand?: string | null;
  suffix: number;
}): string {
  const nameWord = significantWords(input.name)[0];
  if (!nameWord) return "";
  const category = prefixCode(input.category ?? input.brand);
  const nameCode = nameWord.slice(0, 6).toUpperCase();
  return `${category}-${nameCode}-${input.suffix}`;
}

/** Appends a variant's option label to its product's SKU, e.g.
 * ("WOM-FLORAL-42", "Black / M") -> "WOM-FLORAL-42-BLACK-M". */
export function suggestVariantSku(productSku: string, label: string): string | null {
  if (!productSku) return null;
  const code = significantWords(label).join("-").toUpperCase();
  return code ? `${productSku}-${code}` : productSku;
}
