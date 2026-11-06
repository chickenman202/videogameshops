import type { Crumb } from "@/lib/listing";

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.name}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.href && !last ? (
                <a href={crumb.href} className="hover:text-[#090b10]">
                  {crumb.name}
                </a>
              ) : (
                <span className={last ? "text-[#090b10]" : undefined}>{crumb.name}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
