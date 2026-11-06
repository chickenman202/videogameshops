import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PreviewNote } from "@/components/preview-note";
import { loadCatalog } from "@/lib/catalog";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";
import { homeJsonLd, JsonLd } from "@/lib/jsonld";
import { storePath } from "@/lib/paths";
import { BRAND, SITE_URL } from "@/lib/site";
import { shopCountryName, shopLocation, type ShopView } from "@/lib/shop-view";
import { US_STATES } from "@/lib/states";

const description =
  "A worldwide guide to physical shops. Address, hours, and what they carry, when a listing actually has them.";

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
      <section className="overflow-hidden border-b border-silver bg-white">
        <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 pt-8 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7">
            <p className="kicker text-blue">Worldwide index</p>
            <h1 className="mt-2 font-display text-[22vw] leading-[0.76] font-bold uppercase text-ink sm:text-8xl lg:text-[7.4rem]">
              Video
              <br />
              game
              <br />
              shops
            </h1>
          </div>
          {featured?.photo ? (
            <figure className="relative z-20 border-8 border-white bg-silver lg:col-span-5 lg:-ml-28 lg:mt-8">
              <img
                src={featured.photo}
                alt=""
                width={960}
                height={720}
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="bg-blue px-3 py-2 font-mono text-xs uppercase tracking-wide text-white">
                {featured.name}
                {shopLocation(featured).line ? ` · ${shopLocation(featured).line}` : ""}
              </figcaption>
            </figure>
          ) : null}
        </div>
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-10">
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            A worldwide guide to physical shops. Address, hours, and what they carry, when a listing actually has them.
          </p>
          {shops.length > 0 ? (
            <p className="mt-3 kicker text-muted">
              {preview
                ? `${shops.length.toLocaleString("en-US")} shops in this preview`
                : `${shops.length.toLocaleString("en-US")} shops`}
            </p>
          ) : null}
          {preview ? <PreviewNote /> : null}
          <ol className="mt-8 border-t-2 border-ink">
            <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 border-b border-silver py-4">
              <span className="pt-3 font-mono text-sm text-blue">00</span>
              <form action="/directory" method="get" role="search">
                <label htmlFor="home-lookup" className="kicker text-ink">
                  Look up a shop
                </label>
                <p id="home-lookup-hint" className="mt-1 text-sm text-muted">
                  City, country, or shop name.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="home-lookup"
                    name="q"
                    placeholder="City, country, or shop name"
                    autoComplete="off"
                    aria-describedby="home-lookup-hint"
                    className="field min-w-0 flex-1"
                  />
                  <button type="submit" className="btn btn-primary w-full sm:w-auto">
                    Search
                  </button>
                </div>
              </form>
            </li>
            {shops.slice(0, 6).map((store, index) => {
              const place = shopLocation(store);
              return (
                <li key={store.id} className="border-b border-silver">
                  <Link
                    href={storePath(store.slug)}
                    className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 py-4 hover:bg-background"
                  >
                    <span className="font-mono text-sm text-blue">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="block font-display text-3xl leading-[0.95] font-bold uppercase break-words text-ink">
                        {store.name}
                      </span>
                      {place.line || place.country ? (
                        <span className="mt-1 block font-mono text-xs uppercase tracking-wide text-muted">
                          {[place.line, place.country].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="mt-4">
            <Link href="/directory" className="link">
              All stores
            </Link>
          </p>
        </div>
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
                        className="flex min-h-12 items-baseline justify-between gap-3 py-2 hover:text-blue"
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
                        className="flex min-h-12 items-baseline justify-between gap-3 py-2 hover:text-blue"
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

      <section className="border-t border-silver bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
          <p className="font-mono text-sm text-blue">ADD</p>
          <div>
            <h2 className="text-4xl uppercase text-ink">Own a shop?</h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Send the address, hours, and platforms. A person checks the note before it goes on the public site.
            </p>
          </div>
          <Link href="/submit" className="btn btn-primary w-full sm:w-auto">
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
