import type { Crumb } from "@/lib/listing";

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-wide text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.name}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-muted">
                  ›
                </span>
              ) : null}
              {crumb.href && !last ? (
                <a href={crumb.href} className="link font-semibold">
                  {crumb.name}
                </a>
              ) : (
                <span className={last ? "font-semibold break-words text-ink" : "break-words"}>{crumb.name}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
