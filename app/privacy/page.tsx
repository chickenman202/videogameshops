import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: toTitle("Privacy for the Video Game Store Directory"),
  description: toMetaDescription(
    "How videogameshops handles store listings and messages sent through the contact and submit forms.",
  ),
  canonicalPath: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
        <div className="mt-8 space-y-4 text-lg leading-relaxed text-[#3c4550]">
          <p>
            videogameshops publishes public business details: store names, and the address, phone, website,
            hours, or platforms on file for each shop.
          </p>
          <p>
            The contact and submit forms ask for a name, an email, and a message so a listing can be added
            or corrected. Those notes are kept for review. They are not sold. Browsing the directory does
            not require an account.
          </p>
          <p>
            Messages from those forms are not sent to an ad network.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
