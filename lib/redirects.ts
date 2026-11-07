import { countryBySlug, isUnitedStatesSlug } from "@/lib/countries";
import {
  countryCityPath,
  countryPath,
  countryPlatformCityPath,
  countryRegionPath,
  pagePath,
  unitedStatesDirectoryPath,
} from "@/lib/paths";

/**
 * The one public country URL uses the ISO code: /directory/countries/fr.
 * Name spellings and old aliases move there with a permanent redirect.
 * A United States region under the country prefix moves to /directory/{state}.
 * Returns null when the path is already canonical.
 */
export function canonicalDirectoryRedirect(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "directory" || parts[1] !== "countries" || parts.length < 3) return null;

  let segments = parts.slice(2);
  let page = 1;
  if (segments.length >= 2 && segments.at(-2) === "page" && /^[1-9]\d*$/.test(segments.at(-1) ?? "")) {
    page = Number(segments.at(-1));
    segments = segments.slice(0, -2);
  }

  const [countrySlug, regionSlug, citySlug, platformSlug] = segments;
  if (!countrySlug) return null;

  if (regionSlug && isUnitedStatesSlug(countrySlug)) {
    return unitedStatesDirectoryPath({
      regionSlug,
      citySlug,
      platformSlug,
      page,
    });
  }

  const known = countryBySlug(countrySlug);
  if (!known?.redirectSlug) return null;

  const slug = known.redirectSlug;
  const base =
    regionSlug && citySlug && platformSlug
      ? countryPlatformCityPath(slug, regionSlug, citySlug, platformSlug)
      : regionSlug && citySlug
        ? countryCityPath(slug, regionSlug, citySlug)
        : regionSlug
          ? countryRegionPath(slug, regionSlug)
          : countryPath(slug);
  const target = page > 1 ? pagePath(base, page) : base;
  return target === path ? null : target;
}
