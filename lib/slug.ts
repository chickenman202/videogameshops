/**
 * Lowercase, fold accents, drop apostrophes, turn everything else into hyphens.
 * "Bob's Games" becomes "bobs-games". "Île-de-France" becomes "ile-de-france".
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * A readable slug when the name has no Latin letters, such as a Japanese city.
 * The same text always gets the same slug. Nothing about the shop is invented.
 */
export function stableSlug(value: string): string {
  const slug = slugify(value);
  if (slug) return slug;
  let hash = 2166136261;
  for (const char of value.trim()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `r${(hash >>> 0).toString(36)}`;
}

/**
 * One shop address. The city is always in the slug, so two shops with the
 * same name in different cities do not share a URL.
 * US: /store/muv-games-austin-tx
 * Other countries also include the country code: /store/game-one-paris-ile-de-france-fr
 */
export function storeSlug(name: string, city: string, region: string, countryCode = "US"): string {
  const country = countryCode.toUpperCase();
  const source =
    country === "US" ? `${name}-${city}-${region}` : `${name}-${city}-${region}-${country}`;
  return stableSlug(source);
}
