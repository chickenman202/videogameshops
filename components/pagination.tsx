import { hrefWithFilters } from "@/lib/filters";
import type { ListingOk } from "@/lib/listing";
import { pagePath } from "@/lib/paths";

export function Pagination({ listing }: { listing: ListingOk }) {
  if (listing.pageCount <= 1) return null;
  const hrefFor = (page: number) => {
    const path = pagePath(listing.basePath, page);
    return listing.filtered ? hrefWithFilters(path, listing.filters) : path;
  };
  const pages: number[] = [];
  const start = Math.max(1, listing.page - 2);
  const end = Math.min(listing.pageCount, start + 4);
  for (let page = start; page <= end; page += 1) pages.push(page);

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center gap-2">
      {listing.page > 1 ? (
        <a href={hrefFor(listing.page - 1)} className="rounded-full border border-[#d5dbe3] bg-white px-4 py-2 text-sm">
          Previous page
        </a>
      ) : null}
      {pages.map((page) => (
        <a
          key={page}
          href={hrefFor(page)}
          aria-label={`Page ${page}`}
          aria-current={page === listing.page ? "page" : undefined}
          className={
            page === listing.page
              ? "rounded-full bg-[#155eef] px-4 py-2 text-sm text-white"
              : "rounded-full border border-[#d5dbe3] bg-white px-4 py-2 text-sm"
          }
        >
          {page}
        </a>
      ))}
      {listing.page < listing.pageCount ? (
        <a href={hrefFor(listing.page + 1)} className="rounded-full border border-[#d5dbe3] bg-white px-4 py-2 text-sm">
          Next page
        </a>
      ) : null}
    </nav>
  );
}
