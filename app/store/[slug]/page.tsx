import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { StoreCard } from "@/components/store-card";
import { loadCatalog, type CatalogStore } from "@/lib/catalog";
import { storeTitle, toMetaDescription } from "@/lib/copy";
import { WEEKDAYS } from "@/lib/hours";
import { absoluteUrl, breadcrumbJsonLd, JsonLd, storeCrumbs, storeJsonLd } from "@/lib/jsonld";
import { storeAbout } from "@/lib/listing";
import { cityPath, statePath, storePath } from "@/lib/paths";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

async function loadStore(slug: string): Promise<
  | { status: "ok"; store: CatalogStore; nearby: CatalogStore[] }
  | { status: "missing" }
  | { status: "error" }
> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return { status: "error" };
  const store = catalog.stores.find((item) => item.slug === slug);
  if (!store) return { status: "missing" };
  const nearby = catalog.stores
    .filter(
      (item) =>
        item.id !== store.id &&
        item.stateSlug === store.stateSlug &&
        item.citySlug === store.citySlug,
    )
    .slice(0, 4);
  return { status: "ok", store, nearby };
}

export async function generateMetadata(props: PageProps<"/store/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const result = await loadStore(slug);
  if (result.status === "missing") {
    return {
      title: { absolute: "Page Not Found" },
      robots: { index: false, follow: false },
    };
  }
  if (result.status === "error") {
    return {
      title: { absolute: "Directory unavailable" },
      robots: { index: false, follow: true },
    };
  }
  const { store } = result;
  const title = storeTitle(store.name, store.city, store.stateAbbr, store.platforms);
  const description = toMetaDescription(storeAbout(store));
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(storePath(store.slug)) },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl(storePath(store.slug)),
      siteName: "videogameshops",
      type: "website",
    },
  };
}

export default async function StorePage(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params;
  const result = await loadStore(slug);
  if (result.status === "missing") notFound();
  if (result.status === "error") return <LoadError />;

  const { store, nearby } = result;
  const crumbs = storeCrumbs(store, {
    slug: store.stateSlug,
    name: store.state,
    abbreviation: store.stateAbbr,
  });
  const facts = [
    store.sellsNew ? "Sells new games" : null,
    store.sellsUsed ? "Sells used games" : null,
    store.tradeIns ? "Accepts trade-ins" : null,
    store.repairs ? "Repairs consoles" : null,
  ].filter((item): item is string => Boolean(item));
  const mapsQuery = encodeURIComponent(
    `${store.address}, ${store.city}, ${store.stateAbbr}${store.zip ? ` ${store.zip}` : ""}`,
  );

  const phoneHref = store.phone ? `tel:${store.phone.replace(/[^\d+]/g, "")}` : null;
  const websiteLabel = store.website ? store.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return (
    <PageShell>
      <JsonLd data={storeJsonLd(store)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Breadcrumbs
          crumbs={[
            { name: "Home", href: "/" },
            { name: "Stores", href: "/directory" },
            { name: store.state, href: statePath(store.stateSlug) },
            { name: store.city, href: cityPath(store.stateSlug, store.citySlug) },
            { name: store.name },
          ]}
        />
        {store.photo ? (
          <img
            src={store.photo}
            alt=""
            width={1200}
            height={675}
            loading="eager"
            fetchPriority="high"
            className="mt-6 aspect-video max-h-80 w-full rounded-2xl object-cover"
          />
        ) : null}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <header className="min-w-0 lg:col-start-1 lg:row-start-1">
            <p className="text-sm font-bold text-clay">
              {store.city}, {store.state}
            </p>
            <h1 className="mt-2 text-4xl text-balance text-ink sm:text-5xl">{store.name}</h1>
          </header>
          <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <section className="rounded-2xl border border-line bg-card p-5 shadow-card" aria-labelledby="visit-heading">
              <h2 id="visit-heading" className="text-2xl text-ink">
                Visit
              </h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-bold text-muted">Address</dt>
                  <dd className="mt-1 text-base leading-relaxed text-ink">
                    {store.address}
                    <br />
                    {store.city}, {store.stateAbbr}
                    {store.zip ? ` ${store.zip}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold text-muted">Phone</dt>
                  <dd className="mt-1">
                    {phoneHref && store.phone ? (
                      <a href={phoneHref} className="text-lg font-bold text-pine underline decoration-pine/30 underline-offset-4">
                        {store.phone}
                      </a>
                    ) : (
                      <span className="text-ink-soft">Not listed yet</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold text-muted">Website</dt>
                  <dd className="mt-1">
                    {store.website && websiteLabel ? (
                      <a
                        href={store.website}
                        className="link break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {websiteLabel}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="text-ink-soft">Not listed yet</span>
                    )}
                  </dd>
                </div>
              </dl>
              <a
                href={`https://maps.google.com/?q=${mapsQuery}`}
                className="btn btn-primary mt-5 w-full"
                target="_blank"
                rel="noopener noreferrer"
              >
                Directions
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </section>
            <section className="rounded-2xl border border-line bg-card p-5 shadow-card" aria-labelledby="hours-heading">
              <h2 id="hours-heading" className="text-2xl text-ink">
                Hours
              </h2>
              {store.hours ? (
                <table className="mt-4 w-full text-sm">
                  <caption className="sr-only">Weekly hours for {store.name}</caption>
                  <tbody>
                    {WEEKDAYS.map(([key, label]) => {
                      const value = store.hours?.[key] ?? "Not listed";
                      const quiet = value === "Not listed" || /closed/i.test(value);
                      return (
                        <tr key={key} className="border-t border-line">
                          <th scope="row" className="py-2.5 pr-3 text-left font-semibold text-ink">
                            {label}
                          </th>
                          <td className={quiet ? "py-2.5 text-right text-muted" : "py-2.5 text-right text-ink"}>
                            {value}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="mt-3 text-sm text-muted">Hours are not listed yet.</p>
              )}
            </section>
          </aside>
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <p className="max-w-3xl text-lg leading-relaxed text-ink-soft">{storeAbout(store)}</p>
            {store.platforms.length > 0 || facts.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-2xl text-ink">What they carry</h2>
                {store.platforms.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {store.platforms.map((platform) => (
                      <li key={platform} className="rounded-full bg-paper-deep px-3 py-1 text-sm font-semibold text-ink">
                        {platform}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {facts.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {facts.map((fact) => (
                      <li key={fact} className="rounded-full bg-pine-soft px-3 py-1 text-sm font-semibold text-pine">
                        {fact}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            <p className="mt-8 text-sm text-muted">
              Something wrong on this page?{" "}
              <Link className="link" href="/contact">
                Send a correction
              </Link>
            </p>
          </div>
        </div>
        {nearby.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-2xl text-ink">Other stores in {store.city}</h2>
            <ul className="mt-4 space-y-3">
              {nearby.map((item) => (
                <li key={item.id}>
                  <StoreCard store={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </PageShell>
  );
}
