import { notFound, redirect } from "next/navigation";
import { filtersFromRecord, hrefWithFilters } from "@/lib/filters";
import { directoryMetadata, directoryPage, pathPage } from "@/lib/listing-page";

// The address can include filters, so the page is drawn per visit.
// The store list itself is reused for about a day.
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(props: PageProps<"/directory/page/[pageNumber]">) {
  const { pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  return directoryMetadata({ page, searchParams });
}

export default async function DirectoryNumberedPage(props: PageProps<"/directory/page/[pageNumber]">) {
  const { pageNumber } = await props.params;
  const page = pathPage(pageNumber);
  if (!page) notFound();
  const searchParams = (await props.searchParams) as Search;
  if (page === 1) redirect(hrefWithFilters("/directory", filtersFromRecord(searchParams)));
  return directoryPage({ page, searchParams });
}
