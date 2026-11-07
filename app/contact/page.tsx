import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { ContactForm } from "@/components/forms";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description = "Tell videogameshops about a wrong hour, a closed shop, or a missing street.";

export const metadata: Metadata = {
  title: { absolute: `Contact | ${BRAND}` },
  description,
  alternates: { canonical: absoluteUrl("/contact") },
  openGraph: { title: `Contact | ${BRAND}`, description, url: absoluteUrl("/contact"), siteName: BRAND, type: "website" },
};

export default function ContactPage() {
  return (
    <ArticlePage
      title="Contact"
      lede="Wrong hours, a shop that closed, or a street we missed? Send a note and we’ll take a look."
    >
      <div className="mt-6 border-t border-ink pt-4 text-base text-ink-soft">
        <p className="font-bold text-ink">Include</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>The shop name</li>
          <li>The city and country</li>
          <li>What’s off: the street, the hours, the phone, or a platform</li>
        </ul>
      </div>
      <ContactForm />
    </ArticlePage>
  );
}
