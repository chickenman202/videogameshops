import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/jsonld";
import type { ListingResult } from "@/lib/listing";
import { BRAND } from "@/lib/site";

function publicImage(src: string): string | null {
  const value = src.trim();
  if (!value) return null;
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  if (value.startsWith("/")) return absoluteUrl(value);
  return null;
}

/** Shared title, description, canonical URL, and social tags for one public page. */
export function pageMetadata(input: {
  title: string;
  description: string;
  canonicalPath: string;
  index?: boolean;
  follow?: boolean;
  image?: string | null;
}): Metadata {
  const index = input.index !== false;
  const follow = input.follow !== false;
  const url = absoluteUrl(input.canonicalPath);
  const image = input.image ? publicImage(input.image) : null;
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: url },
    robots: { index, follow },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: BRAND,
      type: "website",
      ...(image ? { images: [{ url: image, alt: input.title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function listingMetadata(listing: ListingResult): Metadata {
  if (listing.status !== "ok") {
    const missing = listing.status === "not-found";
    return {
      title: { absolute: missing ? "Page Not Found" : "The shop list didn’t load" },
      robots: { index: false, follow: !missing },
    };
  }

  return pageMetadata({
    title: listing.title,
    description: listing.description,
    canonicalPath: listing.canonicalPath,
    index: listing.indexable,
  });
}
