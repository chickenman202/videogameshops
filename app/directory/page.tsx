import { directoryMetadata, directoryPage } from "@/lib/listing-page";

type Search = Record<string, string | string[] | undefined>;

export const revalidate = 86400;
// This page reads filter queries, so it is rendered per visit.
// Do not add generateStaticParams: a static page that also reads searchParams crashes in production.
// The shop list itself is cached for a day inside loadCatalog.

export async function generateMetadata(props: PageProps<"/directory">) {
  const searchParams = (await props.searchParams) as Search;
  return directoryMetadata({ page: 1, searchParams });
}

export default async function DirectoryPage(props: PageProps<"/directory">) {
  const searchParams = (await props.searchParams) as Search;
  return directoryPage({ page: 1, searchParams });
}
