import { notFound, permanentRedirect } from "next/navigation";
import { isUnitedStatesSlug } from "@/lib/countries";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { unitedStatesDirectoryPath } from "@/lib/paths";

/**
 * /directory/countries/us/texas/austin is not a second copy of /directory/texas/austin.
 * Send the country-shaped US address to the existing directory address.
 */
export function redirectUnitedStatesAlias(input: {
  countrySlug: string;
  regionSlug: string;
  citySlug?: string;
  platformSlug?: string;
  page?: number;
  searchParams?: Record<string, string | string[] | undefined>;
}): void {
  if (!isUnitedStatesSlug(input.countrySlug)) return;
  const path = unitedStatesDirectoryPath({
    regionSlug: input.regionSlug,
    citySlug: input.citySlug,
    platformSlug: input.platformSlug,
    page: input.page,
  });
  if (!path) notFound();
  const filters = input.searchParams ? filtersFromRecord(input.searchParams) : filtersFromRecord({});
  permanentRedirect(hrefWithFilters(path, filters));
}
