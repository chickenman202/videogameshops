import { redirectCountryAlias } from "@/lib/country-route";
import { directoryMetadata, directoryPage } from "@/lib/listing-page";

type Search = Record<string, string | string[] | undefined>;

// The address can include filters, so the page is drawn per visit.
// The store list itself is reused for about a day.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/directory/countries/[countrySlug]/[regionSlug]">,
) {
  const { countrySlug, regionSlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  redirectCountryAlias({ countrySlug, regionSlug, searchParams });
  return directoryMetadata({ page: 1, countrySlug, regionSlug, searchParams });
}

export default async function CountryRegionPage(
  props: PageProps<"/directory/countries/[countrySlug]/[regionSlug]">,
) {
  const { countrySlug, regionSlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  redirectCountryAlias({ countrySlug, regionSlug, searchParams });
  return directoryPage({ page: 1, countrySlug, regionSlug, searchParams });
}
