import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/catalog";
import { countryEntries, regionLinks, regionSlugFor } from "@/lib/country-browse";
import { cityPath, countriesPath, countryPath, platformCityPath, platformPath, statePath, storePath } from "@/lib/paths";
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
        const stores = catalog.stores.filter(
          (store) => store.country === country.code && regionSlugFor(store) === region.slug,
        );
        return entry(region.href, newest(stores.map((store) => store.updatedAt)));
      }),
    );

  const storeEntries = catalog.stores
    .filter((store) => store.indexable)
    .map((store) => entry(storePath(store.slug), store.updatedAt));

  return [
    ...staticPages,
    ...stateEntries,
    ...countryPageEntries,
    ...regionPageEntries,
    ...cityEntries,
    ...platformEntries,
    ...platformCityEntries,
    ...storeEntries,
  ];
}
