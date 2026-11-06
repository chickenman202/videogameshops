import type { Metadata } from "next";
import { ArticlePage } from "@/components/article-page";
import { absoluteUrl } from "@/lib/jsonld";
import { BRAND } from "@/lib/site";

const description = "Terms for using Video Game Shops, a directory of physical video game stores.";

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
          Video Game Shops is a directory. Hours, stock, and phone numbers change. Check with the shop before you go.
          Platform names such as PlayStation, Xbox, and Nintendo belong to their owners. This site is not affiliated
          with them.
        </p>
        <p>
          A listing points to a shop. It is not a promise that a game is in stock, and it is not an offer to sell one.
          A submission can be edited or declined. A listing needs a real shop name and a street address.
        </p>
        <p>Use the contact form for questions about a listing. The directory is for finding physical video game shops.</p>
      </div>
    </ArticlePage>
  );
}
