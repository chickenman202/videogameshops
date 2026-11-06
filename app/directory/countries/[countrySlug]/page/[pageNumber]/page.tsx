import { notFound, redirect } from "next/navigation";
import { redirectCountryAlias } from "@/lib/country-route";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { directoryMetadata, directoryPage, pathPage } from "@/lib/listing-page";
import { countryPath } from "@/lib/paths";

// The address can include filters, so the page is drawn per visit.
// The store list itself is reused for about a day.
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(
  props: PageProps<"/directory/countries/[countrySlug]/page/[pageNumber]">,
) {
  const { countrySlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  redirectCountryAlias({ countrySlug, page, searchParams });
  return directoryMetadata({ page, countrySlug, searchParams });
}

export default async function CountryNumberPage(
  props: PageProps<"/directory/countries/[countrySlug]/page/[pageNumber]">,
) {
  const { countrySlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  redirectCountryAlias({ countrySlug, page, searchParams });
  if (page === 1) redirect(hrefWithFilters(countryPath(countrySlug), filtersFromRecord(searchParams)));
  return directoryPage({ page, countrySlug, searchParams });
}
