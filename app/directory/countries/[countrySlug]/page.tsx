import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { countryStoresTitle, toMetaDescription, toTitle } from "@/lib/copy";
import { loadCountryPage } from "@/lib/country-page";
import { breadcrumbJsonLd, JsonLd, placeListJsonLd } from "@/lib/jsonld";
import { countriesPath, countryPath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type CountryProps = {
  params: Promise<{ countrySlug: string }>;
};

export async function generateMetadata(props: CountryProps): Promise<Metadata> {
  const { countrySlug } = await props.params;
  const result = await loadCountryPage(countrySlug);
  if (result.status === "redirect") {
    return { robots: { index: false, follow: false } };
  }
  if (result.status !== "ok") {
    return {
      title: { absolute: result.status === "not-found" ? "Page Not Found" : "Directory unavailable" },
      robots: { index: false, follow: result.status !== "not-found" },
    };
  }
  const { page } = result;
  const h1 = countryStoresTitle(page.countryName);
  return pageMetadata({
    title: toTitle(h1),
    description: toMetaDescription(
      `${page.total.toLocaleString("en-US")} video game ${page.total === 1 ? "store" : "stores"} in ${page.countryName}. Browse regions and cities with published shops.`,
    ),
    canonicalPath: countryPath(page.countrySlug),
    index: page.total > 0,
  });
}

export default async function CountryPage(props: CountryProps) {
  const { countrySlug } = await props.params;
  const result = await loadCountryPage(countrySlug);
  if (result.status === "redirect") permanentRedirect(result.href);
  if (result.status === "not-found") notFound();
  if (result.status === "error") return <LoadError />;

  const { page } = result;
  const h1 = countryStoresTitle(page.countryName);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Countries", path: countriesPath() },
    { name: page.countryName, path: countryPath(page.countrySlug) },
  ];

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={placeListJsonLd({
          name: h1,
          path: countryPath(page.countrySlug),
          places: page.regions.map((region) => ({ name: region.name, path: region.href })),
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Breadcrumbs crumbs={crumbs.map((crumb) => ({ name: crumb.name, href: crumb.path }))} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{h1}</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">
          {page.total.toLocaleString("en-US")} video game {page.total === 1 ? "store" : "stores"} in{" "}
          {page.countryName}. Open a region to see its cities and shops.
        </p>
        {page.countryCode === "US" ? (
          <p className="mt-3 text-sm text-[#3c4550]">
            State and city pages keep their current addresses under /directory. The full list is on the{" "}
            <a href="/directory/states" className="font-medium text-[#155eef] hover:underline">
              United States states page
            </a>
            .
          </p>
        ) : null}
        {page.regions.length === 0 ? (
          <p className="mt-8 text-[#3c4550]">No public stores are listed in {page.countryName} yet.</p>
        ) : null}
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {page.regions.map((region) => (
            <li key={region.slug}>
              <a
                href={region.href}
                className="flex items-center justify-between rounded-2xl border border-[#d5dbe3] bg-white px-4 py-3 hover:border-[#155eef]"
              >
                <span className="font-medium">Video game stores in {region.name}</span>
                <span className="text-sm text-muted">{region.count}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
