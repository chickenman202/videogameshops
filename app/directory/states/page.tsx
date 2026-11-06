import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { LoadError } from "@/components/load-error";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";
import { absoluteUrl } from "@/lib/jsonld";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { statePath } from "@/lib/paths";
import { US_STATES } from "@/lib/states";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: toTitle("Video Game Stores by State") },
  description: toMetaDescription(
    "United States shops, filed by state. Open a state to see its cities and the shops listed there.",
  ),
  alternates: { canonical: absoluteUrl("/directory/states") },
};

export default async function StatesPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const preview = catalog.stores.length === 0;
  const shops = preview ? FIXTURE_SHOPS : catalog.stores;
  const states = US_STATES.map((state) => ({
    ...state,
    count: shops.filter((store) => store.stateSlug === state.slug).length,
  })).filter((state) => state.count > 0);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Breadcrumbs
          crumbs={[{ name: "Home", href: "/" }, { name: "Stores", href: "/directory" }, { name: "States" }]}
        />
        <h1 className="mt-4 text-5xl uppercase text-ink sm:text-7xl">Video Game Stores by State</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-soft">
          United States shops, filed by state. The number is how many shops are listed there.
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
            <p className="text-ink-soft">No states have shops listed.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/directory" className="btn btn-primary">
                All stores
              </Link>
              <Link href="/submit" className="btn btn-ghost">
                Submit a store
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
