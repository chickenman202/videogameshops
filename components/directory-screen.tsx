import Link from "next/link";
import { CityIndex } from "@/components/city-index";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { Pagination } from "@/components/pagination";
import { PreviewNote } from "@/components/preview-note";
import { SearchForm } from "@/components/search-form";
import { StoreCard } from "@/components/store-card";
import { loadCatalog } from "@/lib/catalog";
import { hasFilters, hrefWithFilters, type Filters } from "@/lib/filters";
import { breadcrumbJsonLd, collectionJsonLd, JsonLd } from "@/lib/jsonld";
import type { ListingOk } from "@/lib/listing";
import { PLATFORMS, type PlatformLabel } from "@/lib/platforms";
import { platformPath } from "@/lib/paths";
import { previewShopsFor, type ShopView } from "@/lib/shop-view";
import { PAGE_SIZE } from "@/lib/site";

function toggleHref(listing: ListingOk, patch: Partial<Filters>): string {
  return hrefWithFilters(listing.basePath, { ...listing.filters, ...patch });
}

export async function DirectoryScreen({ listing }: { listing: ListingOk }) {
  const catalog = await loadCatalog();
  const previewList =
    catalog.ok && catalog.stores.length === 0
      ? previewShopsFor({
          liveCount: 0,
          stateSlug: listing.state?.slug ?? null,
          citySlug: listing.citySlug,
          platformLabel: listing.platformLabel,
          filters: listing.filters,
        })
      : null;
  const preview = previewList !== null;
  const pool: ShopView[] = preview ? previewList : listing.stores;
  const visibleStores = preview
    ? previewList.slice((listing.page - 1) * PAGE_SIZE, listing.page * PAGE_SIZE)
    : listing.stores;
  const total = preview ? previewList.length : listing.total;
  const crumbItems = listing.crumbs.map((crumb) => ({
    name: crumb.name,
    path: crumb.href ?? listing.canonicalPath,
  }));
  const showCities = listing.cities.length > 0 && !listing.filtered;
  const platformNav = preview ? platformChoices(listing, pool) : livePlatforms(listing);
  const start = total === 0 ? 0 : (listing.page - 1) * PAGE_SIZE + 1;
  const end = start === 0 ? 0 : start + visibleStores.length - 1;
  const intro = preview
    ? `${total.toLocaleString("en-US")} ${total === 1 ? "shop" : "shops"} in this preview${listing.state ? ` for ${listing.state.name}` : ""}. The live catalog replaces this list when it is connected.`
    : listing.intro;

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbItems)} />
      <JsonLd
        data={collectionJsonLd({
          name: listing.h1,
          path: listing.canonicalPath,
          total: listing.total,
          stores: listing.stores,
          page: listing.page,
        })}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Breadcrumbs crumbs={listing.crumbs} />
        <header className="mt-6 max-w-4xl">
          <p className="kicker text-blue-ink">Directory</p>
          <h1 className="mt-3 text-5xl uppercase text-ink sm:text-7xl">{listing.h1}</h1>
          {preview || total > 0 ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{intro}</p> : null}
          {preview ? <PreviewNote /> : null}
        </header>

        <div className="mt-8 max-w-2xl">
          <SearchForm
            id="directory-search"
            action={listing.basePath}
            filters={listing.filters}
            label="Search this list"
            hint="City, country, or shop name. Checked filters stay on."
          />
        </div>

        <FilterBar listing={listing} platformNav={platformNav} />

        {showCities ? <CityIndex cities={listing.cities} /> : null}

        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-4xl uppercase text-ink">Stores</h2>
            {total > 0 ? (
              <p className="kicker text-muted">
                {start.toLocaleString("en-US")}–{end.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
              </p>
            ) : null}
          </div>
          {visibleStores.length > 0 ? (
            <ul className="mt-4">
              {visibleStores.map((store, index) => (
                <li key={store.id}>
                  <StoreCard
                    store={store}
                    priority={index === 0 && listing.page === 1}
                    scale={index === 0 ? "feature" : store.photo ? "photo" : "row"}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyResults listing={listing} />
          )}
          <Pagination listing={listing} />
        </div>
      </div>
    </PageShell>
  );
}

function EmptyResults({ listing }: { listing: ListingOk }) {
  const filtered = hasFilters(listing.filters) || Boolean(listing.filters.q);
  return (
    <div className="mt-4 border-t border-ink py-10">
      <h3 className="text-4xl uppercase text-ink">{filtered ? "No stores match" : "No stores listed here yet"}</h3>
      <p className="mt-3 max-w-md text-ink-soft">
        {listing.filters.q
          ? `Nothing matched “${listing.filters.q}”. Try another city or shop name.`
          : filtered
            ? "Clear a filter, or search for a city or shop name."
            : "Shops show up here after they are added."}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {filtered ? (
          <a href={listing.basePath} className="btn btn-primary">
            Clear filters
          </a>
        ) : null}
        <Link href="/directory" className="btn btn-ghost">
          All stores
        </Link>
        <Link href="/submit" className="btn btn-ghost">
          Submit a store
        </Link>
      </div>
    </div>
  );
}

function FilterBar({ listing, platformNav }: { listing: ListingOk; platformNav: PlatformChoice[] }) {
  const filtersOn =
    listing.filters.sellsNew || listing.filters.sellsUsed || listing.filters.tradeIns || listing.filters.repairs;
  return (
    <div className="mt-8 border-y border-ink py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="kicker text-ink">Filter this list</p>
        {hasFilters(listing.filters) ? (
          <a href={listing.basePath} className="link text-sm">
            Clear
          </a>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1" role="group" aria-label="What they carry">
        <FilterLink href={toggleHref(listing, { sellsNew: !listing.filters.sellsNew })} active={listing.filters.sellsNew} label="New" />
        <FilterLink href={toggleHref(listing, { sellsUsed: !listing.filters.sellsUsed })} active={listing.filters.sellsUsed} label="Used" />
        <FilterLink
          href={toggleHref(listing, { tradeIns: !listing.filters.tradeIns })}
          active={listing.filters.tradeIns}
          label="Trade-ins"
        />
        <FilterLink href={toggleHref(listing, { repairs: !listing.filters.repairs })} active={listing.filters.repairs} label="Repair" />
      </div>
      {platformNav.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Platforms">
          {listing.state && !listing.citySlug ? (
            <p className="w-full text-xs text-muted">These lists cover every state, not only {listing.state.name}.</p>
          ) : null}
          {platformNav.map((platform) => (
            <a
              key={platform.slug}
              href={platform.href}
              className="inline-flex min-h-11 items-center gap-2 text-base text-ink underline-offset-4 hover:underline"
            >
              {platform.label}
              <span className="font-mono text-xs normal-case">{platform.count.toLocaleString("en-US")}</span>
            </a>
          ))}
        </div>
      ) : null}
      {filtersOn ? <p className="sr-only">Some filters are on.</p> : null}
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={
        active
          ? "inline-flex min-h-11 items-center text-base font-semibold text-ink underline decoration-blue-ink decoration-2 underline-offset-4"
          : "inline-flex min-h-11 items-center text-base text-ink-soft underline-offset-4 hover:text-blue-ink hover:underline"
      }
    >
      {active ? <span className="sr-only">Selected: </span> : null}
      {label}
    </a>
  );
}

type PlatformChoice = { slug: string; label: string; href: string; count: number };

function livePlatforms(listing: ListingOk): PlatformChoice[] {
  if (listing.platformSlug) return [];
  return listing.platformLinks
    .filter((platform) => platform.count > 0)
    .map((platform) => ({
      slug: platform.slug,
      label: platform.label,
      href: platform.href,
      count: platform.count,
    }));
}

function platformChoices(listing: ListingOk, shops: ShopView[]): PlatformChoice[] {
  if (listing.platformSlug) return [];
  return PLATFORMS.map((platform) => ({
    slug: platform.slug,
    label: platform.label,
    href: platformPath(platform.slug),
    count: shops.filter((store) => store.platforms.includes(platform.label as PlatformLabel)).length,
  })).filter((platform) => platform.count > 0);
}
