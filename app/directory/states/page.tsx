import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { LoadError } from "@/components/load-error";
import { absoluteUrl } from "@/lib/jsonld";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { statePath } from "@/lib/paths";
import { US_STATES } from "@/lib/states";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: toTitle("Video Game Stores by State") },
  description: toMetaDescription(
    "Browse video game stores by state. Each state links to its cities and shows how many shops are listed.",
  ),
  alternates: { canonical: absoluteUrl("/directory/states") },
};

export default async function StatesPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const states = US_STATES.map((state) => ({
    ...state,
    count: catalog.stores.filter((store) => store.stateSlug === state.slug).length,
  })).filter((state) => state.count > 0);

  const total = catalog.stores.length;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Breadcrumbs
          crumbs={[{ name: "Home", href: "/" }, { name: "Stores", href: "/directory" }, { name: "States" }]}
        />
        <h1 className="mt-4 text-3xl text-balance text-ink sm:text-5xl">Video Game Stores by State</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-soft">
          {total.toLocaleString("en-US")} video game {total === 1 ? "store" : "stores"} in the United States.
        </p>
        {states.length > 0 ? (
          <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {states.map((state) => (
              <li key={state.slug}>
                <a
                  href={statePath(state.slug)}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 py-2 hover:border-pine"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-pine-soft text-xs font-bold text-pine">
                      {state.abbreviation}
                    </span>
                    <span className="font-semibold text-ink">{state.name}</span>
                  </span>
                  <span className="text-sm text-muted">
                    {state.count.toLocaleString("en-US")}
                    <span className="sr-only"> stores</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-line bg-card px-5 py-8 text-ink-soft">
            No states have a public store yet.
          </p>
        )}
      </div>
    </PageShell>
  );
}
