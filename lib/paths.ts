import { getStateBySlug } from "@/lib/states";

export function pagePath(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  return `${basePath}/page/${page}`;
}

export function statePath(stateSlug: string): string {
  return `/directory/${stateSlug}`;
}

export function countriesPath(): string {
  return "/directory/countries";
}

export function countryPath(countrySlug: string): string {
  return `/directory/countries/${countrySlug}`;
}

export function countryRegionPath(countrySlug: string, regionSlug: string): string {
  return `/directory/countries/${countrySlug}/${regionSlug}`;
}

export function countryCityPath(countrySlug: string, regionSlug: string, citySlug: string): string {
  return `/directory/countries/${countrySlug}/${regionSlug}/${citySlug}`;
}

export function countryPlatformCityPath(
  countrySlug: string,
  regionSlug: string,
  citySlug: string,
  platformSlug: string,
): string {
  return `/directory/countries/${countrySlug}/${regionSlug}/${citySlug}/${platformSlug}`;
}

type Place = {
  countryCode: string;
  countrySlug: string;
  stateSlug: string;
  citySlug: string;
};

/** The one region URL for a shop. US states keep /directory/{state}. */
export function regionPathFor(place: Place): string {
  if (place.countryCode === "US") return statePath(place.stateSlug);
  return countryRegionPath(place.countrySlug, place.stateSlug);
}

/** The one city URL for a shop. */
export function cityPathFor(place: Place): string {
  if (place.countryCode === "US") return cityPath(place.stateSlug, place.citySlug);
  return countryCityPath(place.countrySlug, place.stateSlug, place.citySlug);
}

/** The one platform-in-a-city URL for a shop. */
export function platformCityPathFor(place: Place, platformSlug: string): string {
  if (place.countryCode === "US") return platformCityPath(place.stateSlug, place.citySlug, platformSlug);
  return countryPlatformCityPath(place.countrySlug, place.stateSlug, place.citySlug, platformSlug);
}

export function cityPath(stateSlug: string, citySlug: string): string {
  return `/directory/${stateSlug}/${citySlug}`;
}

export function platformPath(platformSlug: string): string {
  return `/directory/platforms/${platformSlug}`;
}

export function platformCityPath(
  stateSlug: string,
  citySlug: string,
  platformSlug: string,
): string {
  return `/directory/${stateSlug}/${citySlug}/${platformSlug}`;
}

export function storePath(slug: string): string {
  return `/store/${slug}`;
}

/**
 * /directory/countries/us/texas is the same page as /directory/texas.
 * Returns the existing US address so the country-shaped URL can redirect.
 */
export function unitedStatesDirectoryPath(input: {
  regionSlug: string;
  citySlug?: string;
  platformSlug?: string;
  page?: number;
}): string | null {
  const state = getStateBySlug(input.regionSlug);
  if (!state) return null;
  const base =
    input.citySlug && input.platformSlug
      ? platformCityPath(state.slug, input.citySlug, input.platformSlug)
      : input.citySlug
        ? cityPath(state.slug, input.citySlug)
        : statePath(state.slug);
  return pagePath(base, input.page ?? 1);
}
