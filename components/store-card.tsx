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

export function StoreCard({ store, priority = false }: { store: CatalogStore; priority?: boolean }) {
  const href = storePath(store.slug);
  return (
    <a
      href={href}
      className="flex flex-col gap-4 rounded-3xl border border-[#d5dbe3] bg-white p-4 shadow-[0_8px_24px_rgba(9,11,16,0.04)] transition hover:border-[#155eef] sm:flex-row sm:items-center"
    >
      {store.photo ? (
        <img
          src={store.photo}
          alt={store.name}
          width={160}
          height={160}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="h-24 w-full rounded-2xl object-cover sm:h-20 sm:w-20"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-20 w-full place-items-center rounded-2xl bg-[linear-gradient(160deg,#ffffff,#d5dbe3)] text-2xl font-semibold text-[#155eef] sm:w-20"
        >
          {store.name.slice(0, 1)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold text-[#090b10]">{store.name}</span>
        <span className="mt-1 block text-sm text-muted">
          {store.address}, {store.city}, {store.stateAbbr}
          {store.zip ? ` ${store.zip}` : ""}
        </span>
        <span className="mt-3 flex flex-wrap gap-2">
          {store.platforms.map((platform) => (
            <span key={platform} className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs text-[#3c4550]">
              {platform}
            </span>
          ))}
          {facts(store).map((fact) => (
            <span key={fact} className="rounded-full border border-[#d5dbe3] px-2.5 py-1 text-xs text-[#155eef]">
              {fact}
            </span>
          ))}
        </span>
      </span>
      <span className="inline-flex rounded-full bg-[#155eef] px-4 py-2 text-sm font-medium text-white">
        View store
      </span>
    </a>
  );
}
