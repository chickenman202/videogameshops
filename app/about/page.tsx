import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { breadcrumbJsonLd, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

const description = toMetaDescription(
  "videogameshops is a worldwide directory of physical video game stores. Find shops by country, region, and city.",
);

export const metadata: Metadata = pageMetadata({
  title: toTitle("About the Video Game Store Directory"),
  description,
  canonicalPath: "/about",
});

export default function AboutPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ];
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="mx-auto max-w-3xl px-4 py-16">
        <Breadcrumbs crumbs={crumbs.map((crumb) => ({ name: crumb.name, href: crumb.path }))} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">About videogameshops</h1>
        <div className="mt-8 space-y-4 text-lg leading-relaxed text-[#3c4550]">
          <p>
            videogameshops is a worldwide directory of physical video game stores. It is not a game
            publisher, a chain, or a marketplace. A store page shows the place details on file for that shop.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">What a listing includes</h2>
          <p>
            A listing needs a shop name and a country. A missing street, city, region, or map point does not
            hide the shop. Phone, website, hours, and platforms are shown when the listing includes them.
            PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR are the platform names. New games, used
            games, trade-ins, and console repair appear only when the listing says so.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">Where the facts come from</h2>
          <p>
            Listings come from public business records and from store owners who submit or correct a page.
            A description that is too short, reads like a review, or only points at a website is replaced
            with a short sentence from the place details on file. Hours that cannot be read stay as text.
            The directory does not add a clock time, a phone number, or a street.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">How a store gets listed</h2>
          <p>
            Use the submit page with the store name and where it is. Submissions are reviewed before a page
            goes public. Names that are not shop names are left off. United States state and city pages use
            addresses like /directory/texas/austin. Other countries use /directory/countries, then the
            country code, the region, and the city. Each shop has one address under /store. The address
            includes the city when two shops share a name.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">How to fix a wrong listing</h2>
          <p>
            Use the contact page. Include the store name, the city, and what should change: the address, a
            phone number, a closed day, or a platform the shop does not carry. After the listing is updated,
            the public page refreshes within a day. A city page is published for search when that city has
            at least three stores. A town with one shop still keeps that store’s page.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
