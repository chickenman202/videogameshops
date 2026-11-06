import type { Metadata } from "next";
import { SubmitStoreForm } from "@/components/forms";
import { PageShell } from "@/components/page-shell";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: toTitle("Submit a Video Game Store"),
  description: toMetaDescription(
    "Submit a physical video game store. Listings are reviewed before they are published.",
  ),
  canonicalPath: "/submit",
});

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
