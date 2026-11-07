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
  const platformNav = platformChoices(listing);

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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs crumbs={listing.crumbs} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{listing.h1}</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">{listing.intro}</p>
        {listing.countries.length > 0 ? (
          <nav aria-label="Countries" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {listing.countries.map((country) => (
                <li key={country.slug}>
                  <a
                    href={country.href}
                    className="inline-flex rounded-full border border-[#d5dbe3] bg-white px-3 py-1.5 text-sm hover:border-[#155eef]"
                  >
                    Video game stores in {country.name} ({country.count})
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {showPlatforms ? (
          <p className="mt-4 text-sm text-[#3c4550]">
            {listing.platformLinks.map((platform, index) => (
              <span key={platform.slug}>
                {index > 0 ? " · " : null}
                <a href={platform.href} className="font-medium text-[#155eef] hover:underline">
                  {platform.label} ({platform.count})
                </a>
              </span>
            ))}
          </p>
        ) : null}
        {showCities ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {listing.cities.map((city) => (
              <li key={city.slug}>
                <a
                  href={city.href}
                  className="inline-flex rounded-full border border-[#d5dbe3] bg-white px-3 py-1.5 text-sm hover:border-[#155eef]"
                >
                  {city.name} ({city.count})
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8">
          <SearchForm action={listing.basePath} filters={listing.filters} tone="plain" />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-[#d5dbe3] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8b95a3]">Filter</h2>
              {hasFilters(listing.filters) ? (
                <a href={listing.basePath} className="text-sm text-[#155eef]">
                  Clear filters
                </a>
              ) : null}
            </div>
            <FilterGroup title="What they carry">
              <FilterLink href={toggleHref(listing, { sellsNew: !listing.filters.sellsNew })} active={listing.filters.sellsNew} label="New games" />
              <FilterLink href={toggleHref(listing, { sellsUsed: !listing.filters.sellsUsed })} active={listing.filters.sellsUsed} label="Used games" />
              <FilterLink href={toggleHref(listing, { tradeIns: !listing.filters.tradeIns })} active={listing.filters.tradeIns} label="Trade-ins" />
              <FilterLink href={toggleHref(listing, { repairs: !listing.filters.repairs })} active={listing.filters.repairs} label="Console repair" />
            </FilterGroup>
            {platformNav.length > 0 ? (
              <FilterGroup title="Platforms">
                {platformNav.map((platform) => (
                  <a key={platform.slug} href={platform.href} className="block py-1 text-sm hover:text-[#155eef]">
                    {platform.label}
                  </a>
                ))}
              </FilterGroup>
            ) : null}
          </aside>
          <div className="min-h-[720px]">
            <div className="space-y-4">
              {listing.stores.map((store, index) => (
                <StoreCard key={store.id} store={store} priority={index === 0 && listing.page === 1} />
              ))}
            </div>
            <Pagination listing={listing} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a href={href} className="flex items-center gap-2 py-1 text-sm" aria-current={active ? "true" : undefined}>
      <span
        aria-hidden="true"
        className={
          active
            ? "grid h-4 w-4 place-items-center rounded border border-[#155eef] bg-[#155eef] text-[10px] text-white"
            : "h-4 w-4 rounded border border-[#d5dbe3] bg-white"
        }
      >
        {active ? "✓" : ""}
      </span>
      {label}
    </a>
  );
}

function platformChoices(listing: ListingOk) {
  if (listing.platformSlug) return [];
  if (listing.citySlug) return listing.platformLinks;
  return PLATFORMS.map((platform) => ({
    slug: platform.slug,
    label: platform.label,
    href: platformPath(platform.slug),
  }));
}
