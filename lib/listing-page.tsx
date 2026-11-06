import { notFound } from "next/navigation";
import { DirectoryScreen } from "@/components/directory-screen";
import { LoadError } from "@/components/load-error";
import { buildListing } from "@/lib/listing";
import { listingMetadata } from "@/lib/seo";

type ListingInput = Parameters<typeof buildListing>[0];

export async function directoryMetadata(input: ListingInput) {
  const listing = await buildListing(input);
  return listingMetadata(listing);
}

export async function directoryPage(input: ListingInput) {
  const listing = await buildListing(input);
  if (listing.status === "not-found") notFound();
  if (listing.status === "error") return <LoadError />;
  return <DirectoryScreen listing={listing} />;
}

export function pathPage(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const page = Number(raw);
  return Number.isSafeInteger(page) ? page : null;
}
