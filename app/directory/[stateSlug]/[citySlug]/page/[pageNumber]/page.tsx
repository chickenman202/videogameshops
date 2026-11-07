import { notFound, redirect } from "next/navigation";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { directoryMetadata, directoryPage, pathPage } from "@/lib/listing-page";
import { cityPath } from "@/lib/paths";

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(
  props: PageProps<"/directory/[stateSlug]/[citySlug]/page/[pageNumber]">,
) {
  const { stateSlug, citySlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  return directoryMetadata({ page, stateSlug, citySlug, searchParams });
}

export default async function CityNumberPage(
  props: PageProps<"/directory/[stateSlug]/[citySlug]/page/[pageNumber]">,
) {
  const { stateSlug, citySlug, pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  if (page === 1) {
    redirect(hrefWithFilters(cityPath(stateSlug, citySlug), filtersFromRecord(searchParams)));
  }
  return directoryPage({ page, stateSlug, citySlug, searchParams });
}
