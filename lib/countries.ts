import { countryPath, countryRegionPath, statePath } from "@/lib/paths";
import { slugify } from "@/lib/slug";
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
  state: string;
  stateSlug: string;
};

/** Turn a country or region name into a URL piece. Accents are folded, not translated. */
export function placeSlug(value: string): string {
  const folded = value.normalize("NFKD").replace(/\p{M}/gu, "");
  return slugify(folded);
}

/** How many shops are in each country. The name is the one already on the rows. */
export function countStoresByCountry(stores: { country: string; countryName: string }[]): CountryCount[] {
  const groups = new Map<string, CountryCount>();
  for (const store of stores) {
    const code = store.country.trim().toUpperCase();
    const named = store.countryName.trim();
    const current = groups.get(code);
    if (!current) {
      groups.set(code, { code, name: named, count: 1 });
    } else {
      current.count += 1;
      if (!current.name && named) current.name = named;
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}

/** One entry per country code, with a stable URL slug taken from the stored name. */
export function countryEntries(stores: { country: string; countryName: string }[]): CountryEntry[] {
  const counts = countStoresByCountry(stores).filter((country) => country.code);
  const bases = counts.map((country) => {
    const base = placeSlug(country.name) || country.code.toLowerCase();
    return base === "page" ? `${base}-${country.code.toLowerCase()}` : base;
  });
  const seen = new Map<string, number>();
  for (const slug of bases) seen.set(slug, (seen.get(slug) ?? 0) + 1);
  return counts.map((country, index) => {
    const base = bases[index] ?? country.code.toLowerCase();
    const slug = (seen.get(base) ?? 0) > 1 ? `${base}-${country.code.toLowerCase()}` : base;
    return { ...country, name: country.name || country.code, slug };
  });
}

export function countryBySlug(
  stores: { country: string; countryName: string }[],
  slug: string,
): CountryEntry | null {
  return countryEntries(stores).find((country) => country.slug === slug) ?? null;
}

/** URL piece for a shop's region. US regions use the existing state slug. */
export function regionSlugFor(store: { country: string; state: string; stateSlug: string }): string {
  if (store.country === "US") return store.stateSlug;
  return placeSlug(store.state);
}

/**
 * Region pages exist when a region has enough shops to be its own list.
 * The cutoff matches city pages. Smaller regions stay on the country page.
 * US regions link to the existing state pages.
 */
export function regionLinks(stores: PlaceStore[], country: CountryEntry): RegionLink[] {
  const groups = new Map<string, { name: string; count: number }>();
  for (const store of stores) {
    if (store.country !== country.code) continue;
    const slug = regionSlugFor(store);
    if (!slug) continue;
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
  const country = countryEntries(stores).find((item) => item.code === store.country);
  if (!country) return { country: null, region: null };
  const countryLink = { name: country.name, href: countryPath(country.slug) };
  const slug = regionSlugFor(store);
  if (!slug || !store.state.trim()) return { country: countryLink, region: null };
  const link = regionLinks(stores, country).find((item) => item.slug === slug);
  if (!link) return { country: countryLink, region: null };
  return { country: countryLink, region: { name: store.state, href: link.href } };
}
