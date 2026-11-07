import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { countStoresByCountry } from "@/lib/country-browse";
import { LoadError } from "@/components/load-error";
import { absoluteUrl } from "@/lib/jsonld";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { countriesPath, statePath } from "@/lib/paths";
import { US_STATES } from "@/lib/states";

// Rendered per CDN miss so the proxy's Vary: Accept reaches the response; a prerender drops it.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: toTitle("Video Game Stores by State") },
  description: toMetaDescription(
    "Video game stores across the US, state by state.",
  ),
  alternates: { canonical: absoluteUrl("/directory/states") },
};

export default async function StatesPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const usStores = catalog.stores.filter((store) => store.country === "US");
  const states = US_STATES.map((state) => ({
    ...state,
    count: usStores.filter((store) => store.stateSlug === state.slug).length,
  })).filter((state) => state.count > 0);

  const outside = countStoresByCountry(catalog.stores).filter((country) => country.code !== "US");
  const outsideCount = outside.reduce((sum, country) => sum + country.count, 0);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Breadcrumbs
          crumbs={[{ name: "Home", href: "/" }, { name: "Stores", href: "/directory" }, { name: "States" }]}
        />
        <h1 className="mt-4 text-5xl uppercase text-ink sm:text-7xl">Video Game Stores by State</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-soft">
          Video game stores across the US, state by state.
          {outsideCount > 0 ? (
            <>
              {" "}
              Outside the US?{" "}
              <a href={countriesPath()} className="text-blue-ink underline-offset-4 hover:underline">
                Browse by country
              </a>
              .
            </>
          ) : null}
        </p>
        {states.length > 0 ? (
          <ul className="mt-8 border-t border-ink">
            {states.map((state) => (
              <li key={state.slug} className="border-b border-line">
                <a href={statePath(state.slug)} className="flex min-h-14 items-baseline justify-between gap-3 py-3 hover:text-blue-ink">
                  <span className="font-display text-3xl font-bold uppercase">{state.name}</span>
                  <span className="kicker text-muted">
                    {state.abbreviation}
                    <span className="sr-only">
                      , {state.count.toLocaleString("en-US")} stores
                    </span>
                    <span aria-hidden="true"> {state.count.toLocaleString("en-US")}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 border-t border-ink py-8">
            <p className="text-ink-soft">No states have shops yet.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/directory" className="btn btn-primary">
                All stores
              </Link>
              <Link href="/submit" className="btn btn-ghost">
                Add a store
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
