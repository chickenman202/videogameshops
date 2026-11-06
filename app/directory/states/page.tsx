import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { LoadError } from "@/components/load-error";
import { absoluteUrl } from "@/lib/jsonld";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { statePath } from "@/lib/paths";
import { BRAND } from "@/lib/site";
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
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">Video Game Stores by State</h1>
        <p className="mt-4 text-lg text-muted">
          {total.toLocaleString("en-US")} video game {total === 1 ? "store" : "stores"} in the United States.
        </p>
        {states.length > 0 ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {states.map((state) => (
              <li key={state.slug}>
                <a
                  href={statePath(state.slug)}
                  className="flex items-center justify-between rounded-2xl border border-[#d5dbe3] bg-white px-4 py-3 hover:border-[#155eef]"
                >
                  <span className="font-medium">{state.name}</span>
                  <span className="text-sm text-muted">{state.count}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-[#3c4550]">No states have a public store yet.</p>
        )}
        <p className="mt-8 text-sm text-muted">{BRAND}</p>
      </div>
    </PageShell>
  );
}
