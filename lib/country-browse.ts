import { normalizeCountry } from "@/lib/countries";
import { countryPath, countryRegionPath, statePath } from "@/lib/paths";
import { groupPlaceNames, placeSlug, preferredPlaceName } from "@/lib/place-fold";
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
  return placeSlug(store.state);
}

/** Slug for every region name in one country, after the case and accent fold. */
export function regionSlugByName(stores: PlaceStore[], countryCode: string): Map<string, string> {
  const names = stores
    .filter((store) => (store.countryCode || store.country) === countryCode)
    .map((store) => store.state);
  const grouped = groupPlaceNames(names);
  if (countryCode !== "US") return grouped;
  for (const store of stores) {
    if ((store.countryCode || store.country) !== "US" || !store.state.trim()) continue;
    if (store.stateSlug) grouped.set(store.state.trim(), store.stateSlug);
  }
  return grouped;
}

/**
 * Region pages exist when a region has enough shops to be its own list.
 * Smaller regions stay on the country page. US regions link to /directory/{state}.
 */
export function regionLinks(stores: PlaceStore[], country: { code: string; slug: string }): RegionLink[] {
  const grouped = regionSlugByName(stores, country.code);
  const groups = new Map<string, string[]>();
  for (const store of stores) {
    if ((store.countryCode || store.country) !== country.code) continue;
    const name = store.state.trim();
    const slug = grouped.get(name) ?? "";
    if (!slug || !name) continue;
    const names = groups.get(slug) ?? [];
    names.push(name);
    groups.set(slug, names);
  }
  return [...groups.entries()]
    .filter(([, names]) => names.length >= MIN_CITY_STORES)
    .map(([slug, names]) => ({
      name: preferredPlaceName(names),
      slug,
      count: names.length,
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
  const countryCode = store.countryCode || store.country;
  const grouped = regionSlugByName(stores, countryCode);
  const regionSlug = grouped.get(store.state.trim()) || regionSlugFor(store);
  if (!regionSlug || !store.state.trim()) return { country: countryLink, region: null };
  const names = stores
    .filter((item) => (item.countryCode || item.country) === countryCode && grouped.get(item.state.trim()) === regionSlug)
    .map((item) => item.state);
  if (names.length < MIN_CITY_STORES) return { country: countryLink, region: null };
  const href =
    store.country === "US" && (store.stateSlug || getStateBySlug(regionSlug))
      ? statePath(store.stateSlug || regionSlug)
      : countryRegionPath(slug, regionSlug);
  return { country: countryLink, region: { name: preferredPlaceName(names), href } };
}
