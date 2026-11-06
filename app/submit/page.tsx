import type { Metadata } from "next";
import { SubmitStoreForm } from "@/components/forms";
import { PageShell } from "@/components/page-shell";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Submit a Store | ${BRAND}` },
  description:
    "Submit a physical video game store in the United States. Listings are reviewed before they are published.",
  alternates: { canonical: absoluteUrl("/submit") },
};

export default function SubmitPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Submit a store</h1>
        <p className="mt-4 text-lg text-[#3c4550]">
          This form is for a real shop with a street address in the United States. A closed business, a
          clothing brand, or a big-box store with no game counter should not be submitted. Submissions are
          reviewed before a public page is created.
        </p>
        <SubmitStoreForm />
      </article>
    </PageShell>
  );
}
