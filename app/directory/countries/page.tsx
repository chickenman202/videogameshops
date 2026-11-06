import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { breadcrumbJsonLd, JsonLd, placeListJsonLd } from "@/lib/jsonld";
import { countryLinks } from "@/lib/links";
import { countriesPath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

const title = toTitle("Video Game Stores by Country");
const description = toMetaDescription(
  "Browse video game stores by country. Each country links to its regions, cities, and shops.",
);

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await loadCatalog();
  const count = catalog.ok ? catalog.stores.length : 0;
  return pageMetadata({
    title,
    description,
    canonicalPath: countriesPath(),
    index: count > 0,
  });
}

export default async function CountriesPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const countries = countryLinks(catalog.stores);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Countries", path: countriesPath() },
  ];

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={placeListJsonLd({
          name: "Video Game Stores by Country",
          path: countriesPath(),
          places: countries.map((country) => ({ name: country.name, path: country.href })),
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Breadcrumbs crumbs={crumbs.map((crumb) => ({ name: crumb.name, href: crumb.path }))} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Video Game Stores by Country</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">
          {catalog.stores.length.toLocaleString("en-US")} video game{" "}
          {catalog.stores.length === 1 ? "store" : "stores"} with a published page. Pick a country to see its
          regions and cities.
        </p>
        {countries.length > 0 ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => (
              <li key={country.slug}>
                <a
                  href={country.href}
                  className="flex items-center justify-between rounded-2xl border border-[#d5dbe3] bg-white px-4 py-3 hover:border-[#155eef]"
                >
                  <span className="font-medium">Video game stores in {country.name}</span>
                  <span className="text-sm text-muted">{country.count}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-[#3c4550]">Country pages appear when a country has a public store.</p>
        )}
      </div>
    </PageShell>
  );
}
