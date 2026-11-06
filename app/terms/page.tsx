import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: toTitle("Terms for the Video Game Store Directory"),
  description: toMetaDescription(
    "Terms for using the videogameshops directory of physical video game stores.",
  ),
  canonicalPath: "/terms",
});

export default function TermsPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Terms</h1>
        <div className="mt-8 space-y-4 text-lg leading-relaxed text-[#3c4550]">
          <p>
            videogameshops is a directory. Store hours, stock, and phone numbers can change. Check with the
            shop before you travel. Platform names such as PlayStation, Xbox, and Nintendo belong to their
            owners. This site is not affiliated with them.
          </p>
          <p>
            A listing is informational. It is not an offer to sell a game, and it is not a claim that every
            title is in stock. Submissions can be edited or declined. Keyboard-mash names are not published.
            A shop can be listed with a country even when the street, city, or map point was not saved.
          </p>
          <p>
            Do not use the site to scrape private data or to send the contact form messages that are not
            about a listing. The directory is for finding physical video game stores.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
