import { redirect } from "next/navigation";
import { loadCatalog } from "@/lib/catalog";
import { countryBySlug } from "@/lib/countries";
import { directoryMetadata, directoryPage } from "@/lib/listing-page";
import { statePath } from "@/lib/paths";
import { getStateBySlug } from "@/lib/states";

type Search = Record<string, string | string[] | undefined>;

// The address can include filters, so the page is drawn per visit.
// The store list itself is reused for about a day.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/directory/countries/[countrySlug]/[regionSlug]">,
) {
  const { countrySlug, regionSlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  const stateSlug = await usStateRedirect(countrySlug, regionSlug);
  if (stateSlug) return directoryMetadata({ page: 1, stateSlug, searchParams });
  return directoryMetadata({ page: 1, countrySlug, regionSlug, searchParams });
}

export default async function CountryRegionPage(
  props: PageProps<"/directory/countries/[countrySlug]/[regionSlug]">,
) {
  const { countrySlug, regionSlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  const stateSlug = await usStateRedirect(countrySlug, regionSlug);
  if (stateSlug) redirect(statePath(stateSlug));
  return directoryPage({ page: 1, countrySlug, regionSlug, searchParams });
}

/** US state pages already exist. A country-region URL for a US state sends people there. */
async function usStateRedirect(countrySlug: string, regionSlug: string): Promise<string | null> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return null;
  const country = countryBySlug(catalog.stores, countrySlug);
  if (country?.code !== "US") return null;
  return getStateBySlug(regionSlug)?.slug ?? null;
}
