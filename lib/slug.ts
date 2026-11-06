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
