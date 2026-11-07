import type { CatalogStore } from "@/lib/catalog";
import { countryPath, cityPathFor, regionPathFor, storePath } from "@/lib/paths";

export type PlaceLink = { name: string; slug: string; count: number; href: string };

/** Countries that actually have a published shop, busiest first. */
export function countryLinks(stores: CatalogStore[]): PlaceLink[] {
  const groups = new Map<string, { name: string; count: number }>();
  for (const store of stores) {
    if (!store.countrySlug || !store.countryName) continue;
    const current = groups.get(store.countrySlug);
    if (!current) groups.set(store.countrySlug, { name: store.countryName, count: 1 });
    else current.count += 1;
  }
  return [...groups.entries()]
    .map(([slug, group]) => ({
      name: group.name,
      slug,
      count: group.count,
      href: countryPath(slug),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}

/** Other shops in the same city. Same city name in another country is not included. */
export function relatedInCity(stores: CatalogStore[], store: CatalogStore, limit = 6): CatalogStore[] {
  if (!store.citySlug) return [];
  return stores
    .filter(
      (item) =>
        item.id !== store.id &&
        item.countrySlug === store.countrySlug &&
        item.stateSlug === store.stateSlug &&
        item.citySlug === store.citySlug,
    )
    .slice(0, limit);
}

/** Links from a shop page back up to its city, region, country, and the home page. */
export function storePlaceLinks(store: CatalogStore): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const regionPiece = store.countryCode === "US" ? store.stateSlug : store.regionSlug;
  if (store.city && store.citySlug && regionPiece) {
    links.push({ href: cityPathFor(store), label: `Video game stores in ${store.city}` });
  }
  // A US state page exists with one shop. Pages for other regions exist only
  // when that region has enough shops, so this one-shop helper does not guess.
  if (store.countryCode === "US" && store.state && store.stateSlug) {
    links.push({ href: regionPathFor(store), label: `Video game stores in ${store.state}` });
  }
  if (store.countryName && store.countrySlug) {
    links.push({ href: countryPath(store.countrySlug), label: `Video game stores in ${store.countryName}` });
  }
  links.push({ href: "/directory", label: "All video game stores" }, { href: "/", label: "Home" });
  return links;
}

export function storeHref(store: CatalogStore): string {
  return storePath(store.slug);
}

/** One line address. The country is added outside the United States so cities are not mixed up. */
export function formatAddressLine(store: CatalogStore): string {
  const parts: string[] = [];
  if (store.address) parts.push(store.address);
  if (store.city) parts.push(store.city);
  const region = store.countryCode === "US" ? store.stateAbbr || store.state : store.state;
  if (region && store.zip) parts.push(`${region} ${store.zip}`);
  else if (region) parts.push(region);
  else if (store.zip) parts.push(store.zip);
  if (store.countryName && store.countryCode !== "US") parts.push(store.countryName);
  return parts.join(", ");
}
