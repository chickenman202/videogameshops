import { cache } from "react";
import type { CatalogStore } from "@/lib/catalog";
import { loadCatalog } from "@/lib/catalog";
import {
  cityStoresTitle,
  joinList,
  regionStoresTitle,
  toMetaDescription,
  toTitle,
} from "@/lib/copy";
import { countryBySlug } from "@/lib/countries";
import {
  emptyFilters,
  filtersFromRecord,
  hasFilters,
  recordHasFilters,
  type Filters,
} from "@/lib/filters";
import { countryLinks, type PlaceLink } from "@/lib/links";
import { isUsableAbout } from "@/lib/publish";
import {
  cityPathFor,
  countryPath,
  countryRegionPath,
  pagePath,
  platformCityPathFor,
  platformPath,
  statePath,
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
  countryName: string | null;
  countrySlug: string | null;
  regionName: string | null;
  regionSlug: string | null;
  platformLabel: PlatformLabel | null;
  platformSlug: string | null;
  cities: CityLink[];
  countries: PlaceLink[];
  platformLinks: PlatformLink[];
  filters: Filters;
};

export type ListingResult = ListingOk | { status: "error" } | { status: "not-found" };

export type ListingInput = {
  page: number;
  countrySlug?: string;
  stateSlug?: string;
  citySlug?: string;
  platformSlug?: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

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
      store.countryName.toLowerCase().includes(query)
    );
  });
}

