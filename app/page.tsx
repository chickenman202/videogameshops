import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PreviewNote } from "@/components/preview-note";
import { SearchForm } from "@/components/search-form";
import { StoreCard } from "@/components/store-card";
import { loadCatalog } from "@/lib/catalog";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";
import { homeJsonLd, JsonLd } from "@/lib/jsonld";
import { toMetaDescription } from "@/lib/copy";
import { BRAND, SITE_URL } from "@/lib/site";
import { shopCountryName, type ShopView } from "@/lib/shop-view";
import { US_STATES } from "@/lib/states";

const description = toMetaDescription(
  "Find physical video game shops near you. Compare hours, trade-ins, used games, retro stock, and which platforms each shop carries.",
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

export default async function HomePage() {
  const catalog = await loadCatalog();
  const preview = catalog.ok && catalog.stores.length === 0;
  const shops = catalog.ok ? (preview ? FIXTURE_SHOPS : catalog.stores) : [];
  const featured = shops.find((store) => store.photo) ?? shops[0];
  const rest = featured ? shops.filter((store) => store.id !== featured.id) : [];
  const states = US_STATES.map((state) => ({
    ...state,
    count: shops.filter((store) => store.stateSlug === state.slug).length,
  }))
    .filter((state) => state.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
  const countries = countryIndex(shops);

  return (
    <PageShell>
      <JsonLd data={homeJsonLd()} />
      <section className="bg-stage text-paper">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
          <p className="kicker text-signal">Near you</p>
          <h1 className="mt-4 max-w-5xl text-6xl uppercase leading-[0.84] text-paper sm:text-8xl">
            Video game stores you can walk into
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-paper/80">
            A worldwide guide to physical shops. Address, hours, and what they carry, when a listing actually has them.
          </p>
          {shops.length > 0 ? (
            <p className="mt-4 kicker text-paper">
              {preview
                ? `${shops.length.toLocaleString("en-US")} shops in this preview`
                : `${shops.length.toLocaleString("en-US")} shops`}
            </p>
          ) : null}
          {preview ? <PreviewNote onDark /> : null}
          <div className="mt-8 max-w-2xl">
            <SearchForm onDark label="Find a shop" hint="City, country, or shop name." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <h2 className="text-4xl uppercase text-ink sm:text-5xl">Places</h2>
        {featured ? (
          <div className="mt-6">
            <StoreCard store={featured} scale="feature" priority />
            {rest.length > 0 ? (
              <ul className="mt-2">
                {rest.map((store) => (
                  <li key={store.id}>
                    <StoreCard store={store} scale={store.photo ? "photo" : "row"} />
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-6">
              <Link href="/directory" className="link">
                All stores
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-6 border-t border-ink py-8">
            <p className="max-w-xl text-lg text-ink-soft">No shops are connected yet.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/directory" className="btn btn-primary">
                All stores
              </Link>
              <Link href="/submit" className="btn btn-ghost">
                Submit a store
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-4xl uppercase text-ink sm:text-5xl">Cities and countries</h2>
        {states.length > 0 || countries.length > 0 ? (
          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            {states.length > 0 ? (
              <div>
                <h3 className="kicker text-muted">States with shops</h3>
                <ul className="mt-3 border-t border-ink">
                  {states.map((state) => (
                    <li key={state.slug} className="border-b border-line">
                      <Link
                        href={`/directory/${state.slug}`}
                        className="flex min-h-12 items-baseline justify-between gap-3 py-2 hover:text-signal"
                      >
                        <span className="font-display text-2xl font-bold uppercase">{state.name}</span>
                        <span className="kicker text-muted">{state.count.toLocaleString("en-US")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  <Link href="/directory/states" className="link text-sm">
                    All states
                  </Link>
                </p>
              </div>
            ) : null}
            {countries.length > 0 ? (
              <div>
                <h3 className="kicker text-muted">Countries in this list</h3>
                <ul className="mt-3 border-t border-ink">
                  {countries.map((country) => (
                    <li key={country.name} className="border-b border-line">
                      <Link
                        href={`/directory?q=${encodeURIComponent(country.name)}`}
                        className="flex min-h-12 items-baseline justify-between gap-3 py-2 hover:text-signal"
                      >
                        <span className="font-display text-2xl font-bold uppercase">{country.name}</span>
                        <span className="kicker text-muted">{country.count.toLocaleString("en-US")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 border-t border-ink py-8">
            <p className="text-ink-soft">No city or country lists are ready yet.</p>
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
      </section>

      <section className="bg-stage text-paper">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h2 className="max-w-xl text-5xl uppercase">Own a shop?</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-paper/80">
            Send the address, hours, and platforms. A person checks the note before it goes on the public site.
          </p>
          <Link href="/submit" className="btn btn-light mt-6">
            Submit a store
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function countryIndex(shops: ShopView[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const store of shops) {
    const name = shopCountryName(store);
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}
