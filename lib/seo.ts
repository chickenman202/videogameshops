import type { Metadata } from "next";
import type { ListingResult } from "@/lib/listing";
import { absoluteUrl } from "@/lib/jsonld";

export function listingMetadata(listing: ListingResult): Metadata {
  if (listing.status !== "ok") {
    const missing = listing.status === "not-found";
    return {
      title: { absolute: missing ? "Page Not Found" : "The shop list didn’t load" },
      robots: { index: false, follow: !missing },
    };
  }

  return {
    title: { absolute: listing.title },
    description: listing.description,
    alternates: { canonical: absoluteUrl(listing.canonicalPath) },
    robots: listing.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: listing.title,
      description: listing.description,
      url: absoluteUrl(listing.canonicalPath),
      siteName: "videogameshops",
      type: "website",
    },
  };
}
