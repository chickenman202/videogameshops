import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { SubmitStoreForm } from "@/components/forms";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description =
  "Shop owners can send a physical video game store for Video Game Shops. A person reads the note before it is listed.";

export const metadata: Metadata = {
  title: { absolute: `Add a store | ${BRAND}` },
  description,
  alternates: { canonical: absoluteUrl("/submit") },
  openGraph: {
    title: `Add a store | ${BRAND}`,
    description,
    url: absoluteUrl("/submit"),
    siteName: BRAND,
    type: "website",
  },
};

export default function SubmitPage() {
  return (
    <ArticlePage
      title="Add a store"
      lede="Tell us about a shop with a street address. Include the country, wherever the shop is. We’ll read the note before the page goes up. For a correction to a shop that is already listed, use Contact."
    >
      <SubmitStoreForm />
    </ArticlePage>
  );
}
