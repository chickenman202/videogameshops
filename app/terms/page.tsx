import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

// Rendered per CDN miss so the proxy's Vary: Accept reaches the response; a prerender drops it.
export const dynamic = "force-dynamic";

const description = "Terms for using videogameshops, a directory of video game stores.";

export const metadata: Metadata = {
  title: { absolute: `Terms | ${BRAND}` },
  description,
  alternates: { canonical: absoluteUrl("/terms") },
  openGraph: { title: `Terms | ${BRAND}`, description, url: absoluteUrl("/terms"), siteName: BRAND, type: "website" },
};

export default function TermsPage() {
  return (
    <ArticlePage title="Terms">
      <div className="article-body">
        <p>
          videogameshops is a directory of shops you can walk into. Hours, stock, and phone numbers change, so call the
          shop before you go. Names like PlayStation, Xbox, and Nintendo belong to their owners. This site isn’t
          affiliated with them.
        </p>
        <p>
          A listing points you to a shop. It doesn’t mean a game is on the shelf, and we aren’t selling it. We can edit
          or decline a submission. A listing needs a real shop name and a street address.
        </p>
        <p>
          Shop data comes from <a href="https://www.openstreetmap.org/copyright" className="text-blue-ink underline underline-offset-4">© OpenStreetMap contributors</a> (available under the
          ODbL), Game-Route, Wikidata, and Dallas Retro Gamers.
        </p>
        <p>Questions about a listing go through the contact form.</p>
      </div>
    </ArticlePage>
  );
}
