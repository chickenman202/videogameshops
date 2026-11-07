import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { countryBySlug } from "@/lib/countries";
import { directoryMetadata, directoryPage } from "@/lib/listing-page";
import { redirectUnitedStatesAlias } from "@/lib/legacy-redirect";
import { countryRegionPath } from "@/lib/paths";

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

type Search = Record<string, string | string[] | undefined>;

type RegionProps = {
  params: Promise<{ countrySlug: string; regionSlug: string }>;
  searchParams: Promise<Search>;
};

function redirectAliases(countrySlug: string, regionSlug: string, searchParams: Search) {
  redirectUnitedStatesAlias({ countrySlug, regionSlug, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) permanentRedirect(countryRegionPath(known.redirectSlug, regionSlug));
}

export async function generateMetadata(props: RegionProps): Promise<Metadata> {
  const { countrySlug, regionSlug } = await props.params;
  const searchParams = await props.searchParams;
  redirectAliases(countrySlug, regionSlug, searchParams);
  return directoryMetadata({ page: 1, countrySlug, stateSlug: regionSlug, searchParams });
}

export default async function CountryRegionPage(props: RegionProps) {
  const { countrySlug, regionSlug } = await props.params;
  const searchParams = await props.searchParams;
  redirectAliases(countrySlug, regionSlug, searchParams);
  return directoryPage({ page: 1, countrySlug, stateSlug: regionSlug, searchParams });
}
