import { hrefWithFilters } from "@/lib/filters";
import type { ListingOk } from "@/lib/listing";
import { pagePath } from "@/lib/paths";

export function Pagination({ listing }: { listing: ListingOk }) {
  if (listing.pageCount <= 1) return null;
  const hrefFor = (page: number) => {
    const path = pagePath(listing.basePath, page);
    return listing.filtered ? hrefWithFilters(path, listing.filters) : path;
  };

  let start = Math.max(1, listing.page - 2);
  const end = Math.min(listing.pageCount, start + 4);
  start = Math.max(1, end - 4);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-col gap-3 border-t border-line pt-5">
      <p className="text-sm text-muted">
        Page {listing.page.toLocaleString("en-US")} of {listing.pageCount.toLocaleString("en-US")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {listing.page > 1 ? (
          <a href={hrefFor(listing.page - 1)} className="btn btn-ghost">
            Previous
          </a>
        ) : null}
        {start > 1 ? (
          <PageLink href={hrefFor(1)} page={1} current={false} />
        ) : null}
        {start > 2 ? (
          <span aria-hidden="true" className="px-1 text-muted">
            …
          </span>
        ) : null}
        {pages.map((page) => (
          <PageLink key={page} href={hrefFor(page)} page={page} current={page === listing.page} />
        ))}
        {end < listing.pageCount - 1 ? (
          <span aria-hidden="true" className="px-1 text-muted">
            …
          </span>
        ) : null}
        {end < listing.pageCount ? (
          <PageLink href={hrefFor(listing.pageCount)} page={listing.pageCount} current={false} />
        ) : null}
        {listing.page < listing.pageCount ? (
          <a href={hrefFor(listing.page + 1)} className="btn btn-ghost">
            Next
          </a>
        ) : null}
      </div>
    </nav>
  );
}

function PageLink({ href, page, current }: { href: string; page: number; current: boolean }) {
  if (current) {
    return (
      <span aria-current="page" className="btn btn-primary min-w-11 px-3">
        {page.toLocaleString("en-US")}
      </span>
    );
  }
  return (
    <a href={href} className="btn btn-ghost min-w-11 px-3">
      {page.toLocaleString("en-US")}
    </a>
  );
}
