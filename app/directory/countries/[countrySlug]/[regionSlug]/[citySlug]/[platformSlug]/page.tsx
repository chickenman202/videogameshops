import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { countryBySlug } from "@/lib/countries";
import { directoryMetadata, directoryPage } from "@/lib/listing-page";
import { redirectUnitedStatesAlias } from "@/lib/legacy-redirect";
import { countryPlatformCityPath } from "@/lib/paths";

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

type Search = Record<string, string | string[] | undefined>;

type PlatformCityProps = {
  params: Promise<{ countrySlug: string; regionSlug: string; citySlug: string; platformSlug: string }>;
  searchParams: Promise<Search>;
};

export async function generateMetadata(props: PlatformCityProps): Promise<Metadata> {
  const { countrySlug, regionSlug, citySlug, platformSlug } = await props.params;
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, platformSlug, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) {
    permanentRedirect(countryPlatformCityPath(known.redirectSlug, regionSlug, citySlug, platformSlug));
  }
  return directoryMetadata({
    page: 1,
    countrySlug,
    regionSlug,
    citySlug,
    platformSlug,
    searchParams,
  });
}

export default async function CountryPlatformCityPage(props: PlatformCityProps) {
  const { countrySlug, regionSlug, citySlug, platformSlug } = await props.params;
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, platformSlug, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) {
    permanentRedirect(countryPlatformCityPath(known.redirectSlug, regionSlug, citySlug, platformSlug));
  }
  return directoryPage({ page: 1, countrySlug, regionSlug, citySlug, platformSlug, searchParams });
}
