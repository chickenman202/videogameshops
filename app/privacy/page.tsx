import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Privacy | ${BRAND}` },
  description: "How videogameshops handles store listings and messages sent through the contact form.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
        <div className="mt-8 space-y-4 text-lg leading-relaxed text-[#3c4550]">
          <p>
            videogameshops publishes information about businesses: store names, street addresses, phone
            numbers, websites, hours, and what those shops sell. That information is meant to be public.
          </p>
          <p>
            The contact and submit forms ask for a name, an email, and a message so a listing can be added
            or fixed. Those notes are stored for review. They are not sold. There are no customer accounts
            in this version of the site.
          </p>
          <p>
            Analytics and search-console verification are added only when the site owner supplies the ids.
            Nothing in this version sends store-form data to an ad network.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
