import type { Metadata } from "next";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { countryEntries } from "@/lib/country-browse";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { absoluteUrl } from "@/lib/jsonld";
import { countryPath } from "@/lib/paths";
import { BRAND } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: toTitle("Video Game Stores by Country") },
  description: toMetaDescription(
    "Browse video game stores by country. Each country links to its shops, and busy regions have their own list.",
  ),
  alternates: { canonical: absoluteUrl("/directory/countries") },
};

export default async function CountriesPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const countries = countryEntries(catalog.stores);
  const total = countries.reduce((sum, country) => sum + country.count, 0);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">Video Game Stores by Country</h1>
        <p className="mt-4 text-lg text-muted">
          {total.toLocaleString("en-US")} video game {total === 1 ? "store" : "stores"} in{" "}
          {countries.length.toLocaleString("en-US")} {countries.length === 1 ? "country" : "countries"}. Each
          country uses its two-letter code in the address. The country name is shown on the page. A region gets its
          own page when it has at least three shops.
        </p>
        {countries.length > 0 ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => (
              <li key={country.code}>
                <a
                  href={countryPath(country.slug)}
                  className="flex items-center justify-between rounded-2xl border border-[#d5dbe3] bg-white px-4 py-3 hover:border-[#155eef]"
                >
                  <span className="font-medium">{country.name}</span>
                  <span className="text-sm text-muted">{country.count}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-[#3c4550]">No countries have a public store yet.</p>
        )}
        <p className="mt-8 text-sm text-muted">{BRAND}</p>
      </div>
    </PageShell>
  );
}
