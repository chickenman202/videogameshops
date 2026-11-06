import { directoryMetadata, directoryPage } from "@/lib/listing-page";

type Search = Record<string, string | string[] | undefined>;

export const revalidate = 86400;

export async function generateMetadata(props: PageProps<"/directory">) {
  const searchParams = (await props.searchParams) as Search;
  return directoryMetadata({ page: 1, searchParams });
}

export default async function DirectoryPage(props: PageProps<"/directory">) {
  const searchParams = (await props.searchParams) as Search;
  return directoryPage({ page: 1, searchParams });
}
