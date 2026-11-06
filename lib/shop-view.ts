import type { CatalogStore } from "@/lib/catalog";
import type { Filters } from "@/lib/filters";
import type { PlatformLabel } from "@/lib/platforms";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";

/**
 * Extra facts the import adds onto a shop. They are optional here so the
 * page can render them after that branch merges, and skip them when absent.
 */
export type ShopView = CatalogStore & {
  country?: string;
  countryName?: string;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  otherSocials?: string[];
  hoursRaw?: string | null;
};

export type ShopLink = { label: string; href: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function httpUrl(value: unknown): string | null {
  const url = text(value);
  return /^https?:\/\//i.test(url) ? url : null;
}

export function shopCountry(store: ShopView): string {
  return text(store.country).toUpperCase();
}

export function shopCountryName(store: ShopView): string {
  const name = text(store.countryName);
  if (name) return name;
  const code = shopCountry(store);
  return code && code !== "US" ? code : "";
}

/** City and region on one line, country on its own when we actually have it. */
export function shopLocation(store: ShopView): { line: string; country: string } {
  const region = text(store.stateAbbr) || text(store.state);
  return {
    line: [text(store.city), region].filter(Boolean).join(", "),
    country: shopCountryName(store),
  };
}

/** Street, city, and country. A blank address is left out instead of guessed. */
export function formatShopPlace(store: ShopView): string {
  const address = text(store.address);
  const region = text(store.stateAbbr) || text(store.state);
  const local = [text(store.city), region].filter(Boolean).join(", ");
  const localLine = [local, text(store.zip)].filter(Boolean).join(" ");
  const country = shopCountry(store);
  const countryLabel = country && country !== "US" ? shopCountryName(store) : "";
  return [address, localLine, countryLabel].filter(Boolean).join(", ");
}

export function hasAddress(store: ShopView): boolean {
  return Boolean(text(store.address));
}

export function hasCoordinates(store: ShopView): boolean {
  return (
    typeof store.lat === "number" &&
    Number.isFinite(store.lat) &&
    typeof store.lng === "number" &&
    Number.isFinite(store.lng)
  );
}

/** Directions need a street address or map coordinates. A city name is not enough. */
export function directionsUrl(store: ShopView): string | null {
  if (hasCoordinates(store)) return `https://maps.google.com/?q=${store.lat},${store.lng}`;
  if (!hasAddress(store)) return null;
  const place = formatShopPlace(store);
  return place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : null;
}

export function socialLinks(store: ShopView): ShopLink[] {
  const links: ShopLink[] = [];
  const facebook = httpUrl(store.facebook);
  const instagram = httpUrl(store.instagram);
  const twitter = httpUrl(store.twitter);
  if (facebook) links.push({ label: "Facebook", href: facebook });
  if (instagram) links.push({ label: "Instagram", href: instagram });
  if (twitter) links.push({ label: "X", href: twitter });
  for (const item of store.otherSocials ?? []) {
    const href = httpUrl(item);
    if (href) links.push({ label: socialLabel(href), href });
  }
  return links;
}

export function hoursNote(store: ShopView): string | null {
  const note = text(store.hoursRaw);
  return note || null;
}

function socialLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("facebook.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host === "x.com" || host.includes("twitter.")) return "X";
    if (host.includes("youtube.") || host === "youtu.be") return "YouTube";
    if (host.includes("tiktok.")) return "TikTok";
    return host;
  } catch {
    return "Link";
  }
}

/** The fixture is only for an empty live catalog. Real rows always win. */
export function previewShopsFor(input: {
  liveCount: number;
  stateSlug?: string | null;
  citySlug?: string | null;
  platformLabel?: PlatformLabel | null;
  filters: Filters;
}): ShopView[] | null {
  if (input.liveCount > 0) return null;
  const query = input.filters.q.toLowerCase();
  return FIXTURE_SHOPS.filter((store) => {
    if (input.stateSlug && store.stateSlug !== input.stateSlug) return false;
    if (input.citySlug && store.citySlug !== input.citySlug) return false;
    if (input.platformLabel && !store.platforms.includes(input.platformLabel)) return false;
    if (input.filters.sellsNew && !store.sellsNew) return false;
    if (input.filters.sellsUsed && !store.sellsUsed) return false;
    if (input.filters.tradeIns && !store.tradeIns) return false;
    if (input.filters.repairs && !store.repairs) return false;
    if (input.filters.platform && !store.platforms.includes(input.filters.platform)) return false;
    if (!query) return true;
    const haystack = [store.name, store.city, store.state, store.countryName ?? "", store.country ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
