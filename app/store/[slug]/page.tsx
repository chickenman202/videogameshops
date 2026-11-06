import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { loadCatalog, type CatalogStore } from "@/lib/catalog";
import { countryBrowse } from "@/lib/countries";
import { storeTitle, toMetaDescription } from "@/lib/copy";
import { WEEKDAYS } from "@/lib/hours";
import { absoluteUrl, breadcrumbJsonLd, JsonLd, storeCrumbs, storeJsonLd } from "@/lib/jsonld";
import { storeAbout, type Crumb } from "@/lib/listing";
import { formatStorePlace, linkLabel } from "@/lib/place";
import { cityPath, statePath, storePath } from "@/lib/paths";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

async function loadStore(slug: string): Promise<
  | {
      status: "ok";
      store: CatalogStore;
      nearby: CatalogStore[];
      browse: ReturnType<typeof countryBrowse>;
    }
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
        item.citySlug !== "" &&
        item.citySlug === store.citySlug &&
        item.country === store.country &&
        item.state === store.state,
    )
    .slice(0, 4);
  return { status: "ok", store, nearby, browse: countryBrowse(store, catalog.stores) };
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
    store.city || store.countryName || "Shop",
    store.country === "US" ? store.stateAbbr : store.country,
    store.platforms,
  );
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

  const { store, nearby, browse } = result;
  const crumbs = storeCrumbs(store, store.stateSlug ? undefined : browse);
  const place = formatStorePlace(store);
  const directions = store.lat != null && store.lng != null
    ? `https://maps.google.com/?q=${store.lat},${store.lng}`
    : place
      ? `https://maps.google.com/?q=${encodeURIComponent(place)}`
      : null;
  const links = [
    store.website ? { label: "Website", href: store.website } : null,
    store.facebook ? { label: "Facebook", href: store.facebook } : null,
    store.instagram ? { label: "Instagram", href: store.instagram } : null,
    store.twitter ? { label: "X", href: store.twitter } : null,
    ...store.otherSocials.map((href) => ({ label: linkLabel(href), href })),
  ].filter((item): item is { label: string; href: string } => Boolean(item));
  const facts = [
    store.sellsNew ? "Sells new games" : null,
    store.sellsUsed ? "Sells used games" : null,
    store.tradeIns ? "Accepts trade-ins" : null,
    store.repairs ? "Repairs consoles" : null,
  ].filter((item): item is string => Boolean(item));
  const pageCrumbs: Crumb[] = [
    { name: "Home", href: "/" },
    { name: "Stores", href: "/directory" },
  ];
  if (store.stateSlug) {
    pageCrumbs.push({ name: store.state, href: statePath(store.stateSlug) });
    if (store.city && store.citySlug) {
      pageCrumbs.push({ name: store.city, href: cityPath(store.stateSlug, store.citySlug) });
    }
  } else {
    if (browse.country) pageCrumbs.push({ name: browse.country.name, href: browse.country.href });
    else if (store.countryName) pageCrumbs.push({ name: store.countryName });
    if (browse.region) pageCrumbs.push({ name: browse.region.name, href: browse.region.href });
    else if (store.state) pageCrumbs.push({ name: store.state });
    if (store.city) pageCrumbs.push({ name: store.city });
  }
  pageCrumbs.push({ name: store.name });

  return (
    <PageShell>
      <JsonLd data={storeJsonLd(store)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs crumbs={pageCrumbs} />
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
            {store.brand && store.brand.toLowerCase() !== store.name.toLowerCase() ? (
              <p className="mt-2 text-sm text-muted">{store.brand}</p>
            ) : null}
            <p className="mt-4 max-w-3xl text-lg text-[#3c4550]">{storeAbout(store)}</p>
            {store.details ? <p className="mt-3 max-w-3xl text-[#3c4550]">{store.details}</p> : null}
            <dl className="mt-8 space-y-3 text-[#090b10]">
              {place ? (
                <div>
                  <dt className="text-sm text-muted">Address</dt>
                  <dd>{place}</dd>
                </div>
              ) : null}
              {store.phone ? (
                <div>
                  <dt className="text-sm text-muted">Phone</dt>
                  <dd>
                    <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="text-[#155eef]">
                      {store.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {links.map((link) => (
                <div key={link.href}>
                  <dt className="text-sm text-muted">{link.label}</dt>
                  <dd>
                    <a href={link.href} className="text-[#155eef]" rel="noopener noreferrer">
                      {link.href.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              ))}
              {store.sourceLabel ? (
                <div>
                  <dt className="text-sm text-muted">Source</dt>
                  <dd>
                    {store.sourceUrl ? (
                      <a href={store.sourceUrl} className="text-[#155eef]" rel="noopener noreferrer">
                        {store.sourceLabel}
                      </a>
                    ) : (
                      store.sourceLabel
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
            {directions ? (
              <p className="mt-4">
                <a href={directions} className="text-sm font-medium text-[#155eef]" rel="noopener noreferrer">
                  Directions
                </a>
              </p>
            ) : null}
            {store.platforms.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {store.platforms.map((platform) => (
                  <li key={platform} className="rounded-full bg-white px-3 py-1 text-sm border border-[#d5dbe3]">
                    {platform}
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
            ) : store.hoursRaw ? (
              <p className="mt-3 text-sm text-[#3c4550]">{store.hoursRaw}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">Hours are not listed yet.</p>
            )}
          </aside>
        </div>
        {nearby.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Other stores in {store.city}</h2>
            <ul className="mt-4 space-y-2">
              {nearby.map((item) => (
                <li key={item.id}>
                  <a href={storePath(item.slug)} className="text-[#155eef] hover:underline">
                    {item.name}
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
