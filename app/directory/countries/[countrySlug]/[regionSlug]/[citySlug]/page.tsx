import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { countryBySlug } from "@/lib/countries";
import { directoryMetadata, directoryPage } from "@/lib/listing-page";
import { redirectUnitedStatesAlias } from "@/lib/legacy-redirect";
import { countryCityPath } from "@/lib/paths";

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

type Search = Record<string, string | string[] | undefined>;

type CityProps = {
  params: Promise<{ countrySlug: string; regionSlug: string; citySlug: string }>;
  searchParams: Promise<Search>;
};

export async function generateMetadata(props: CityProps): Promise<Metadata> {
  const { countrySlug, regionSlug, citySlug } = await props.params;
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) permanentRedirect(countryCityPath(known.redirectSlug, regionSlug, citySlug));
  return directoryMetadata({ page: 1, countrySlug, stateSlug: regionSlug, citySlug, searchParams });
}

export default async function CountryCityPage(props: CityProps) {
  const { countrySlug, regionSlug, citySlug } = await props.params;
  const searchParams = await props.searchParams;
  redirectUnitedStatesAlias({ countrySlug, regionSlug, citySlug, searchParams });
  const known = countryBySlug(countrySlug);
  if (known?.redirectSlug) permanentRedirect(countryCityPath(known.redirectSlug, regionSlug, citySlug));
  return directoryPage({ page: 1, countrySlug, stateSlug: regionSlug, citySlug, searchParams });
}
