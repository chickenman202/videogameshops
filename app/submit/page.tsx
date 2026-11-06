import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { SubmitStoreForm } from "@/components/forms";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description =
  "Shop owners can send a physical video game store for Video Game Shops. A person reads the note before it is listed.";

export const metadata: Metadata = {
  title: { absolute: `Add a shop | ${BRAND}` },
  description,
  alternates: { canonical: absoluteUrl("/submit") },
  openGraph: {
    title: `Add a shop | ${BRAND}`,
    description,
    url: absoluteUrl("/submit"),
    siteName: BRAND,
    type: "website",
  },
};

export default function SubmitPage() {
  return (
    <ArticlePage
      title="Add a shop"
      lede="This form is for a shop with a door and a street address. Name the shop, the street, the city, and a US state. Shops outside the United States should use the contact page and include the country. A person reads each note before a page is published."
    >
      <SubmitStoreForm />
    </ArticlePage>
  );
}
