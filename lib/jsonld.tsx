import type { CatalogStore } from "@/lib/catalog";
import { isUsableAbout } from "@/lib/publish";
import { parseDayHours, WEEKDAYS } from "@/lib/hours";
import { countryPath, regionPathFor, cityPathFor, storePath } from "@/lib/paths";
import { BRAND, PAGE_SIZE, SITE_URL } from "@/lib/site";

/** The one public host. The homepage has no trailing slash. */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
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

function httpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
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
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/directory?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
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

/** A list of places (countries, regions, or cities), not a list of shops. */
export function placeListJsonLd(input: {
  name: string;
  path: string;
  places: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(input.path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.places.length,
      itemListElement: input.places.map((place, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: place.name,
        url: absoluteUrl(place.path),
      })),
    },
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

/**
 * LocalBusiness built only from fields stored on the shop.
 * Hours are included only when the stored text can be read.
 * There is no rating, review, price, or Offer block.
 */
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

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    streetAddress: store.address,
    addressLocality: store.city,
    addressRegion: store.state,
  };
  if (store.zip) address.postalCode = store.zip;
  if (store.countryCode) address.addressCountry = store.countryCode;
  else if (store.countryName) address.addressCountry = store.countryName;

  const pageUrl = absoluteUrl(storePath(store.slug));
  const business: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": pageUrl,
    name: store.name,
    url: pageUrl,
    address,
  };
  if (isUsableAbout(store.about)) business.description = store.about?.trim();
  if (store.phone) business.telephone = store.phone;
  const website = httpUrl(store.website);
  if (website) business.sameAs = website;
  const photo = httpUrl(store.photo);
  if (photo) business.image = photo;
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
  return business;
}

/** Home → country → region → city → shop. One path on each step. */
export function storeCrumbs(store: CatalogStore) {
  return [
    { name: "Home", path: "/" },
    { name: store.countryName, path: countryPath(store.countrySlug) },
    { name: store.state, path: regionPathFor(store) },
    { name: store.city, path: cityPathFor(store) },
    { name: store.name, path: storePath(store.slug) },
  ];
}
