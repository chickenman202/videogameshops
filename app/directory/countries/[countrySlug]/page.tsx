import { directoryMetadata, directoryPage } from "@/lib/listing-page";

type Search = Record<string, string | string[] | undefined>;

// The address can include filters, so the page is drawn per visit.
// The store list itself is reused for about a day.
export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/directory/countries/[countrySlug]">) {
  const { countrySlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  return directoryMetadata({ page: 1, countrySlug, searchParams });
}

export default async function CountryPage(props: PageProps<"/directory/countries/[countrySlug]">) {
  const { countrySlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  return directoryPage({ page: 1, countrySlug, searchParams });
}
