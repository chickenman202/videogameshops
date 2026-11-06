import { notFound, redirect } from "next/navigation";
import { loadCatalog } from "@/lib/catalog";
import { countryBySlug } from "@/lib/countries";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { directoryMetadata, directoryPage, pathPage } from "@/lib/listing-page";
import { countryRegionPath, statePath } from "@/lib/paths";
import { getStateBySlug } from "@/lib/states";

// The address can include filters, so the page is drawn per visit.
// The store list itself is reused for about a day.
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(
  props: PageProps<"/directory/countries/[countrySlug]/[regionSlug]/page/[pageNumber]">,
) {
  const { countrySlug, regionSlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  const stateSlug = await usStateRedirect(countrySlug, regionSlug);
  if (stateSlug) return directoryMetadata({ page, stateSlug, searchParams });
  return directoryMetadata({ page, countrySlug, regionSlug, searchParams });
}

export default async function CountryRegionNumberPage(
  props: PageProps<"/directory/countries/[countrySlug]/[regionSlug]/page/[pageNumber]">,
) {
  const { countrySlug, regionSlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  const stateSlug = await usStateRedirect(countrySlug, regionSlug);
  if (stateSlug) {
    const target = page === 1 ? statePath(stateSlug) : `${statePath(stateSlug)}/page/${page}`;
    redirect(hrefWithFilters(target, filtersFromRecord(searchParams)));
  }
  if (page === 1) {
    redirect(hrefWithFilters(countryRegionPath(countrySlug, regionSlug), filtersFromRecord(searchParams)));
  }
  return directoryPage({ page, countrySlug, regionSlug, searchParams });
}

/** US state pages already exist. A country-region URL for a US state sends people there. */
async function usStateRedirect(countrySlug: string, regionSlug: string): Promise<string | null> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return null;
  const country = countryBySlug(catalog.stores, countrySlug);
  if (country?.code !== "US") return null;
  return getStateBySlug(regionSlug)?.slug ?? null;
}