function cityGroups(stores: CatalogStore[], hrefFor: (citySlug: string) => string): CityLink[] {
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
      href: hrefFor(slug),
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

function cityIsAmbiguous(stores: CatalogStore[], city: string): boolean {
  const key = city.toLowerCase();
  const places = new Set<string>();
  for (const store of stores) {
    if (store.city.toLowerCase() !== key) continue;
    places.add(`${store.countrySlug}/${store.stateSlug}`);
    if (places.size > 1) return true;
  }
  return false;
}

function regionIsAmbiguous(stores: CatalogStore[], region: string): boolean {
  const key = region.toLowerCase();
  const countries = new Set<string>();
  for (const store of stores) {
    if (store.state.toLowerCase() !== key) continue;
    countries.add(store.countrySlug);
    if (countries.size > 1) return true;
  }
  return false;
}

export function storeAbout(store: CatalogStore): string {
  if (isUsableAbout(store.about)) return store.about?.trim() ?? "";
  const facts: string[] = [];
  if (store.sellsNew) facts.push("new games");
  if (store.sellsUsed) facts.push("used games");
  if (store.tradeIns) facts.push("trade-ins");
  if (store.repairs) facts.push("console repair");
  const offer = facts.length
    ? `It offers ${joinList(facts)}.`
    : "The page lists the address and the hours on file.";
  const platforms = store.platforms.length ? ` Platforms: ${joinList(store.platforms)}.` : "";
  const where =
    store.countryCode === "US"
      ? `${store.city}, ${store.state}`
      : `${store.city}, ${store.state}, ${store.countryName}`;
  return `${store.name} is a video game store at ${store.address}, ${where}. ${offer}${platforms}`
    .replace(/\s+/g, " ")
    .trim();
}

async function buildListingUncached(input: ListingInput): Promise<ListingResult> {
  let page = input.page;
  if (page <= 1 && input.searchParams && recordHasFilters(input.searchParams)) {
    const raw = input.searchParams.page;
    const text = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
    if (/^[1-9]\d*$/.test(text)) page = Number(text);
  }
  if (!Number.isInteger(page) || page < 1) return { status: "not-found" };

  const platform = input.platformSlug ? getPlatformBySlug(input.platformSlug) : null;
  if (input.platformSlug && !platform) return { status: "not-found" };

  const catalog = await loadCatalog();
  if (!catalog.ok) return { status: "error" };

  const filters = input.searchParams ? filtersFromRecord(input.searchParams) : emptyFilters();
  const filtered =
    (input.searchParams ? recordHasFilters(input.searchParams) : false) || hasFilters(filters);
  // The path platform is the page itself. A ?platform= query is an extra filter.
  if (platform) filters.platform = null;

  let pool = catalog.stores;
  let countryName: string | null = null;
  let countrySlug: string | null = null;
  let countryCode: string | null = null;
  let regionName: string | null = null;
  let regionSlug: string | null = null;
  let state: UsState | null = null;

  if (input.countrySlug) {
    const known = countryBySlug(input.countrySlug);
    const slug = known?.country.slug ?? input.countrySlug;
    const inCountry = pool.filter((store) => store.countrySlug === slug);
    if (inCountry.length === 0) return { status: "not-found" };
    countryName = inCountry[0]?.countryName ?? known?.country.name ?? null;
    countrySlug = inCountry[0]?.countrySlug ?? slug;
    countryCode = inCountry[0]?.countryCode ?? known?.country.code ?? "";
    pool = inCountry;
  }

  if (input.stateSlug && !input.countrySlug) {
    state = getStateBySlug(input.stateSlug);
    if (!state) return { status: "not-found" };
    pool = pool.filter((store) => store.countryCode === "US" && store.stateSlug === state?.slug);
    countryName = "United States";
    countrySlug = "us";
    countryCode = "US";
    regionName = state.name;
    regionSlug = state.slug;
  } else if (input.stateSlug) {
    const inRegion = pool.filter((store) => store.stateSlug === input.stateSlug);
    if (inRegion.length === 0) return { status: "not-found" };
    regionName = inRegion[0]?.state ?? null;
    regionSlug = input.stateSlug;
    countryCode = inRegion[0]?.countryCode ?? countryCode;
    if (countryCode === "US") state = getStateBySlug(input.stateSlug);
    pool = inRegion;
  }

  let cityName: string | null = null;
  if (input.citySlug) {
    const inCity = pool.filter((store) => store.citySlug === input.citySlug);
    if (inCity.length === 0) return { status: "not-found" };
    cityName = inCity[0]?.city ?? null;
    pool = inCity;
  }

  const place = {
    countryCode: countryCode ?? "",
    countrySlug: countrySlug ?? "",
    stateSlug: regionSlug ?? "",
    citySlug: input.citySlug ?? "",
  };

  const cities =
    regionSlug && !input.citySlug
      ? cityGroups(pool, (citySlug) =>
          cityPathFor({
            countryCode: countryCode ?? "",
            countrySlug: countrySlug ?? "",
            stateSlug: regionSlug ?? "",
            citySlug,
          }),
        )
      : [];

  const platformLinks =
    input.citySlug && regionSlug
      ? platformGroups(pool, (slug) => platformCityPathFor(place, slug))
      : !regionSlug && !platform
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
  if (platform && !regionSlug) basePath = platformPath(platform.slug);
  else if (regionSlug && input.citySlug && platform) basePath = platformCityPathFor(place, platform.slug);
  else if (regionSlug && input.citySlug) basePath = cityPathFor(place);
  else if (regionSlug) {
    basePath =
      countryCode === "US" ? statePath(regionSlug) : countryRegionPath(countrySlug ?? "", regionSlug);
  }

  const selfPath = pagePath(basePath, page);
  const canonicalPath = filtered ? basePath : selfPath;
  const sentencePlace = cityName && regionName ? `${cityName}, ${regionName}` : (regionName ?? null);
  const cityAmbiguous = cityName ? cityIsAmbiguous(catalog.stores, cityName) : false;
  const regionAmbiguous = regionName ? regionIsAmbiguous(catalog.stores, regionName) : false;

  let h1 = "Video Game Stores";
  if (platformLabel) {
    const where = cityName
      ? cityAmbiguous && regionName
        ? `${cityName}, ${regionName}`
        : cityName
      : regionName
        ? regionAmbiguous && countryName
          ? `${regionName}, ${countryName}`
          : regionName
        : null;
    h1 = where ? `${platformHeading(platformLabel)} in ${where}` : platformHeading(platformLabel);
  } else if (cityName) {
    h1 = cityStoresTitle(cityName, regionName, cityAmbiguous);
  } else if (regionName) {
    h1 = regionStoresTitle(regionName, countryName, regionAmbiguous);
  }

  const noun = nounFor(platformLabel);
  const intro = leadSentence(filtered ? total : placeTotal, noun, sentencePlace);
  const detail = cityName && platformLabel
    ? `Shops in ${cityName} that carry ${platformLabel}.`
    : cityName
      ? `Compare hours, trade-ins, and used games at shops in ${cityName}.`
      : regionName && platformLabel
        ? `${platformLabel} shops in ${regionName}.`
        : regionName
          ? `Browse cities and shops in ${regionName}.`
          : platformLabel
            ? `Shops that carry ${platformLabel} games.`
            : "Browse physical video game stores by country, region, and city.";

  let indexable = !filtered && page === 1;
  if (input.citySlug && platform) indexable = indexable && placeTotal >= MIN_PLATFORM_CITY_STORES;
  else if (input.citySlug) indexable = indexable && placeTotal >= MIN_CITY_STORES;
  else if (platform && !regionSlug) indexable = indexable && placeTotal >= 1;
  else if (regionSlug) indexable = indexable && placeTotal >= 1;
  // Page 2 and later stay self-canonical, but only page 1 is the indexed URL.
  if (page > 1) indexable = false;

  const crumbs: Crumb[] = [{ name: "Home", href: "/" }];
  if (platform && !regionSlug) {
    crumbs.push({ name: "Platforms", href: "/directory/platforms" });
    crumbs.push({ name: platform.label });
  } else if (!regionSlug) {
    crumbs.push({ name: "Stores" });
  } else {
    if (countryName && countrySlug) {
      crumbs.push({ name: countryName, href: countryPath(countrySlug) });
    }
    if (regionName && regionSlug) {
      const href = countryCode === "US" ? statePath(regionSlug) : countryRegionPath(countrySlug ?? "", regionSlug);
      crumbs.push(cityName || platform ? { name: regionName, href } : { name: regionName });
    }
    if (cityName && input.citySlug) {
      const href = cityPathFor(place);
      crumbs.push(platform ? { name: cityName, href } : { name: cityName });
    }
    if (platform) crumbs.push({ name: platform.label });
  }

  const showCountries = !input.stateSlug && !input.citySlug && !input.countrySlug && !platform && !filtered;

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
    description: toMetaDescription(`${intro} ${detail}`),
    intro,
    crumbs,
    state,
    cityName,
    citySlug: input.citySlug ?? null,
    countryName,
    countrySlug,
    regionName,
    regionSlug,
    platformLabel,
    platformSlug: platform?.slug ?? null,
    cities,
    countries: showCountries ? countryLinks(catalog.stores) : [],
    platformLinks,
    filters,
  };
}

/** Stable key for one listing. Parsed back into ListingInput, so the filter field must stay `searchParams`. */
export function listingCacheKey(input: ListingInput): string {
  return JSON.stringify({
    page: input.page,
    countrySlug: input.countrySlug ?? null,
    stateSlug: input.stateSlug ?? null,
    citySlug: input.citySlug ?? null,
    platformSlug: input.platformSlug ?? null,
    searchParams: input.searchParams ?? null,
  });
}

const buildListingCached = cache((key: string) => buildListingUncached(JSON.parse(key) as ListingInput));

/** Page and metadata share one listing for the same visit. The shop list itself is cached for a day. */
export function buildListing(input: ListingInput): Promise<ListingResult> {
  return buildListingCached(listingCacheKey(input));
}

export { storeHref } from "@/lib/links";
