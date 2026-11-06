import { permanentRedirect } from "next/navigation";
import { countryBySlug, isUnitedStatesSlug } from "@/lib/countries";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { redirectUnitedStatesAlias } from "@/lib/legacy-redirect";
import { countryPath, countryRegionPath, pagePath } from "@/lib/paths";

/**
 * Country URLs use the ISO code. /uk and /france move to /gb and /fr.
 * /directory/countries/us/texas moves to /directory/texas.
 * Both redirects are permanent (308).
 */
export function redirectCountryAlias(input: {
  countrySlug: string;
  regionSlug?: string;
  page?: number;
  searchParams?: Record<string, string | string[] | undefined>;
}): void {
  if (input.regionSlug && isUnitedStatesSlug(input.countrySlug)) {
    const known = countryBySlug(input.countrySlug);
    redirectUnitedStatesAlias({
      countrySlug: known?.country.slug ?? input.countrySlug,
      regionSlug: input.regionSlug,
      page: input.page,
      searchParams: input.searchParams,
    });
  }
  const known = countryBySlug(input.countrySlug);
  if (!known?.redirectSlug) return;
  const filters = input.searchParams ? filtersFromRecord(input.searchParams) : filtersFromRecord({});
  const base = input.regionSlug
    ? countryRegionPath(known.redirectSlug, input.regionSlug)
    : countryPath(known.redirectSlug);
  permanentRedirect(hrefWithFilters(pagePath(base, input.page ?? 1), filters));
}
