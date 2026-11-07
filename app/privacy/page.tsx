import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description = "How videogameshops handles public shop listings and notes from the forms.";

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
          videogameshops publishes shop details that are already public: the name, street, phone, website, and hours,
          when we have them.
        </p>
        <p>
          The contact and submit forms ask for a name, an email, and a message so we can add or fix a listing. We keep
          those notes for that. We don’t sell them, and there’s no shopper account.
        </p>
        <p>Form notes aren’t sent to an ad network.</p>
      </div>
    </ArticlePage>
  );
}
