import type { CatalogStore } from "@/lib/catalog";
import { storePath } from "@/lib/paths";

function facts(store: CatalogStore): string[] {
  const items: string[] = [];
  if (store.sellsNew) items.push("New");
  if (store.sellsUsed) items.push("Used");
  if (store.tradeIns) items.push("Trade-ins");
  if (store.repairs) items.push("Repairs");
  return items;
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function StoreCard({ store, priority = false }: { store: CatalogStore; priority?: boolean }) {
  const href = storePath(store.slug);
  return (
    <a
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3 shadow-card hover:border-pine sm:gap-4 sm:p-4"
    >
      {store.photo ? (
        <img
          src={store.photo}
          alt=""
          width={80}
          height={80}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-xl bg-pine-soft font-display text-2xl font-semibold text-pine sm:size-20"
        >
          {initial(store.name)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold break-words text-ink">{store.name}</span>
        <span className="mt-1 block text-sm text-muted">
          {store.address}, {store.city}, {store.stateAbbr}
          {store.zip ? ` ${store.zip}` : ""}
        </span>
        <span className="mt-3 flex flex-wrap gap-1.5">
          {store.platforms.map((platform) => (
            <span key={platform} className="rounded-full bg-paper-deep px-2.5 py-1 text-xs font-semibold text-ink-soft">
              {platform}
            </span>
          ))}
          {facts(store).map((fact) => (
            <span key={fact} className="rounded-full bg-pine-soft px-2.5 py-1 text-xs font-semibold text-pine">
              {fact}
            </span>
          ))}
        </span>
        <span className="mt-3 inline-flex items-center text-sm font-bold text-pine" aria-hidden="true">
          Details →
        </span>
      </span>
    </a>
  );
}
