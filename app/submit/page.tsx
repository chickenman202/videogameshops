import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { SubmitStoreForm } from "@/components/forms";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description = "Add a video game store to videogameshops. We read it before the page goes up.";

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
      lede="Got a shop with a street address? Send the name, the street, the city, and the country. We’ll read it before the page goes up. Already listed and something’s off? Use Contact."
    >
      <SubmitStoreForm />
    </ArticlePage>
  );
}
