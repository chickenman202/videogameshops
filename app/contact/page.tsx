import type { Metadata } from "next";
import { ContactForm } from "@/components/forms";
import { PageShell } from "@/components/page-shell";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: toTitle("Contact the Video Game Store Directory"),
  description: toMetaDescription(
    "Contact videogameshops to correct a store address, hours, phone number, or platform list.",
  ),
  canonicalPath: "/contact",
});

export default function ContactPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
        <p className="mt-4 text-lg text-[#3c4550]">
          Send a correction for a store that is already listed, or a question about the directory. Include
          the store name and city so the right page can be updated.
        </p>
        <ContactForm />
      </article>
    </PageShell>
  );
}
