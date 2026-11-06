import { storePath } from "@/lib/paths";
import { shopLocation, type ShopView } from "@/lib/shop-view";

export function StoreCard({
  store,
  priority = false,
}: {
  store: ShopView;
  priority?: boolean;
}) {
  const href = storePath(store.slug);
  const place = shopLocation(store);
  const text = (
    <span className="flex min-w-0 flex-col justify-center py-1">
      {place.line ? <span className="font-mono text-xs tracking-wide text-muted">{place.line}</span> : null}
      <span className="mt-1 block font-display text-3xl leading-[0.95] font-bold break-words text-ink group-hover:text-blue-ink group-hover:underline">
        {store.name}
      </span>
      {place.country ? <span className="mt-1 block font-mono text-xs tracking-wide text-ink">{place.country}</span> : null}
    </span>
  );

  if (store.photo) {
    return (
      <a href={href} className="group grid grid-cols-1 items-center gap-4 border-t border-line py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <img
          src={store.photo}
          alt=""
          width={240}
          height={240}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="aspect-[4/3] w-full object-cover sm:aspect-square"
        />
        {text}
      </a>
    );
  }

  return (
    <a href={href} className="group block border-t border-line py-4">
      {text}
    </a>
  );
}
