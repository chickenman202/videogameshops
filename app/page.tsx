import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SearchForm } from "@/components/search-form";
import { loadCatalog } from "@/lib/catalog";
import { homeJsonLd, JsonLd } from "@/lib/jsonld";
import { platformPath } from "@/lib/paths";
import { PLATFORMS } from "@/lib/platforms";
import { toMetaDescription } from "@/lib/copy";
import { BRAND, SITE_URL } from "@/lib/site";
import { US_STATES } from "@/lib/states";

const description = toMetaDescription(
  "Find physical video game stores in the United States. Compare hours, trade-ins, used games, retro stock, and which platforms each shop carries.",
);

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: `Video Game Stores Near You | ${BRAND}` },
  description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `Video Game Stores Near You | ${BRAND}`,
    description,
    url: SITE_URL,
    siteName: BRAND,
    type: "website",
  },
};

const facts = [
  {
    title: "Hours you can read",
    body: "Weekly hours stay on the page. If a line cannot be read, it stays as text and is left out of the search-engine hours block.",
  },
  {
    title: "What the shop does",
    body: "New games, used games, trade-ins, and console repair are yes-or-no facts, not a guess from the store name.",
  },
  {
    title: "Platforms that match",
    body: "PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR only appear when that store actually carries them.",
  },
];

const questions = [
  {
    q: "Where do the hours and platforms come from?",
    a: "They come from public business listings and from store owners who submit or correct a page. The site does not invent hours.",
  },
  {
    q: "Why does a small city not have its own roundup?",
    a: "A city roundup is for places with at least three stores. A town with one shop still has that store’s own page.",
  },
  {
    q: "How do I fix a wrong address or hour?",
    a: "Use the contact page. Include the store name, the city, and the correction. Public pages refresh within a day after the listing is updated.",
  },
];

const platformNotes: Record<string, string> = {
  playstation: "Shops that carry PlayStation games",
  xbox: "Shops that carry Xbox games",
  nintendo: "Shops that carry Nintendo games",
  pc: "Shops that carry PC games",
  handheld: "Shops that carry handheld games",
  retro: "Shops tagged for retro games",
  vr: "Shops that carry VR games",
};

export default async function HomePage() {
  const catalog = await loadCatalog();
  const count = catalog.ok ? catalog.stores.length : null;
  const states = catalog.ok
    ? US_STATES.map((state) => ({
        ...state,
        count: catalog.stores.filter((store) => store.stateSlug === state.slug).length,
      }))
        .filter((state) => state.count > 0)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"))
    : [];

  return (
    <PageShell>
      <JsonLd data={homeJsonLd()} />
      <section className="border-b border-line bg-[linear-gradient(180deg,#fffdf8_0%,#f4efe6_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
          <p className="text-sm font-bold text-clay">United States</p>
          <h1 className="mt-3 max-w-3xl text-[2.15rem] leading-[1.08] text-balance text-ink sm:text-6xl">
            Video game stores near you
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Find a physical shop, see when it is open, and check whether it sells used games, takes trade-ins, or stocks retro.
          </p>
          <p className="mt-3 text-sm font-semibold text-muted">
            {count == null
              ? "The store count could not be loaded."
              : `${count.toLocaleString("en-US")} video game stores`}
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchForm />
            <p className="mt-3 text-sm text-ink-soft">
              Or browse{" "}
              <Link className="link" href="/directory">
                all stores
              </Link>
              ,{" "}
              <Link className="link" href="/directory/states">
                states
              </Link>
              , or{" "}
              <Link className="link" href="/directory/platforms">
                platforms
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <h2 className="text-3xl text-ink">Browse by platform</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Each list only includes shops that carry that platform.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORMS.map((platform) => (
            <Link
              key={platform.slug}
              href={platformPath(platform.slug)}
              className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-card hover:border-pine"
            >
              <span className="font-display text-xl font-semibold text-ink">{platform.label}</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {platformNotes[platform.slug] ?? `Shops that carry ${platform.label}`}
              </span>
              <span className="mt-4 text-sm font-bold text-pine">Browse</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <h2 className="text-3xl text-ink">What a listing tells you</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {facts.map((fact) => (
            <article key={fact.title} className="rounded-2xl border border-line bg-card p-5">
              <h3 className="text-xl text-ink">{fact.title}</h3>
              <p className="mt-3 text-ink-soft">{fact.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl text-ink">Browse by state</h2>
          <Link href="/directory/states" className="link inline-flex min-h-11 items-center text-sm">
            All states
          </Link>
        </div>
        {states.length > 0 ? (
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {states.slice(0, 12).map((state) => (
              <li key={state.slug}>
                <Link
                  href={`/directory/${state.slug}`}
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
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-ink-soft">State pages fill in as stores are added. The full list is on the states page.</p>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-3xl text-ink">Questions</h2>
        <div className="mt-4 space-y-3">
          {questions.map((item) => (
            <details key={item.q} className="faq rounded-2xl border border-line bg-card px-4 py-2 sm:px-5">
              <summary>{item.q}</summary>
              <p className="pb-3 leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-pine px-6 py-8 text-card sm:px-10 sm:py-10">
          <h2 className="max-w-xl text-3xl">Own a video game store?</h2>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-paper">
            Send the address, hours, and platforms. Listings are reviewed before they go on the public site.
          </p>
          <Link href="/submit" className="btn btn-light mt-6">
            Submit a store
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
