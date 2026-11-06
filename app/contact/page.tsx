import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { ContactForm } from "@/components/forms";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Contact | ${BRAND}` },
  description: "Contact videogameshops to correct a store address, hours, phone number, or platform list.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <ArticlePage
      title="Contact"
      lede="Send a correction for a store that is already listed, or a question about the directory. Include the store name and city so the right page can be updated."
    >
      <div className="mt-6 border-t border-ink pt-4 text-base text-ink-soft">
        <p className="font-bold text-ink">Helpful to include</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>The store name and city</li>
          <li>The address, phone, hours, or platform that needs a fix</li>
        </ul>
      </div>
      <ContactForm />
    </ArticlePage>
  );
}
