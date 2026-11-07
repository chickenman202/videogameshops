import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { countryBySlug } from "@/lib/countries";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { directoryMetadata, directoryPage, pathPage } from "@/lib/listing-page";
import { redirectUnitedStatesAlias } from "@/lib/legacy-redirect";
import { countryPlatformCityPath } from "@/lib/paths";

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

type Search = Record<string, string | string[] | undefined>;

type PlatformCityPageProps = {
  params: Promise<{
    countrySlug: string;
    regionSlug: string;
    citySlug: string;
    platformSlug: string;
    pageNumber: string;
  }>;
  searchParams: Promise<Search>;
};

export async function generateMetadata(props: PlatformCityPageProps): Promise<Metadata> {
  const { countrySlug, regionSlug, citySlug, platformSlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, platformSlug, page, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) {
    permanentRedirect(countryPlatformCityPath(known.redirectSlug, regionSlug, citySlug, platformSlug));
  }
  return directoryMetadata({
    page,
    countrySlug,
    regionSlug,
    citySlug,
    platformSlug,
    searchParams,
  });
}

export default async function CountryPlatformCityNumberPage(props: PlatformCityPageProps) {
  const { countrySlug, regionSlug, citySlug, platformSlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, platformSlug, page, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) {
    permanentRedirect(countryPlatformCityPath(known.redirectSlug, regionSlug, citySlug, platformSlug));
  }
  const base = countryPlatformCityPath(countrySlug, regionSlug, citySlug, platformSlug);
  if (page === 1) redirect(hrefWithFilters(base, filtersFromRecord(searchParams)));
  return directoryPage({
    page,
    countrySlug,
    regionSlug,
    citySlug,
    platformSlug,
    searchParams,
  });
}
