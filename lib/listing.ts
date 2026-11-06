import type { CatalogStore } from "@/lib/catalog";
import { loadCatalog } from "@/lib/catalog";
import { countryBySlug, regionLinks, regionSlugFor } from "@/lib/countries";
import { joinList, toMetaDescription, toTitle } from "@/lib/copy";
import {
  emptyFilters,
  filtersFromRecord,
  hasFilters,
  recordHasFilters,
  type Filters,
} from "@/lib/filters";
import { formatStorePlace } from "@/lib/place";
import { isUsableAbout } from "@/lib/publish";
import {
  cityPath,
  countriesPath,
  countryPath,
  countryRegionPath,
  pagePath,
  platformCityPath,
  platformPath,
  statePath,
  storePath,
} from "@/lib/paths";
import { getPlatformBySlug, platformHeading, PLATFORMS, type PlatformLabel } from "@/lib/platforms";
import { MIN_CITY_STORES, MIN_PLATFORM_CITY_STORES, PAGE_SIZE } from "@/lib/site";
import { getStateBySlug, type UsState } from "@/lib/states";

export type Crumb = { name: string; href?: string };

export type CityLink = { name: string; slug: string; count: number; href: string };

export type PlatformLink = { label: PlatformLabel; slug: string; count: number; href: string };

export type ListingOk = {
  status: "ok";
  page: number;
  pageCount: number;
  total: number;
  stores: CatalogStore[];
  basePath: string;
  canonicalPath: string;
  indexable: boolean;
  filtered: boolean;
  h1: string;
  title: string;
  description: string;
  intro: string;
  crumbs: Crumb[];
  state: UsState | null;
  cityName: string | null;
  citySlug: string | null;
  platformLabel: PlatformLabel | null;
  platformSlug: string | null;
  cities: CityLink[];
  platformLinks: PlatformLink[];
  filters: Filters;
};

export type ListingResult = ListingOk | { status: "error" } | { status: "not-found" };

function applyUserFilters(stores: CatalogStore[], filters: Filters): CatalogStore[] {
  const query = filters.q.toLowerCase();
  return stores.filter((store) => {
    if (filters.sellsNew && !store.sellsNew) return false;
    if (filters.sellsUsed && !store.sellsUsed) return false;
    if (filters.tradeIns && !store.tradeIns) return false;
    if (filters.repairs && !store.repairs) return false;
    if (filters.platform && !store.platforms.includes(filters.platform)) return false;
    if (!query) return true;
    return (
      store.name.toLowerCase().includes(query) ||
      store.city.toLowerCase().includes(query) ||
      store.state.toLowerCase().includes(query) ||
      store.country.toLowerCase().includes(query) ||
      store.countryName.toLowerCase().includes(query) ||
      (store.brand ?? "").toLowerCase().includes(query)
    );
  });
}

