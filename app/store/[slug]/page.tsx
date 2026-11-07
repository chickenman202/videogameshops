import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadError } from "@/components/load-error";
import { PageShell } from "@/components/page-shell";
import { StoreCard } from "@/components/store-card";
import { loadCatalog } from "@/lib/catalog";
import { storeTitle, toMetaDescription } from "@/lib/copy";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";
import { WEEKDAYS } from "@/lib/hours";
import { absoluteUrl, breadcrumbJsonLd, JsonLd, storeCrumbs, storeJsonLd } from "@/lib/jsonld";
import type { Crumb } from "@/lib/listing";
import { cityPath, statePath, storePath } from "@/lib/paths";
import {
  directionsUrl,
  displayPlace,
  formatPhone,
  hasAddress,
  hoursNote,
  shopCountry,
  shopCountryName,
  shopLocation,
  socialLinks,
  type ShopView,
} from "@/lib/shop-view";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

async function loadStore(slug: string): Promise<
  | { status: "ok"; store: ShopView; nearby: ShopView[]; preview: boolean }
  | { status: "missing" }
  | { status: "error" }
> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return { status: "error" };
  const preview = catalog.stores.length === 0;
  const pool: ShopView[] = preview ? FIXTURE_SHOPS : catalog.stores;
  const store = pool.find((item) => item.slug === slug);
  if (!store) return { status: "missing" };
  const nearby = pool
    .filter(
      (item) =>
        item.id !== store.id &&
        item.citySlug !== "" &&
        item.citySlug === store.citySlug &&
        shopCountry(item) === shopCountry(store) &&
        item.state === store.state,
    )
    .slice(0, 4);
  return { status: "ok", store, nearby, preview };
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
      title: { absolute: "The shop list didn’t load" },
      robots: { index: false, follow: true },
    };
  }
  const { store } = result;
  const placeLabel = store.city || shopCountryName(store) || "Shop";
  const regionLabel = store.stateAbbr || shopCountry(store);
  const title = storeTitle(store.name, placeLabel, regionLabel, store.platforms);
  const countryCode = shopCountry(store);
  const inUs = countryCode === "US" || (!countryCode && Boolean(store.stateAbbr));
  const placeBit = (
    inUs ? [store.city, store.state] : [store.city, shopCountryName(store) || store.state]
  )
    .filter(Boolean)
    .join(", ");
  const description = toMetaDescription(
    store.about?.trim() || (placeBit ? `${store.name} is a video game store in ${placeBit}.` : store.name),
  );
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(storePath(store.slug)) },
    robots: result.preview ? { index: false, follow: true } : { index: true, follow: true },
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

  const { store, nearby, preview } = result;
  const country = shopCountry(store);
  const countryName = shopCountryName(store);
  const crumbs =
    store.stateSlug !== ""
      ? storeCrumbs(store, {
          slug: store.stateSlug,
          name: store.state,
          abbreviation: store.stateAbbr,
        })
      : [
          { name: "Home", path: "/" },
          { name: "Stores", path: "/directory" },
          { name: store.name, path: storePath(store.slug) },
        ];
  const facts = [
    store.sellsNew ? "Sells new games" : null,
    store.sellsUsed ? "Sells used games" : null,
    store.tradeIns ? "Accepts trade-ins" : null,
    store.repairs ? "Repairs consoles" : null,
  ].filter((item): item is string => Boolean(item));
  const phoneHref = store.phone ? `tel:${store.phone.replace(/[^\d+]/g, "")}` : null;
  const phoneLabel = formatPhone(store.phone);
  const websiteLabel = store.website ? store.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  const directions = directionsUrl(store);
  const socials = socialLinks(store);
  const listedHours = hoursNote(store);
  const place = shopLocation(store);
  const zip = (store.zip ?? "").trim();
  const localLine = [place.full, zip].filter(Boolean).join(" ");
  const eyebrow = [place.line, country && country !== "US" ? countryName : ""].filter(Boolean).join(", ");
  const pageCrumbs: Crumb[] = [
    { name: "Home", href: "/" },
    { name: "Stores", href: "/directory" },
  ];
  if (store.stateSlug) {
    pageCrumbs.push({ name: displayPlace(store.state), href: statePath(store.stateSlug) });
    if (store.city && !preview && store.citySlug) {
      pageCrumbs.push({ name: displayPlace(store.city), href: cityPath(store.stateSlug, store.citySlug) });
    } else if (store.city) {
      pageCrumbs.push({ name: displayPlace(store.city) });
    }
  } else {
    if (countryName) pageCrumbs.push({ name: countryName });
    if (store.city) pageCrumbs.push({ name: displayPlace(store.city) });
  }
  pageCrumbs.push({ name: store.name });
  const about = store.about?.trim() ?? "";

  return (
    <PageShell>
      <JsonLd data={storeJsonLd(store)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <article className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Breadcrumbs crumbs={pageCrumbs} />
        {store.photo ? (
          <img
            src={store.photo}
            alt=""
            width={1200}
            height={675}
            loading="eager"
            fetchPriority="high"
            className="mt-6 aspect-[16/9] max-h-[28rem] w-full object-cover"
          />
        ) : null}
        <header className="mt-6 max-w-4xl border-t-2 border-ink pt-4">
          <p className="font-mono text-xs tracking-wide text-blue-ink">{eyebrow || "Shop"}</p>
          <h1 className="mt-3 text-5xl break-words text-ink sm:text-6xl">{store.name}</h1>
        </header>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="min-w-0">
            {about ? <p className="max-w-3xl text-lg leading-relaxed text-ink-soft">{about}</p> : null}
            {store.platforms.length > 0 || facts.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-3xl uppercase text-ink">They carry</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {store.platforms.map((platform) => (
                    <li key={platform} className="border border-ink px-3 py-1 font-mono text-xs uppercase">
                      {platform}
                    </li>
                  ))}
                  {facts.map((fact) => (
                    <li key={fact} className="border border-ink bg-ink px-3 py-1 font-mono text-xs uppercase text-paper">
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-8 text-sm text-muted">
              Hours and details can change, so call ahead.{" "}
              <Link className="link" href="/contact">
                Suggest an edit
              </Link>
            </p>
          </div>
          <aside className="space-y-8">
            <section aria-labelledby="visit-heading">
              <h2 id="visit-heading" className="text-3xl uppercase text-ink">
                Visit
              </h2>
              <dl className="mt-3 border-t border-ink">
                <div className="border-b border-line py-3">
                  <dt className="kicker text-muted">Address</dt>
                  <dd className="mt-1 text-base leading-relaxed text-ink">
                    {hasAddress(store) ? (
                      store.address
                    ) : (
                      <span className="text-ink-soft">We don’t have a street for this shop yet.</span>
                    )}
                    {localLine ? (
                      <>
                        <br />
                        {localLine}
                      </>
                    ) : null}
                  </dd>
                </div>
                {country || countryName ? (
                  <div className="border-b border-line py-3">
                    <dt className="kicker text-muted">Country</dt>
                    <dd className="mt-1 text-base text-ink">{countryName || country}</dd>
                  </div>
                ) : null}
                {phoneHref && phoneLabel ? (
                  <div className="border-b border-line py-3">
                    <dt className="kicker text-muted">Phone</dt>
                    <dd className="mt-1">
                      <a href={phoneHref} className="link text-lg">
                        {phoneLabel}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {store.website && websiteLabel ? (
                  <div className="border-b border-line py-3">
                    <dt className="kicker text-muted">Website</dt>
                    <dd className="mt-1">
                      <a href={store.website} className="link break-all" target="_blank" rel="noopener noreferrer">
                        {websiteLabel}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </dd>
                  </div>
                ) : null}
                {socials.length > 0 ? (
                  <div className="border-b border-line py-3">
                    <dt className="kicker text-muted">Social</dt>
                    <dd className="mt-2 flex flex-wrap gap-3">
                      {socials.map((link) => (
                        <a key={link.href} href={link.href} className="link" target="_blank" rel="noopener noreferrer">
                          {link.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {directions ? (
                <a href={directions} className="btn btn-primary mt-4 w-full" target="_blank" rel="noopener noreferrer">
                  Directions
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </section>
            {store.hours || listedHours ? (
              <section className="border-t border-ink pt-4" aria-labelledby="hours-heading">
                <h2 id="hours-heading" className="text-3xl uppercase text-ink">
                  Hours
                </h2>
                {store.hours ? (
                  <table className="mt-4 w-full text-sm">
                    <caption className="sr-only">Weekly hours for {store.name}</caption>
                    <tbody>
                      {WEEKDAYS.map(([key, label]) => {
                        const value = store.hours?.[key] ?? "";
                        const quiet = !value || /closed/i.test(value);
                        return (
                          <tr key={key} className="border-t border-line">
                            <th scope="row" className="py-2.5 pr-3 text-left font-semibold text-ink">
                              {label}
                            </th>
                            <td className={quiet ? "py-2.5 text-right text-muted" : "py-2.5 text-right text-ink"}>
                              {value || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-3 font-mono text-sm leading-relaxed text-ink">{listedHours}</p>
                )}
              </section>
            ) : null}
          </aside>
        </div>
        {nearby.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-4xl uppercase text-ink">More shops in {store.city}</h2>
            <ul className="mt-4">
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
