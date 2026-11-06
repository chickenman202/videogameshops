import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Terms | ${BRAND}` },
  description: "Terms for using the videogameshops directory of physical video game stores.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <ArticlePage title="Terms">
      <div className="article-body">
        <p>
          videogameshops is a directory. Store hours, stock, and phone numbers can change. Check with the shop before
          you travel. Platform names such as PlayStation, Xbox, and Nintendo belong to their owners. This site is not
          affiliated with them.
        </p>
        <p>
          A listing is informational. It is not an offer to sell a game, and it is not a claim that every title is in
          stock. Submissions can be edited or declined. Placeholder names and empty addresses are not published.
        </p>
        <p>
          Do not use the site to scrape private data or to send the contact form messages that are not about a
          listing. The directory is for finding physical video game shops.
        </p>
      </div>
    </ArticlePage>
  );
}
