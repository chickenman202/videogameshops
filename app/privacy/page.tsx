import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description = "How Video Game Shops handles public shop listings and notes sent through the contact form.";

export const metadata: Metadata = {
  title: { absolute: `Privacy | ${BRAND}` },
  description,
  alternates: { canonical: absoluteUrl("/privacy") },
  openGraph: {
    title: `Privacy | ${BRAND}`,
    description,
    url: absoluteUrl("/privacy"),
    siteName: BRAND,
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <ArticlePage title="Privacy">
      <div className="article-body">
        <p>
          Video Game Shops publishes business facts: shop names, streets, phone numbers, websites, and hours, when a
          listing has them. Those facts are meant to be public.
        </p>
        <p>
          The contact and submit forms ask for a name, an email, and a message so a listing can be added or corrected.
          Those notes are kept for review. They are not sold. The site has no shopper accounts.
        </p>
        <p>Notes from the forms are not sent to an ad network.</p>
      </div>
    </ArticlePage>
  );
}
