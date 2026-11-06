import { loadCatalog, type CatalogStore } from "@/lib/catalog";
import { countryBySlug } from "@/lib/countries";
import { countryPath, countryRegionPath, regionPathFor } from "@/lib/paths";

export type CountryRegionLink = {
  name: string;
  slug: string;
  count: number;
  href: string;
};

export type CountryPageData = {
  countryName: string;
  countrySlug: string;
  countryCode: string;
  total: number;
  regions: CountryRegionLink[];
};

export type LoadedCountry =
  | { status: "redirect"; href: string }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ok"; page: CountryPageData };

function regionsFor(stores: CatalogStore[]): CountryRegionLink[] {
  const groups = new Map<string, { name: string; count: number; sample: CatalogStore }>();
  for (const store of stores) {
    const current = groups.get(store.stateSlug);
    if (!current) groups.set(store.stateSlug, { name: store.state, count: 1, sample: store });
    else current.count += 1;
  }
  return [...groups.entries()]
    .map(([slug, group]) => ({
      name: group.name,
      slug,
      count: group.count,
      href: group.sample.countryCode === "US" ? regionPathFor(group.sample) : countryRegionPath(group.sample.countrySlug, slug),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}

/** One country hub. Unknown spellings such as /uk redirect to the one official slug. */
export async function loadCountryPage(slug: string): Promise<LoadedCountry> {
  const known = countryBySlug(slug);
  if (known?.redirectSlug) {
    return { status: "redirect", href: countryPath(known.redirectSlug) };
  }

  const catalog = await loadCatalog();
  if (!catalog.ok) return { status: "error" };

  const countrySlug = known?.country.slug ?? slug;
  const stores = catalog.stores.filter((store) => store.countrySlug === countrySlug);
  if (stores.length === 0) {
    if (!known) return { status: "not-found" };
    return {
      status: "ok",
      page: {
        countryName: known.country.name,
        countrySlug: known.country.slug,
        countryCode: known.country.code,
        total: 0,
        regions: [],
      },
    };
  }

  const sample = stores[0];
  if (!sample) return { status: "not-found" };

  return {
    status: "ok",
    page: {
      countryName: sample.countryName,
      countrySlug: sample.countrySlug,
      countryCode: sample.countryCode,
      total: stores.length,
      regions: regionsFor(stores),
    },
  };
}
