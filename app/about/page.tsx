import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description =
  "Video Game Shops is a directory of physical video game stores. Search by country, region, and city.";

export const metadata: Metadata = {
  title: { absolute: `About | ${BRAND}` },
  description,
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: { title: `About | ${BRAND}`, description, url: absoluteUrl("/about"), siteName: BRAND, type: "website" },
};

export default function AboutPage() {
  return (
    <ArticlePage
      title="About"
      lede="Video Game Shops is a directory of physical video game stores. Find a shop by country, region, or city. The site is not a publisher, a chain, or a marketplace."
    >
      <div className="article-body">
        <h2>What a listing shows</h2>
        <p>
          A page shows the street, the place, and the country when those are stored. Phone, website, hours, and social
          links appear only when the listing has them. Platforms, new games, used games, trade-ins, and repair appear
          only when those facts are stored.
        </p>
        <h2>Where the facts come from</h2>
        <p>
          Listings come from public business records and from shop owners. If a shop has no description, the page does
          not write one. Hours that cannot be read stay as written. The site does not guess a closing time.
        </p>
        <h2>Add or correct a shop</h2>
        <p>
          Shop owners anywhere can add a store from the submit page. Include the country. Phone, website, and hours
          show on the public page only when a listing has them. Contact is for a correction or a question, not for a
          new shop.
        </p>
      </div>
    </ArticlePage>
  );
}
