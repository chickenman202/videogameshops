import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { LoadError } from "@/components/load-error";
import { breadcrumbJsonLd, JsonLd, placeListJsonLd } from "@/lib/jsonld";
import { toMetaDescription, toTitle } from "@/lib/copy";
import { countryPath, statePath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";
import { US_STATES } from "@/lib/states";

export const revalidate = 86400;

const title = toTitle("Video Game Stores by State");
const description = toMetaDescription(
  "Browse video game stores in the United States by state. Each state links to its cities and shows how many shops are listed.",
);

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await loadCatalog();
  const count = catalog.ok
    ? catalog.stores.filter((store) => store.countryCode === "US").length
    : 0;
  return pageMetadata({
    title,
    description,
    canonicalPath: "/directory/states",
    index: count > 0,
  });
}

export default async function StatesPage() {
  const catalog = await loadCatalog();
  if (!catalog.ok) return <LoadError />;

  const states = US_STATES.map((state) => ({
    ...state,
    count: catalog.stores.filter((store) => store.countryCode === "US" && store.stateSlug === state.slug)
      .length,
  })).filter((state) => state.count > 0);

  const total = catalog.stores.filter((store) => store.countryCode === "US").length;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "United States", path: countryPath("us") },
    { name: "States", path: "/directory/states" },
  ];

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={placeListJsonLd({
          name: "Video Game Stores by State",
          path: "/directory/states",
          places: states.map((state) => ({ name: state.name, path: statePath(state.slug) })),
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Breadcrumbs crumbs={crumbs.map((crumb) => ({ name: crumb.name, href: crumb.path }))} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Video Game Stores by State</h1>
        <p className="mt-4 text-lg text-muted">
          {total.toLocaleString("en-US")} video game {total === 1 ? "store" : "stores"} in the United States.
          Other countries are on the{" "}
          <a href="/directory/countries" className="font-medium text-[#155eef] hover:underline">
            country list
          </a>
          .
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
          <p className="mt-8 text-[#3c4550]">No states are listed.</p>
        )}
      </div>
    </PageShell>
  );
}
