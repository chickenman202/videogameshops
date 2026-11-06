import type { CatalogStore } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/jsonld";
import {
  cityPathFor,
  countriesPath,
  countryPath,
  platformCityPathFor,
  platformPath,
  regionPathFor,
} from "@/lib/paths";
import { PLATFORMS } from "@/lib/platforms";
import { isIndexableShop } from "@/lib/publish";
import { CONTENT_UPDATED, MIN_CITY_STORES, MIN_PLATFORM_CITY_STORES } from "@/lib/site";

/** One sitemap URL. Priority and change frequency are omitted on purpose. */
export type SitemapEntry = {
  url: string;
  lastModified: string;
};

type Group = { count: number; updated: string };

function touch(map: Map<string, Group>, key: string, updatedAt: string) {
  const current = map.get(key);
  if (!current) {
    map.set(key, { count: 1, updated: updatedAt });
    return;
  }
  current.count += 1;
  if (updatedAt > current.updated) current.updated = updatedAt;
}

function entry(path: string, lastModified: string): SitemapEntry {
  return { url: absoluteUrl(path), lastModified };
}

/**
 * Hubs, country, region, and city pages, plus shop pages that have a street, phone, or website.
 * A shop with none of those stays public but is left out of the sitemap.
 * Cities and platform-in-city pages are left out until they have enough shops.
 * Page 2 and filter URLs are left out.
 */
export function buildSitemap(stores: CatalogStore[], contentUpdated = CONTENT_UPDATED): SitemapEntry[] {
  const countries = new Map<string, Group>();
  const regions = new Map<string, Group>();
  const cities = new Map<string, Group>();
  const platforms = new Map<string, Group>();
  const platformCities = new Map<string, Group>();
  let hasUnitedStates = false;

  for (const store of stores) {
    if (store.countryCode === "US" && store.stateSlug) hasUnitedStates = true;
    if (store.countrySlug) touch(countries, store.countrySlug, store.updatedAt);
    if (store.countrySlug && store.stateSlug) {
      touch(regions, `${store.countrySlug}/${store.stateSlug}`, store.updatedAt);
    }
    if (store.countrySlug && store.stateSlug && store.citySlug) {
      touch(cities, `${store.countrySlug}/${store.stateSlug}/${store.citySlug}`, store.updatedAt);
    }
    for (const label of store.platforms) {
      const platform = PLATFORMS.find((item) => item.label === label);
      if (!platform) continue;
      touch(platforms, platform.slug, store.updatedAt);
      if (store.countrySlug && store.stateSlug && store.citySlug) {
        touch(
          platformCities,
          `${store.countrySlug}/${store.stateSlug}/${store.citySlug}/${platform.slug}`,
          store.updatedAt,
        );
      }
    }
  }

  const staticPages = ["/", "/directory", "/about", "/directory/platforms"];
  if (countries.size > 0) staticPages.push(countriesPath());
  if (hasUnitedStates) staticPages.push("/directory/states");

  const pages: SitemapEntry[] = staticPages.map((path) => entry(path, contentUpdated));

  const sampleByCountry = new Map<string, CatalogStore>();
  const sampleByRegion = new Map<string, CatalogStore>();
  const sampleByCity = new Map<string, CatalogStore>();
  for (const store of stores) {
    if (store.countrySlug && !sampleByCountry.has(store.countrySlug)) {
      sampleByCountry.set(store.countrySlug, store);
    }
    if (!store.stateSlug) continue;
    const regionKey = `${store.countrySlug}/${store.stateSlug}`;
    if (!sampleByRegion.has(regionKey)) sampleByRegion.set(regionKey, store);
    if (!store.citySlug) continue;
    const cityKey = `${regionKey}/${store.citySlug}`;
    if (!sampleByCity.has(cityKey)) sampleByCity.set(cityKey, store);
  }

  for (const [slug, group] of countries) {
    if (!slug || group.count < 1) continue;
    pages.push(entry(countryPath(slug), group.updated));
  }

  for (const [key, group] of regions) {
    if (group.count < 1) continue;
    const store = sampleByRegion.get(key);
    if (!store) continue;
    pages.push(entry(regionPathFor(store), group.updated));
  }

  for (const [key, group] of cities) {
    if (group.count < MIN_CITY_STORES) continue;
    const store = sampleByCity.get(key);
    if (!store) continue;
    pages.push(entry(cityPathFor(store), group.updated));
  }

  for (const [slug, group] of platforms) {
    if (group.count < 1) continue;
    pages.push(entry(platformPath(slug), group.updated));
  }

  for (const [key, group] of platformCities) {
    if (group.count < MIN_PLATFORM_CITY_STORES) continue;
    const platformSlug = key.split("/").at(-1);
    const cityKey = key.split("/").slice(0, 3).join("/");
    const store = sampleByCity.get(cityKey);
    if (!store || !platformSlug) continue;
    pages.push(entry(platformCityPathFor(store, platformSlug), group.updated));
  }

  for (const store of stores) {
    if (!isIndexableShop(store)) continue;
    pages.push(entry(`/store/${store.slug}`, store.updatedAt));
  }

  return pages.sort((a, b) => a.url.localeCompare(b.url) || a.lastModified.localeCompare(b.lastModified));
}

/** Hubs we can still list when the shop file cannot be read. No shop URLs. */
export function fallbackSitemap(contentUpdated = CONTENT_UPDATED): SitemapEntry[] {
  return ["/", "/directory", "/about", "/directory/countries", "/directory/platforms", "/directory/states"].map(
    (path) => entry(path, contentUpdated),
  );
}
