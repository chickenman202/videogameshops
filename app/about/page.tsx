import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { breadcrumbJsonLd, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

const description = toMetaDescription(
  "About videogameshops, a directory of physical video game stores by country, region, and city. See what a listing includes and how to correct one.",
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
            videogameshops is an independent directory of physical video game stores. It is not a game
            publisher, a chain, or a marketplace. A store page answers where the shop is, when it is open,
            and what you can buy or trade there.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">What a listing includes</h2>
          <p>
            Each public store shows the street address, city, region, postal code when we have it, phone, website,
            and weekly hours. It also shows the platforms the shop carries: PlayStation, Xbox, Nintendo, PC,
            handheld, retro, and VR. New games, used games, trade-ins, and console repair are separate
            yes-or-no facts. Retro is one of the platform tags, used the same way on every page.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">Where the facts come from</h2>
          <p>
            Hours and platforms come from public business listings and from store owners who submit or
            correct a page. If a stored description is too short to be a sentence, reads like a review, or
            only points at an official website, the page replaces it with two factual sentences built from
            the address and the shop’s facts. Hours that cannot be read stay on the page as text and are
            left out of the search-engine hours block. The site does not invent a clock time.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">How a store gets listed</h2>
          <p>
            Use the submit page with the store name, street address, city, and region. A person reviews the
            note before the store becomes a public page. Placeholder names and empty addresses are not
            published. United States state and city pages stay at addresses like /directory/texas/austin.
            Other countries use /directory/countries, then the country, the region, and the city. A shop
            keeps one address under /store, and the slug includes the city so two shops with the same name
            do not share a page.
          </p>
          <h2 className="pt-4 text-2xl font-semibold text-[#090b10]">How to fix a wrong listing</h2>
          <p>
            Use the contact page. Include the store name, the city, and what is wrong: the address, a phone
            number, a closed day, or a platform the shop does not carry. After the row is updated, the public
            page refreshes within a day. City roundup pages exist for every city that has a store, and they
            are filed for search only when that city has at least three stores. A one-store town still keeps
            its store page.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
