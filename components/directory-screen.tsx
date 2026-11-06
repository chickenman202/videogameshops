import Link from "next/link";
import { CityIndex } from "@/components/city-index";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageShell } from "@/components/page-shell";
import { Pagination } from "@/components/pagination";
import { SearchForm } from "@/components/search-form";
import { StoreCard } from "@/components/store-card";
import { hasFilters, hrefWithFilters, type Filters } from "@/lib/filters";
import { breadcrumbJsonLd, collectionJsonLd, JsonLd } from "@/lib/jsonld";
import type { ListingOk } from "@/lib/listing";
import { PLATFORMS } from "@/lib/platforms";
import { platformPath } from "@/lib/paths";
import { PAGE_SIZE } from "@/lib/site";

function toggleHref(listing: ListingOk, patch: Partial<Filters>): string {
  return hrefWithFilters(listing.basePath, { ...listing.filters, ...patch });
}

export function DirectoryScreen({ listing }: { listing: ListingOk }) {
  const crumbItems = listing.crumbs.map((crumb) => ({
    name: crumb.name,
    path: crumb.href ?? listing.canonicalPath,
  }));
  const showCities = listing.cities.length > 0 && !listing.filtered;
  const showPlatforms = listing.platformLinks.length > 0 && !listing.filtered;
  const platformNav = showPlatforms ? [] : platformChoices(listing);
  const start = listing.total === 0 ? 0 : (listing.page - 1) * PAGE_SIZE + 1;
  const end = start === 0 ? 0 : start + listing.stores.length - 1;

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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Breadcrumbs crumbs={listing.crumbs} />
        <header className="mt-4 max-w-3xl">
          <h1 className="text-3xl text-balance text-ink sm:text-5xl">{listing.h1}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">{listing.intro}</p>
        </header>

        <div className="mt-6">
          <SearchForm
            id="directory-search"
            action={listing.basePath}
            filters={listing.filters}
            label="Search this list"
            hint="City or shop name. Checked filters stay on."
          />
        </div>

        {showCities ? <CityIndex cities={listing.cities} /> : null}

        {showPlatforms ? (
          <section className="mt-8" aria-labelledby="platform-jump">
            <h2 id="platform-jump" className="text-2xl text-ink sm:text-3xl">
              Platforms
            </h2>
            <p className="mt-1 text-sm text-muted">Open a shorter list for one kind of game.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {listing.platformLinks.map((platform) => (
                <li key={platform.slug}>
                  <a
                    href={platform.href}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-semibold text-ink hover:border-pine"
                  >
                    {platform.label}
                    <span className="text-muted">{platform.count.toLocaleString("en-US")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
          <details className="rounded-2xl border border-line bg-card px-4 py-2 lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              Filter this list
              {listing.filters.sellsNew || listing.filters.sellsUsed || listing.filters.tradeIns || listing.filters.repairs ? (
                <span className="text-sm font-bold text-pine">On</span>
              ) : null}
            </summary>
            <FilterPanel listing={listing} platformNav={platformNav} labelled={false} />
          </details>
          <aside className="hidden h-fit rounded-2xl border border-line bg-card p-5 lg:sticky lg:top-24 lg:block">
            <FilterPanel listing={listing} platformNav={platformNav} labelled />
          </aside>
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-2xl text-ink">Stores</h2>
              {listing.total > 0 ? (
                <p className="text-sm text-muted">
                  Showing {start.toLocaleString("en-US")}–{end.toLocaleString("en-US")} of{" "}
                  {listing.total.toLocaleString("en-US")}
                </p>
              ) : null}
            </div>
            {listing.stores.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {listing.stores.map((store, index) => (
                  <li key={store.id}>
                    <StoreCard store={store} priority={index === 0 && listing.page === 1} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyResults listing={listing} />
            )}
            <Pagination listing={listing} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function EmptyResults({ listing }: { listing: ListingOk }) {
  const filtered = hasFilters(listing.filters) || Boolean(listing.filters.q);
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-center">
      <h3 className="text-2xl text-ink">{filtered ? "No stores match" : "No stores listed here yet"}</h3>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        {listing.filters.q
          ? `Nothing matched “${listing.filters.q}”. Try another city or shop name.`
          : filtered
            ? "Try clearing a filter, or search for a city or shop name."
            : "Shops show up here after they are added to the directory."}
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {filtered ? (
          <a href={listing.basePath} className="btn btn-primary">
            Clear filters
          </a>
        ) : null}
        <Link href="/directory/states" className="btn btn-ghost">
          Browse states
        </Link>
      </div>
    </div>
  );
}

function FilterPanel({
  listing,
  platformNav,
  labelled,
}: {
  listing: ListingOk;
  platformNav: PlatformChoice[];
  labelled: boolean;
}) {
  return (
    <div className={labelled ? "" : "pt-1 pb-3"}>
      {labelled ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg text-ink">Filter this list</h2>
          {hasFilters(listing.filters) ? (
            <a href={listing.basePath} className="link text-sm">
              Clear
            </a>
          ) : null}
        </div>
      ) : hasFilters(listing.filters) ? (
        <a href={listing.basePath} className="link text-sm">
          Clear filters
        </a>
      ) : null}
      <FilterGroup title="What they carry">
        <FilterLink href={toggleHref(listing, { sellsNew: !listing.filters.sellsNew })} active={listing.filters.sellsNew} label="New games" />
        <FilterLink href={toggleHref(listing, { sellsUsed: !listing.filters.sellsUsed })} active={listing.filters.sellsUsed} label="Used games" />
        <FilterLink href={toggleHref(listing, { tradeIns: !listing.filters.tradeIns })} active={listing.filters.tradeIns} label="Trade-ins" />
        <FilterLink href={toggleHref(listing, { repairs: !listing.filters.repairs })} active={listing.filters.repairs} label="Console repair" />
      </FilterGroup>
      {platformNav.length > 0 ? (
        <FilterGroup title="Platforms">
          {listing.state && !listing.citySlug ? (
            <p className="text-xs leading-relaxed text-muted">These lists cover every state, not only {listing.state.name}.</p>
          ) : null}
          {platformNav.map((platform) => (
            <a
              key={platform.slug}
              href={platform.href}
              className="flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-ink hover:bg-paper"
            >
              {platform.label}
              {typeof platform.count === "number" ? (
                <span className="ml-auto text-muted">{platform.count.toLocaleString("en-US")}</span>
              ) : null}
            </a>
          ))}
        </FilterGroup>
      ) : null}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-bold text-ink">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={
        active
          ? "flex min-h-11 items-center gap-3 rounded-xl bg-pine-soft px-2 text-sm font-semibold text-pine"
          : "flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-semibold text-ink hover:bg-paper"
      }
    >
      <span
        aria-hidden="true"
        className={
          active
            ? "grid size-5 place-items-center rounded-md bg-pine text-xs text-card"
            : "size-5 rounded-md border border-line bg-card"
        }
      >
        {active ? "✓" : ""}
      </span>
      {active ? <span className="sr-only">Selected: </span> : null}
      {label}
    </a>
  );
}

type PlatformChoice = { slug: string; label: string; href: string; count?: number };

function platformChoices(listing: ListingOk): PlatformChoice[] {
  if (listing.platformSlug) return [];
  if (listing.citySlug) return listing.platformLinks;
  return PLATFORMS.map((platform) => ({
    slug: platform.slug,
    label: platform.label,
    href: platformPath(platform.slug),
  }));
}
