import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description = "videogameshops lists video game stores you can walk into, by country and city.";

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
      lede="videogameshops is a directory of video game stores you can walk into. Search by country, city, or the name on the sign."
    >
      <div className="article-body">
        <h2>What a shop page shows</h2>
        <p>
          Street, city, and country when we have them. Phone, website, hours, and social links too. Platforms, new
          games, used games, trade-ins, and repair show up when the listing names them.
        </p>
        <h2>Where the details come from</h2>
        <p>
          Shop owners send listings, and we also use public business records. A description is the shop’s own words. If
          there aren’t any, the page leaves that space blank. Hours we can’t read stay as they were written.
        </p>
        <h2>Add a shop, or fix one</h2>
        <p>
          Own the counter? Add a store from anywhere, and include the country. Already listed, or just have a question?
          That’s what Contact is for.
        </p>
      </div>
    </ArticlePage>
  );
}
