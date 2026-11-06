import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog, type CatalogStore } from "@/lib/catalog";
import { shopRegionLabel, storeTitle, toMetaDescription } from "@/lib/copy";
import { WEEKDAYS } from "@/lib/hours";
import { breadcrumbJsonLd, JsonLd, storeCrumbs, storeJsonLd } from "@/lib/jsonld";
import { formatAddressLine, relatedInCity, storePlaceLinks } from "@/lib/links";
import { storeAbout } from "@/lib/listing";
import { platformCityPathFor, platformPath, storePath } from "@/lib/paths";
import { getPlatformByLabel } from "@/lib/platforms";
import { pageMetadata } from "@/lib/seo";
import { MIN_PLATFORM_CITY_STORES } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

const loadStore = cache(async function loadStore(slug: string): Promise<
  | { status: "ok"; store: CatalogStore; nearby: CatalogStore[]; catalog: CatalogStore[] }
  | { status: "missing" }
  | { status: "error" }
> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return { status: "error" };
  const store = catalog.stores.find((item) => item.slug === slug);
  if (!store) return { status: "missing" };
  return {
    status: "ok",
    store,
    nearby: relatedInCity(catalog.stores, store),
    catalog: catalog.stores,
  };
});

function platformHref(store: CatalogStore, label: string, stores: CatalogStore[]): string {
  const platform = getPlatformByLabel(label);
  if (!platform) return "/directory/platforms";
  const count = stores.filter(
    (item) =>
      item.countrySlug === store.countrySlug &&
      item.stateSlug === store.stateSlug &&
      item.citySlug === store.citySlug &&
      item.platforms.includes(platform.label),
  ).length;
  if (count >= MIN_PLATFORM_CITY_STORES) return platformCityPathFor(store, platform.slug);
  return platformPath(platform.slug);
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
  const title = storeTitle(
    store.name,
    store.city,
    shopRegionLabel(store),
    store.platforms,
  );
  const description = toMetaDescription(storeAbout(store));
  return pageMetadata({
    title,
    description,
    canonicalPath: storePath(store.slug),
    image: store.photo,
  });
}

export default async function StorePage(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params;
  const result = await loadStore(slug);
  if (result.status === "missing") notFound();
  if (result.status === "error") return <LoadError />;

  const { store, nearby, catalog } = result;
  const crumbs = storeCrumbs(store);
  const facts = [
    store.sellsNew ? "Sells new games" : null,
    store.sellsUsed ? "Sells used games" : null,
    store.tradeIns ? "Accepts trade-ins" : null,
    store.repairs ? "Repairs consoles" : null,
  ].filter((item): item is string => Boolean(item));
  const mapsQuery = encodeURIComponent(formatAddressLine(store));
  const places = storePlaceLinks(store);

  return (
    <PageShell>
      <JsonLd data={storeJsonLd(store)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs crumbs={crumbs.map((crumb) => ({ name: crumb.name, href: crumb.path }))} />
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {store.photo ? (
              <img
                src={store.photo}
                alt={store.name}
                width={960}
                height={540}
                loading="eager"
                fetchPriority="high"
                className="mb-6 h-64 w-full rounded-3xl object-cover"
              />
            ) : null}
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{store.name}</h1>
            <p className="mt-4 max-w-3xl text-lg text-[#3c4550]">{storeAbout(store)}</p>
            <dl className="mt-8 space-y-3 text-[#090b10]">
              <div>
                <dt className="text-sm text-muted">Address</dt>
                <dd>{formatAddressLine(store)}</dd>
              </div>
              {store.phone ? (
                <div>
                  <dt className="text-sm text-muted">Phone</dt>
                  <dd>
                    <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="text-[#155eef]">
                      Call {store.name} at {store.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {store.website ? (
                <div>
                  <dt className="text-sm text-muted">Website</dt>
                  <dd>
                    <a href={store.website} className="text-[#155eef]" rel="noopener noreferrer">
                      Official website of {store.name}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4">
              <a
                href={`https://maps.google.com/?q=${mapsQuery}`}
                className="text-sm font-medium text-[#155eef]"
                rel="noopener noreferrer"
              >
                Directions to {store.name}
              </a>
            </p>
            {store.platforms.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {store.platforms.map((platform) => (
                  <li key={platform}>
                    <a
                      href={platformHref(store, platform, catalog)}
                      className="inline-flex rounded-full border border-[#d5dbe3] bg-white px-3 py-1 text-sm hover:border-[#155eef]"
                    >
                      {platform} stores
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {facts.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {facts.map((fact) => (
                  <li key={fact} className="rounded-full border border-[#155eef] px-3 py-1 text-sm text-[#155eef]">
                    {fact}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <aside className="h-fit rounded-3xl border border-[#d5dbe3] bg-white p-5">
            <h2 className="text-lg font-semibold">Hours</h2>
            {store.hours ? (
              <table className="mt-4 w-full text-sm">
                <caption className="sr-only">Weekly hours for {store.name}</caption>
                <tbody>
                  {WEEKDAYS.map(([key, label]) => (
                    <tr key={key} className="border-t border-[#eef1f5]">
                      <th scope="row" className="py-2 pr-3 text-left font-medium">
                        {label}
                      </th>
                      <td className="py-2 text-[#3c4550]">{store.hours?.[key] ?? "Not listed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3 text-sm text-muted">Hours are not listed yet.</p>
            )}
          </aside>
        </div>
        <nav aria-label="Nearby" className="mt-12">
          <h2 className="text-2xl font-semibold">More video game stores</h2>
          <ul className="mt-4 space-y-2">
            {places.map((place) => (
              <li key={place.href}>
                <a href={place.href} className="text-[#155eef] hover:underline">
                  {place.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {nearby.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">Other stores in {store.city}</h2>
            <ul className="mt-4 space-y-2">
              {nearby.map((item) => (
                <li key={item.id}>
                  <a href={storePath(item.slug)} className="text-[#155eef] hover:underline">
                    {item.name} in {item.city}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </PageShell>
  );
}
