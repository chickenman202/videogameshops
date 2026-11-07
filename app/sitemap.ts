import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/catalog";
import { countryEntries, regionLinks, regionSlugByName } from "@/lib/country-browse";
import { groupPlaceNames } from "@/lib/place-fold";
import {
  cityPath,
  countriesPath,
  countryCityPath,
  countryPath,
  countryPlatformCityPath,
  platformCityPath,
  platformPath,
  statePath,
  storePath,
} from "@/lib/paths";
import { PLATFORMS } from "@/lib/platforms";
import { CONTENT_UPDATED, MIN_CITY_STORES, MIN_PLATFORM_CITY_STORES, SITE_URL } from "@/lib/site";
import { US_STATES } from "@/lib/states";

// The store list inside loadCatalog refreshes about once a day.
// A failed read is not saved as an empty sitemap.

function entry(path: string, lastModified: string): MetadataRoute.Sitemap[number] {
  return { url: `${SITE_URL}${path}`, lastModified };
}

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await loadCatalog();
  if (!catalog.ok) {
    throw new Error(catalog.error);
  }

  const staticPages = [
    "/",
    "/directory",
    "/directory/states",
    countriesPath(),
    "/directory/platforms",
    "/about",
    "/contact",
    "/submit",
    "/privacy",
    "/terms",
  ].map((path) => entry(path, CONTENT_UPDATED));

  const newest = (dates: string[]) =>
    dates.sort().at(-1) ?? CONTENT_UPDATED;

  const stateEntries = US_STATES.flatMap((state) => {
    const stores = catalog.stores.filter((store) => store.stateSlug === state.slug);
    if (stores.length < 1) return [];
    return [entry(statePath(state.slug), newest(stores.map((store) => store.updatedAt)))];
  });

  const cityKeys = new Map<string, { stateSlug: string; citySlug: string; updated: string[] }>();
  for (const store of catalog.stores) {
    if (!store.stateSlug || !store.citySlug) continue;
    const key = `${store.stateSlug}/${store.citySlug}`;
    const current = cityKeys.get(key);
    if (!current) {
      cityKeys.set(key, {
        stateSlug: store.stateSlug,
        citySlug: store.citySlug,
        updated: [store.updatedAt],
      });
    } else current.updated.push(store.updatedAt);
  }

  const cityEntries = [...cityKeys.values()].flatMap((city) => {
    if (city.updated.length < MIN_CITY_STORES) return [];
    return [entry(cityPath(city.stateSlug, city.citySlug), newest(city.updated))];
  });

  const platformEntries = PLATFORMS.flatMap((platform) => {
    const stores = catalog.stores.filter((store) => store.platforms.includes(platform.label));
    if (stores.length < 1) return [];
    return [entry(platformPath(platform.slug), newest(stores.map((store) => store.updatedAt)))];
  });

  const platformCityEntries: MetadataRoute.Sitemap = [];
  for (const platform of PLATFORMS) {
    const groups = new Map<string, { stateSlug: string; citySlug: string; updated: string[] }>();
    for (const store of catalog.stores) {
      if (!store.platforms.includes(platform.label)) continue;
      if (!store.stateSlug || !store.citySlug) continue;
      const key = `${store.stateSlug}/${store.citySlug}`;
      const current = groups.get(key);
      if (!current) {
        groups.set(key, {
          stateSlug: store.stateSlug,
          citySlug: store.citySlug,
          updated: [store.updatedAt],
        });
      } else current.updated.push(store.updatedAt);
    }
    for (const group of groups.values()) {
      if (group.updated.length < MIN_PLATFORM_CITY_STORES) continue;
      platformCityEntries.push(
        entry(platformCityPath(group.stateSlug, group.citySlug, platform.slug), newest(group.updated)),
      );
    }
  }

  const countries = countryEntries(catalog.stores);
  const countryPageEntries = countries.map((country) => {
    const stores = catalog.stores.filter((store) => store.country === country.code);
    return entry(countryPath(country.slug), newest(stores.map((store) => store.updatedAt)));
  });
  // US regions already appear as state pages. Other countries get a page
  // only when that region has enough shops.
  const regionPageEntries = countries
    .filter((country) => country.code !== "US")
    .flatMap((country) =>
      regionLinks(catalog.stores, country).map((region) => {
        const grouped = regionSlugByName(catalog.stores, country.code);
        const stores = catalog.stores.filter(
          (store) => store.country === country.code && grouped.get(store.state.trim()) === region.slug,
        );
        return entry(region.href, newest(stores.map((store) => store.updatedAt)));
      }),
    );

  // Cities outside the US. The slug is the same fold the city page uses, so a
  // merged spelling is one URL. A city needs 3 shops before it is listed.
  const worldPlaces = countries
    .filter((country) => country.code !== "US")
    .flatMap((country) => {
      const regionNames = regionSlugByName(catalog.stores, country.code);
      const inCountry = catalog.stores.filter((store) => store.country === country.code && store.city.trim());
      const byRegion = new Map<string, typeof catalog.stores>();
      for (const store of inCountry) {
        const regionSlug = regionNames.get(store.state.trim());
        if (!regionSlug) continue;
        const list = byRegion.get(regionSlug) ?? [];
        list.push(store);
        byRegion.set(regionSlug, list);
      }
      return [...byRegion.entries()].map(([regionSlug, stores]) => ({
        countrySlug: country.slug,
        regionSlug,
        stores,
      }));
    });
  const worldCityEntries = worldPlaces.flatMap((region) => {
    const grouped = groupPlaceNames(region.stores.map((store) => store.city));
    const buckets = new Map<string, string[]>();
    for (const store of region.stores) {
      const slug = grouped.get(store.city.trim());
      if (!slug) continue;
      const updated = buckets.get(slug) ?? [];
      updated.push(store.updatedAt);
      buckets.set(slug, updated);
    }
    return [...buckets.entries()].flatMap(([citySlug, updated]) => {
      if (updated.length < MIN_CITY_STORES) return [];
      return [entry(countryCityPath(region.countrySlug, region.regionSlug, citySlug), newest(updated))];
    });
  });

  const worldPlatformCityEntries: MetadataRoute.Sitemap = [];
  for (const platform of PLATFORMS) {
    for (const region of worldPlaces) {
      const matching = region.stores.filter((store) => store.platforms.includes(platform.label));
      const grouped = groupPlaceNames(matching.map((store) => store.city));
      const buckets = new Map<string, string[]>();
      for (const store of matching) {
        const slug = grouped.get(store.city.trim());
        if (!slug) continue;
        const updated = buckets.get(slug) ?? [];
        updated.push(store.updatedAt);
        buckets.set(slug, updated);
      }
      for (const [citySlug, updated] of buckets) {
        if (updated.length < MIN_PLATFORM_CITY_STORES) continue;
        worldPlatformCityEntries.push(
          entry(
            countryPlatformCityPath(region.countrySlug, region.regionSlug, citySlug, platform.slug),
            newest(updated),
          ),
        );
      }
    }
  }

  const storeEntries = catalog.stores
    .filter((store) => store.indexable)
    .map((store) => entry(storePath(store.slug), store.updatedAt));

  return [
    ...staticPages,
    ...stateEntries,
    ...countryPageEntries,
    ...regionPageEntries,
    ...cityEntries,
    ...worldCityEntries,
    ...platformEntries,
    ...platformCityEntries,
    ...worldPlatformCityEntries,
    ...storeEntries,
  ];
}
