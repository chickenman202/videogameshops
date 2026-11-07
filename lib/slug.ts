/**
 * Lowercase, drop apostrophes, turn everything else into hyphens.
 * "Bob's Games" becomes "bobs-games", not "bob-s-games".
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** Store addresses look like /store/muv-games-austin-tx. */
export function storeSlug(name: string, city: string, stateAbbr: string): string {
  return slugify(`${name}-${city}-${stateAbbr}`);
}

/**
 * A readable slug when the name has no Latin letters, such as a Japanese city.
 * The same text always gets the same slug. Nothing about the shop is invented.
 * This matches the SEO branch so city and region URLs agree.
 */
export function stableSlug(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  if (slug) return slug;
  const trimmed = value.trim();
  if (!trimmed) return "";
  let hash = 2166136261;
  for (const char of trimmed) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `r${(hash >>> 0).toString(36)}`;
}
