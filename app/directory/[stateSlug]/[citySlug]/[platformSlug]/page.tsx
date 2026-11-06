import { directoryMetadata, directoryPage } from "@/lib/listing-page";

// The address can include filters, so the page is drawn per visit.
// The store list itself is reused for about a day.
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(
  props: PageProps<"/directory/[stateSlug]/[citySlug]/[platformSlug]">,
) {
  const { stateSlug, citySlug, platformSlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  return directoryMetadata({ page: 1, stateSlug, citySlug, platformSlug, searchParams });
}

export default async function PlatformCityPage(
  props: PageProps<"/directory/[stateSlug]/[citySlug]/[platformSlug]">,
) {
  const { stateSlug, citySlug, platformSlug } = await props.params;
  const searchParams = (await props.searchParams) as Search;
  return directoryPage({ page: 1, stateSlug, citySlug, platformSlug, searchParams });
}
