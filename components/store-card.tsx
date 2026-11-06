import { storePath } from "@/lib/paths";
import { shopLocation, type ShopView } from "@/lib/shop-view";

export function StoreCard({
  store,
  scale = "row",
  priority = false,
}: {
  store: ShopView;
  scale?: "feature" | "photo" | "row";
  priority?: boolean;
}) {
  const href = storePath(store.slug);
  const place = shopLocation(store);

  if (scale === "feature") {
    return (
      <a href={href} className="group block border-t-2 border-ink">
        {store.photo ? (
          <img
            src={store.photo}
            alt=""
            width={1200}
            height={750}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="border-b border-ink bg-stage px-4 py-10 text-paper sm:py-14">
            <p className="kicker text-blue-mist">{place.line || place.country || "Shop"}</p>
            <p className="mt-3 max-w-4xl font-display text-5xl font-bold uppercase leading-[0.88] break-words sm:text-7xl">
              {store.name}
            </p>
          </div>
        )}
        <span className="block py-4">
          {place.line ? <span className="kicker text-muted">{place.line}</span> : null}
          {store.photo ? (
            <span className="mt-2 block font-display text-5xl font-bold leading-[0.9] break-words text-ink group-hover:text-blue-ink group-hover:underline sm:text-6xl">
              {store.name}
            </span>
          ) : null}
          {place.country ? <span className="mt-2 block kicker text-ink">{place.country}</span> : null}
        </span>
      </a>
    );
  }

  if (scale === "photo" && store.photo) {
    return (
      <a href={href} className="group grid border-t border-ink sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <img
          src={store.photo}
          alt=""
          width={640}
          height={480}
          loading="lazy"
          className="aspect-[4/3] h-full w-full object-cover"
        />
        <span className="flex min-w-0 flex-col justify-end py-4 sm:px-5">
          {place.line ? <span className="kicker text-muted">{place.line}</span> : null}
          <span className="mt-2 font-display text-4xl font-bold leading-[0.92] break-words text-ink group-hover:text-blue-ink group-hover:underline">
            {store.name}
          </span>
          {place.country ? <span className="mt-2 kicker text-ink">{place.country}</span> : null}
        </span>
      </a>
    );
  }

  return (
    <a href={href} className="group block border-t border-line py-4">
      {place.line ? <span className="kicker text-muted">{place.line}</span> : null}
      <span className="mt-1 block font-display text-3xl font-bold leading-[0.95] break-words text-ink group-hover:text-blue-ink group-hover:underline">
        {store.name}
      </span>
      {place.country ? <span className="mt-2 block kicker text-ink">{place.country}</span> : null}
    </a>
  );
}
