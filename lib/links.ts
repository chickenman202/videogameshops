import type { CatalogStore } from "@/lib/catalog";
import { countryPath, cityPathFor, regionPathFor, storePath } from "@/lib/paths";

export type PlaceLink = { name: string; slug: string; count: number; href: string };

/** Countries that actually have a published shop, busiest first. */
export function countryLinks(stores: CatalogStore[]): PlaceLink[] {
  const groups = new Map<string, { name: string; count: number }>();
  for (const store of stores) {
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
  return [
    { href: cityPathFor(store), label: `Video game stores in ${store.city}` },
    { href: regionPathFor(store), label: `Video game stores in ${store.state}` },
    { href: countryPath(store.countrySlug), label: `Video game stores in ${store.countryName}` },
    { href: "/directory", label: "All video game stores" },
    { href: "/", label: "Home" },
  ];
}

export function storeHref(store: CatalogStore): string {
  return storePath(store.slug);
}

/** One line address. The country is added outside the United States so cities are not mixed up. */
export function formatAddressLine(store: CatalogStore): string {
  const region = store.countryCode === "US" ? store.stateAbbr : store.state;
  const zip = store.zip ? ` ${store.zip}` : "";
  const country = store.countryCode === "US" ? "" : `, ${store.countryName}`;
  return `${store.address}, ${store.city}, ${region}${zip}${country}`;
}
