import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { countryBySlug } from "@/lib/countries";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { directoryMetadata, directoryPage, pathPage } from "@/lib/listing-page";
import { redirectUnitedStatesAlias } from "@/lib/legacy-redirect";
import { countryCityPath } from "@/lib/paths";

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

type Search = Record<string, string | string[] | undefined>;

type CityPageProps = {
  params: Promise<{ countrySlug: string; regionSlug: string; citySlug: string; pageNumber: string }>;
  searchParams: Promise<Search>;
};

export async function generateMetadata(props: CityPageProps): Promise<Metadata> {
  const { countrySlug, regionSlug, citySlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, page, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) permanentRedirect(countryCityPath(known.redirectSlug, regionSlug, citySlug));
  return directoryMetadata({ page, countrySlug, stateSlug: regionSlug, citySlug, searchParams });
}

export default async function CountryCityNumberPage(props: CityPageProps) {
  const { countrySlug, regionSlug, citySlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, page, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) permanentRedirect(countryCityPath(known.redirectSlug, regionSlug, citySlug));
  if (page === 1) {
    redirect(hrefWithFilters(countryCityPath(countrySlug, regionSlug, citySlug), filtersFromRecord(searchParams)));
  }
  return directoryPage({ page, countrySlug, stateSlug: regionSlug, citySlug, searchParams });
}
