import { normalizeCountry } from "@/lib/countries";
import { countryPath, countryRegionPath, statePath } from "@/lib/paths";
import { stableSlug } from "@/lib/slug";
import { MIN_CITY_STORES } from "@/lib/site";
import { getStateBySlug } from "@/lib/states";

export type CountryCount = {
  code: string;
  name: string;
  count: number;
};

export type CountryEntry = CountryCount & { slug: string };

export type RegionLink = {
  name: string;
  slug: string;
  count: number;
  href: string;
};

type PlaceStore = {
  country: string;
  countryName: string;
  countryCode?: string;
  countrySlug?: string;
  state: string;
  stateSlug: string;
  regionSlug?: string;
};

/** How many shops are in each country. The name is the one already on the rows. */
export function countStoresByCountry(stores: { country: string; countryName: string }[]): CountryCount[] {
  const groups = new Map<string, CountryCount>();
  for (const store of stores) {
    const normalized = normalizeCountry(store.country || store.countryName);
    const code = normalized.code || store.country.trim().toUpperCase();
    if (!code) continue;
    const named = store.countryName.trim() || normalized.name;
    const current = groups.get(code);
    if (!current) groups.set(code, { code, name: named, count: 1 });
    else {
      current.count += 1;
      if (!current.name && named) current.name = named;
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}

/** One entry per country. The URL slug is the ISO code, lowercase. */
export function countryEntries(stores: { country: string; countryName: string }[]): CountryEntry[] {
  return countStoresByCountry(stores).map((country) => ({
    ...country,
    name: country.name || country.code,
    slug: country.code.toLowerCase(),
  }));
}

/** URL piece for a shop's region. Blank regions do not get a route. */
export function regionSlugFor(store: PlaceStore): string {
  if (store.regionSlug) return store.regionSlug;
  if (store.country === "US") return store.stateSlug;
  if (!store.state.trim()) return "";
  return stableSlug(store.state);
}

/**
 * Region pages exist when a region has enough shops to be its own list.
 * Smaller regions stay on the country page. US regions link to /directory/{state}.
 */
export function regionLinks(stores: PlaceStore[], country: { code: string; slug: string }): RegionLink[] {
  const groups = new Map<string, { name: string; count: number }>();
  for (const store of stores) {
    if ((store.countryCode || store.country) !== country.code) continue;
    const slug = regionSlugFor(store);
    if (!slug || !store.state.trim()) continue;
    const current = groups.get(slug);
    if (!current) groups.set(slug, { name: store.state, count: 1 });
    else current.count += 1;
  }
  return [...groups.entries()]
    .filter(([, group]) => group.count >= MIN_CITY_STORES)
    .map(([slug, group]) => ({
      name: group.name,
      slug,
      count: group.count,
      href:
        country.code === "US" && getStateBySlug(slug)
          ? statePath(slug)
          : countryRegionPath(country.slug, slug),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}

export type BrowseLink = { name: string; href: string };

/** Country and, when a region page exists, region links for one shop. */
export function countryBrowse(
  store: PlaceStore,
  stores: PlaceStore[],
): { country: BrowseLink | null; region: BrowseLink | null } {
  const normalized = normalizeCountry(store.country || store.countryName);
  const slug = store.countrySlug || normalized.slug;
  if (!slug) return { country: null, region: null };
  const countryLink = {
    name: store.countryName.trim() || normalized.name || store.country,
    href: countryPath(slug),
  };
  const regionSlug = regionSlugFor(store);
  if (!regionSlug || !store.state.trim()) return { country: countryLink, region: null };
  const count = stores.filter(
    (item) => (item.countryCode || item.country) === (store.countryCode || store.country) && regionSlugFor(item) === regionSlug,
  ).length;
  if (count < MIN_CITY_STORES) return { country: countryLink, region: null };
  const href =
    store.country === "US" && store.stateSlug
      ? statePath(store.stateSlug)
      : countryRegionPath(slug, regionSlug);
  return { country: countryLink, region: { name: store.state, href } };
}
