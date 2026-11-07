import type { CatalogStore } from "@/lib/catalog";
import { cityPath, statePath, storePath } from "@/lib/paths";
import { BRAND, PAGE_SIZE, SITE_URL } from "@/lib/site";
import { schemaOpeningHours, shopCountry, socialLinks, type ShopView } from "@/lib/shop-view";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

function jsonScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonScript(data) }}
    />
  );
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: BRAND,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.svg`,
      },
      {
        "@type": "WebSite",
        name: BRAND,
        url: SITE_URL,
        description: "Find video game stores you can walk into. Search by country, city, or shop name.",
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function collectionJsonLd(input: {
  name: string;
  path: string;
  total: number | null;
  stores: CatalogStore[];
  page: number;
}) {
  const list: Record<string, unknown> = {
    "@type": "ItemList",
    itemListElement: input.stores.map((store, index) => ({
      "@type": "ListItem",
      position: (input.page - 1) * PAGE_SIZE + index + 1,
      name: store.displayName,
      url: absoluteUrl(storePath(store.slug)),
    })),
  };
  if (input.total != null) list.numberOfItems = input.total;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(input.path),
    mainEntity: list,
  };
}

function stored(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function httpUrl(value: string | null | undefined): string | null {
  const url = stored(value);
  return /^https?:\/\//i.test(url) ? url : null;
}

/** LocalBusiness from stored fields only. Missing facts are omitted, not filled in. */
export function storeJsonLd(store: ShopView): Record<string, unknown> {
  const country = shopCountry(store) || (stored(store.stateAbbr) ? "US" : "");
  const street = stored(store.address);
  const locality = stored(store.city);
  const region = stored(store.stateAbbr) || stored(store.state);
  const postal = stored(store.zip);
  const address: Record<string, unknown> = { "@type": "PostalAddress" };
  if (street) address.streetAddress = street;
  if (locality) address.addressLocality = locality;
  if (region) address.addressRegion = region;
  if (postal) address.postalCode = postal;
  if (country) address.addressCountry = country;

  const business: Record<string, unknown> = {
    "@type": "LocalBusiness",
    name: stored(store.displayName) || stored(store.name),
    url: absoluteUrl(storePath(store.slug)),
  };
  if (street || locality || region || postal || country) business.address = address;

  const phone = stored(store.phone);
  if (phone) business.telephone = phone;

  const sameAs: string[] = [];
  const website = httpUrl(store.website);
  if (website) sameAs.push(website);
  for (const link of socialLinks(store)) {
    if (!sameAs.includes(link.href)) sameAs.push(link.href);
  }
  if (sameAs.length > 0) business.sameAs = sameAs;

  if (store.lat != null && store.lng != null && Number.isFinite(store.lat) && Number.isFinite(store.lng)) {
    business.geo = {
      "@type": "GeoCoordinates",
      latitude: store.lat,
      longitude: store.lng,
    };
  }

  const openingHours = schemaOpeningHours(store);
  if (openingHours.length === 1) business.openingHours = openingHours[0];
  else if (openingHours.length > 1) business.openingHours = openingHours;

  const photo = stored(store.photo);
  if (photo) business.image = photo;
  return { "@context": "https://schema.org", ...business };
}

export function storeCrumbs(
  store: CatalogStore,
  extra?: {
    country?: { name: string; href: string } | null;
    region?: { name: string; href: string } | null;
    city?: { name: string; href: string } | null;
  },
) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Stores", path: "/directory" },
  ];
  if (store.stateSlug) {
    crumbs.push({ name: store.state, path: statePath(store.stateSlug) });
    if (store.city && store.citySlug) {
      crumbs.push({ name: store.city, path: cityPath(store.stateSlug, store.citySlug) });
    }
  } else {
    if (extra?.country) crumbs.push({ name: extra.country.name, path: extra.country.href });
    if (extra?.region) crumbs.push({ name: extra.region.name, path: extra.region.href });
    if (extra?.city) crumbs.push({ name: extra.city.name, path: extra.city.href });
  }
  crumbs.push({ name: store.displayName, path: storePath(store.slug) });
  return crumbs;
}
