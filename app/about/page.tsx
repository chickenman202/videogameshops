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
      lede="videogameshops is a directory of video game stores you can walk into. Search by country, city, or shop name."
    >
      <div className="article-body">
        <h2>What a shop page shows</h2>
        <p>
          You’ll usually see the street, the city, and the country, along with a phone, website, or hours when we have them.
          We show what we know about each shop. If something’s missing or out of date, let us know.
        </p>
        <h2>Where the details come from</h2>
        <p>
          Shop owners tell us about their shops, and we also use public business records. When a shop wrote its own
          description, that’s the one on the page.
        </p>
        <h2>Add a shop, or fix one</h2>
        <p>
          Own a game shop? Add a store from anywhere, and include the country. If it’s already listed, or you just
          have a question, Contact is the place.
        </p>
      </div>
    </ArticlePage>
  );
}
