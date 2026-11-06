import type { CatalogStore } from "@/lib/catalog";
import { parseDayHours, WEEKDAYS } from "@/lib/hours";
import { cityPath, statePath, storePath } from "@/lib/paths";
import { BRAND, PAGE_SIZE, SITE_URL } from "@/lib/site";

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
      name: store.name,
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

const SCHEMA_DAYS: Record<string, string> = {
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
};

export function storeJsonLd(store: CatalogStore) {
  const openingHoursSpecification = [];
  if (store.hours) {
    for (const [key] of WEEKDAYS) {
      const value = store.hours[key];
      if (!value) continue;
      const parsed = parseDayHours(value);
      if (parsed.status !== "parsed") continue;
      for (const range of parsed.ranges) {
        openingHoursSpecification.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: SCHEMA_DAYS[key],
          opens: range.opens,
          closes: range.closes,
        });
      }
    }
  }

  const address: Record<string, unknown> = { "@type": "PostalAddress" };
  if (store.address) address.streetAddress = store.address;
  if (store.city) address.addressLocality = store.city;
  if (store.country === "US" && (store.stateAbbr || store.state)) {
    address.addressRegion = store.stateAbbr || store.state;
  } else if (store.state) {
    address.addressRegion = store.state;
  }
  if (store.zip) address.postalCode = store.zip;
  if (store.country) address.addressCountry = store.country;

  const business: Record<string, unknown> = {
    "@type": "LocalBusiness",
    name: store.name,
    url: absoluteUrl(storePath(store.slug)),
  };
  if (Object.keys(address).length > 1) business.address = address;
  if (store.phone) business.telephone = store.phone;
  const sameAs = [store.website, store.facebook, store.instagram, store.twitter, ...store.otherSocials].filter(
    (item): item is string => Boolean(item),
  );
  if (sameAs.length > 0) business.sameAs = sameAs;
  if (store.lat != null && store.lng != null) {
    business.geo = {
      "@type": "GeoCoordinates",
      latitude: store.lat,
      longitude: store.lng,
    };
  }
  if (openingHoursSpecification.length > 0) {
    business.openingHoursSpecification = openingHoursSpecification;
  }
  if (store.photo) business.image = store.photo;
  return { "@context": "https://schema.org", ...business };
}

export function storeCrumbs(
  store: CatalogStore,
  extra?: { country?: { name: string; href: string } | null; region?: { name: string; href: string } | null },
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
  }
  crumbs.push({ name: store.name, path: storePath(store.slug) });
  return crumbs;
}
