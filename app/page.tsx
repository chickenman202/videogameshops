import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { loadCatalog } from "@/lib/catalog";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";
import { homeJsonLd, JsonLd } from "@/lib/jsonld";
import { storePath } from "@/lib/paths";
import { BRAND, SITE_URL } from "@/lib/site";
import { shopCountryName, shopLocation, type ShopView } from "@/lib/shop-view";
import { US_STATES } from "@/lib/states";

const description = "Find video game stores you can walk into. Search by country, city, or shop name.";

// Rendered per CDN miss so the proxy's Vary: Accept reaches the response; a prerender drops it.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Video Game Stores Worldwide | ${BRAND}` },
  description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `Video Game Stores Worldwide | ${BRAND}`,
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
      <section className="overflow-hidden bg-stage text-paper">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-12">
          <div className="relative z-10 flex flex-col justify-between px-4 py-10 lg:col-span-5 lg:py-14 lg:pr-10">
            <div>
              <p className="kicker text-blue-mist">Worldwide</p>
              <h1 className="mt-8">
                <span className="block font-serif text-[1.65rem] leading-none font-normal text-silver italic sm:text-3xl">
                  video game
                </span>
                <span className="mt-2 block font-display text-[clamp(4.6rem,17vw,7.75rem)] leading-[0.76] font-bold tracking-[-0.045em] text-white uppercase">
                  shops
                </span>
              </h1>
              <span className="mt-5 block h-1 w-16 bg-blue" aria-hidden="true" />
              <p className="mt-6 max-w-sm font-serif text-lg leading-relaxed text-silver">{description}</p>
              {shops.length > 0 ? (
                <p className="mt-4 kicker text-blue-mist">
                  {shops.length.toLocaleString("en-US")} {shops.length === 1 ? "shop" : "shops"}
                </p>
              ) : null}
            </div>
          </div>
          {featured?.photo ? (
            <div className="relative lg:col-span-7">
              <figure className="relative aspect-[5/4] lg:absolute lg:inset-0 lg:aspect-auto">
                <img
                  src={featured.photo}
                  alt=""
                  width={1200}
                  height={900}
                  className="h-full w-full object-cover lg:absolute lg:inset-0"
                />
                <figcaption className="absolute bottom-4 left-4 max-w-[min(100%-2rem,22rem)] bg-silver px-3 py-2 text-ink sm:bottom-6 sm:left-6 lg:-left-6">
                  <span className="block font-serif text-lg leading-tight font-semibold break-words">
                    {featured.name}
                  </span>
                  {shopLocation(featured).line || shopLocation(featured).country ? (
                    <span className="mt-1 block font-mono text-xs tracking-wide text-ink-soft">
                      {[shopLocation(featured).line, shopLocation(featured).country].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </figcaption>
              </figure>
            </div>
          ) : (
            <div className="hidden border-l border-white/15 lg:col-span-7 lg:block" />
          )}
        </div>
        <form action="/directory" method="get" role="search" className="border-t border-white/15 bg-silver text-ink">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end">
            <div className="sm:w-44 sm:pb-2">
              <label htmlFor="home-lookup" className="kicker text-ink">
                Search the directory
              </label>
              <p id="home-lookup-hint" className="mt-1 text-sm text-ink-soft">
                City, country, or the name on the sign.
              </p>
            </div>
            <input
              id="home-lookup"
              name="q"
              placeholder="City, country, or shop name"
              autoComplete="off"
              aria-describedby="home-lookup-hint"
              className="min-h-11 w-full min-w-0 flex-1 border-0 border-b-2 border-ink bg-transparent px-0 font-serif text-lg text-ink placeholder:text-muted focus:border-blue-ink"
            />
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              Search
            </button>
          </div>
        </form>
      </section>

      {shops.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="place-index-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="place-index-heading" className="font-serif text-3xl font-normal text-ink italic">
              Shops
            </h2>
            <Link href="/directory" className="link">
              All stores
            </Link>
          </div>
          <div className="mt-5 hidden border-b border-ink pb-2 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)_10rem] sm:gap-6">
            <span className="kicker text-muted">Place</span>
            <span className="kicker text-muted">Shop</span>
            <span className="kicker text-right text-muted">Country</span>
          </div>
          <ol className="border-t border-ink sm:border-t-0">
            {shops.slice(0, 6).map((store) => {
              const place = shopLocation(store);
              return (
                <li key={store.id} className="border-b border-silver">
                  <Link
                    href={storePath(store.slug)}
                    className="group grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)_10rem] sm:items-baseline sm:gap-6 hover:bg-white"
                  >
                    {place.line ? (
                      <span className="font-mono text-xs tracking-wide text-blue-ink">{place.line}</span>
                    ) : (
                      <span />
                    )}
                    <span className="min-w-0 font-serif text-xl leading-snug font-semibold break-words text-ink group-hover:text-blue-ink-ink">
                      {store.displayName}
                    </span>
                    {place.country ? <span className="kicker text-muted sm:text-right">{place.country}</span> : <span />}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section id="countries" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-12">
        <h2 className="text-4xl text-ink uppercase sm:text-5xl">Cities and countries</h2>
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
                        className="flex min-h-12 items-baseline justify-between gap-3 py-2 hover:text-blue-ink"
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
                <h3 className="kicker text-muted">Countries</h3>
                <ul className="mt-3 border-t border-ink">
                  {countries.map((country) => (
                    <li key={country.name} className="border-b border-line">
                      <Link
                        href={`/directory?q=${encodeURIComponent(country.name)}`}
                        className="flex min-h-12 items-baseline justify-between gap-3 py-2 hover:text-blue-ink"
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
            <p className="text-ink-soft">No shops are listed yet.</p>
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
      </section>

      <section className="border-t border-ink bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-7">
            <p className="kicker text-blue-ink">Shop owners</p>
            <h2 className="mt-3 font-serif text-4xl font-normal text-ink italic sm:text-5xl">This shop is yours</h2>
            <p className="mt-3 max-w-xl text-lg text-ink-soft">
              If the shop is yours, send the name, the street, and the city. We’ll read it before the page goes up.
            </p>
          </div>
          <div className="sm:col-span-5 sm:text-right">
            <Link href="/submit" className="btn btn-primary">
              Add a store
            </Link>
          </div>
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
