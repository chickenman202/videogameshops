import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { SubmitStoreForm } from "@/components/forms";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Submit a Store | ${BRAND}` },
  description: "Submit a physical video game store in the United States. Listings are reviewed before they are published.",
  alternates: { canonical: absoluteUrl("/submit") },
};

export default function SubmitPage() {
  return (
    <ArticlePage
      title="Submit a store"
      lede="This form is for a real shop with a street address in the United States. A closed business, a clothing brand, or a big-box store with no game counter should not be submitted. Submissions are reviewed before a public page is created."
    >
      <SubmitStoreForm />
    </ArticlePage>
  );
}
