import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { countryBySlug } from "@/lib/countries";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { directoryMetadata, directoryPage, pathPage } from "@/lib/listing-page";
import { redirectUnitedStatesAlias } from "@/lib/legacy-redirect";
import { countryRegionPath } from "@/lib/paths";

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

type Search = Record<string, string | string[] | undefined>;

type RegionPageProps = {
  params: Promise<{ countrySlug: string; regionSlug: string; pageNumber: string }>;
  searchParams: Promise<Search>;
};

export async function generateMetadata(props: RegionPageProps): Promise<Metadata> {
  const { countrySlug, regionSlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, page, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) permanentRedirect(countryRegionPath(known.redirectSlug, regionSlug));
  return directoryMetadata({ page, countrySlug, stateSlug: regionSlug, searchParams });
}

export default async function CountryRegionNumberPage(props: RegionPageProps) {
  const { countrySlug, regionSlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, page, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) permanentRedirect(countryRegionPath(known.redirectSlug, regionSlug));
  if (page === 1) {
    redirect(hrefWithFilters(countryRegionPath(countrySlug, regionSlug), filtersFromRecord(searchParams)));
  }
  return directoryPage({ page, countrySlug, stateSlug: regionSlug, searchParams });
}