function cityGroups(stores: CatalogStore[], state: UsState): CityLink[] {
  const groups = new Map<string, { name: string; count: number }>();
  for (const store of stores) {
    const current = groups.get(store.citySlug);
    if (!current) groups.set(store.citySlug, { name: store.city, count: 1 });
    else current.count += 1;
  }
  return [...groups.entries()]
    .map(([slug, group]) => ({
      name: group.name,
      slug,
      count: group.count,
      href: cityPath(state.slug, slug),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}

function platformGroups(stores: CatalogStore[], hrefFor: (slug: string) => string): PlatformLink[] {
  return PLATFORMS.map((platform) => {
    const count = stores.filter((store) => store.platforms.includes(platform.label)).length;
    return {
      label: platform.label,
      slug: platform.slug,
      count,
      href: hrefFor(platform.slug),
    };
  }).filter((platform) => platform.count >= MIN_PLATFORM_CITY_STORES);
}

function nounFor(platformLabel: PlatformLabel | null): string {
  if (!platformLabel) return "video game stores";
  if (platformLabel === "Retro") return "retro game stores";
  if (platformLabel === "VR") return "VR game stores";
  return `${platformLabel} game stores`;
}

function leadSentence(total: number, noun: string, place: string | null): string {
  const count = total.toLocaleString("en-US");
  const label = total === 1 ? noun.replace(/stores$/, "store") : noun;
  return place ? `${count} ${label} in ${place}.` : `${count} ${label}.`;
}

export function storeAbout(store: CatalogStore): string {
  if (isUsableAbout(store.about)) return store.about?.trim() ?? "";
  const facts: string[] = [];
  if (store.sellsNew) facts.push("new games");
  if (store.sellsUsed) facts.push("used games");
  if (store.tradeIns) facts.push("trade-ins");
  if (store.repairs) facts.push("console repair");
  const offer = facts.length ? `It offers ${joinList(facts)}.` : "";
  const platforms = store.platforms.length ? ` Platforms: ${joinList(store.platforms)}.` : "";
  const place = formatStorePlace(store);
  const where = place ? ` at ${place}` : "";
  return `${store.name} is a video game store${where}. ${offer}${platforms}`.replace(/\s+/g, " ").trim();
}

export async function buildListing(input: {
  page: number;
  stateSlug?: string;
  citySlug?: string;
  platformSlug?: string;
  countrySlug?: string;
  regionSlug?: string;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<ListingResult> {
  let page = input.page;
  if (page <= 1 && input.searchParams && recordHasFilters(input.searchParams)) {
    const raw = input.searchParams.page;
    const text = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
    if (/^[1-9]\d*$/.test(text)) page = Number(text);
  }
  if (!Number.isInteger(page) || page < 1) return { status: "not-found" };

  const state = input.stateSlug ? getStateBySlug(input.stateSlug) : null;
  if (input.stateSlug && !state) return { status: "not-found" };

  const platform = input.platformSlug ? getPlatformBySlug(input.platformSlug) : null;
  if (input.platformSlug && !platform) return { status: "not-found" };

  const catalog = await loadCatalog();
  if (!catalog.ok) return { status: "error" };

  const country = input.countrySlug ? countryBySlug(catalog.stores, input.countrySlug) : null;
  if (input.countrySlug && !country) return { status: "not-found" };
  // US regions already have state pages. Those URLs redirect before this runs.
  if (country?.code === "US" && input.regionSlug) return { status: "not-found" };

  const filters = input.searchParams ? filtersFromRecord(input.searchParams) : emptyFilters();
  const filtered =
    (input.searchParams ? recordHasFilters(input.searchParams) : false) || hasFilters(filters);

  // The path platform is the page itself. A ?platform= query is an extra filter.
  if (platform) filters.platform = null;

  let pool = catalog.stores;
  if (state) pool = pool.filter((store) => store.stateSlug === state.slug);
  if (country) pool = pool.filter((store) => store.country === country.code);

  let cityName: string | null = null;
  if (input.citySlug) {
    const inCity = pool.filter((store) => store.citySlug === input.citySlug);
    if (inCity.length === 0) return { status: "not-found" };
    cityName = inCity[0]?.city ?? null;
    pool = inCity;
  }

  let regionName: string | null = null;
  if (country && input.regionSlug) {
    const inRegion = pool.filter((store) => regionSlugFor(store) === input.regionSlug);
    if (inRegion.length < MIN_CITY_STORES) return { status: "not-found" };
    regionName = inRegion[0]?.state ?? input.regionSlug;
    pool = inRegion;
  }

  const cities =
    state && !input.citySlug
      ? cityGroups(pool, state)
      : country && !input.regionSlug
        ? regionLinks(pool, country)
        : [];
  const platformLinks =
    input.citySlug && state
      ? platformGroups(pool, (slug) => platformCityPath(state.slug, input.citySlug ?? "", slug))
      : !state && !platform && !country
        ? PLATFORMS.map((item) => ({
            label: item.label,
            slug: item.slug,
            count: pool.filter((store) => store.platforms.includes(item.label)).length,
            href: platformPath(item.slug),
          })).filter((item) => item.count > 0)
        : [];

  if (platform) pool = pool.filter((store) => store.platforms.includes(platform.label));

  if (input.citySlug && platform && pool.length < MIN_PLATFORM_CITY_STORES) {
    return { status: "not-found" };
  }

  const placeTotal = pool.length;
  const visible = applyUserFilters(pool, filters);
  const total = visible.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pageCount) return { status: "not-found" };

  const stores = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const platformLabel = platform?.label ?? null;

  let basePath = "/directory";
  if (country && input.regionSlug) basePath = countryRegionPath(country.slug, input.regionSlug);
  else if (country) basePath = countryPath(country.slug);
  else if (platform && !state) basePath = platformPath(platform.slug);
  else if (state && input.citySlug && platform) {
    basePath = platformCityPath(state.slug, input.citySlug, platform.slug);
  } else if (state && input.citySlug) basePath = cityPath(state.slug, input.citySlug);
  else if (state) basePath = statePath(state.slug);

  const selfPath = pagePath(basePath, page);
  const canonicalPath = filtered ? basePath : selfPath;
  const place =
    cityName && state
      ? `${cityName}, ${state.name}`
      : state?.name ??
        (regionName && country ? `${regionName}, ${country.name}` : country?.name ?? null);
  const h1 = platformLabel
    ? place
      ? `${platformHeading(platformLabel)} in ${place}`
      : platformHeading(platformLabel)
    : place
      ? `Video Game Stores in ${place}`
      : "Video Game Stores";

  const noun = nounFor(platformLabel);
  const intro = leadSentence(total, noun, place);
  const compare = platformLabel
    ? "Compare hours, trade-ins, and used games at shops that carry this platform."
    : "Compare hours, trade-ins, used games, and retro stock.";

  let indexable = !filtered && page === 1;
  if (input.citySlug && platform) indexable = indexable && placeTotal >= MIN_PLATFORM_CITY_STORES;
  else if (input.citySlug) indexable = indexable && placeTotal >= MIN_CITY_STORES;
  else if (platform && !state) indexable = indexable && placeTotal >= 1;
  else if (state) indexable = indexable && placeTotal >= 1;
  else if (country) indexable = indexable && placeTotal >= 1;

  // Page 2 and later stay self-canonical for people, but only page 1 is the
  // main indexed URL for city, state, and platform lists.
  if (page > 1) indexable = false;

  const crumbs: Crumb[] = [
    { name: "Home", href: "/" },
    { name: "Stores", href: "/directory" },
  ];
  if (country) {
    crumbs.push({ name: "Countries", href: countriesPath() });
    crumbs.push({ name: country.name, href: countryPath(country.slug) });
    if (input.regionSlug && regionName) {
      crumbs.push({ name: regionName, href: countryRegionPath(country.slug, input.regionSlug) });
    }
  }
  if (state) crumbs.push({ name: state.name, href: statePath(state.slug) });
  if (state && input.citySlug && cityName) {
    crumbs.push({ name: cityName, href: cityPath(state.slug, input.citySlug) });
  }
  if (platform) crumbs.push({ name: platform.label });
  else if (input.regionSlug && regionName) crumbs[crumbs.length - 1] = { name: regionName };
  else if (country) crumbs[crumbs.length - 1] = { name: country.name };
  else if (input.citySlug && cityName) crumbs[crumbs.length - 1] = { name: cityName };
  else if (state) crumbs[crumbs.length - 1] = { name: state.name };
  else crumbs[crumbs.length - 1] = { name: "Stores" };

  return {
    status: "ok",
    page,
    pageCount,
    total,
    stores,
    basePath,
    canonicalPath,
    indexable,
    filtered,
    h1,
    title: toTitle(page > 1 ? `${h1}, Page ${page}` : h1),
    description: toMetaDescription(`${intro} ${compare}`),
    intro,
    crumbs,
    state,
    cityName,
    citySlug: input.citySlug ?? null,
    platformLabel,
    platformSlug: platform?.slug ?? null,
    cities,
    platformLinks,
    filters,
  };
}

export function storeHref(store: CatalogStore): string {
  return storePath(store.slug);
}
