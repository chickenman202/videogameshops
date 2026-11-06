import { readFileSync } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/database.types";
import { displayHours, WEEKDAYS } from "@/lib/hours";
import { readableShopInfo } from "@/lib/shop-details";
import { getPlatformByLabel, type PlatformLabel } from "@/lib/platforms";
import { sourceLabel } from "@/lib/place";
import { normalizeCountry } from "@/lib/countries";
import { placeSlug } from "@/lib/place-fold";
import { slugify, storeSlug } from "@/lib/slug";
import { usStateFor } from "@/lib/regions";
import { createReadClient } from "@/lib/supabase";

export type CatalogStore = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  citySlug: string;
  /** Region name. For a US shop this is the state name. */
  state: string;
  /** Set only when the shop has a US state page. */
  stateSlug: string;
  stateAbbr: string;
  zip: string | null;
  /** ISO 3166-1 alpha-2, uppercase. Same value as `country`. */
  countryCode: string;
  country: string;
  /** Country name already stored on the row. Used in titles, not in the URL. */
  countryName: string;
  /** Lowercase ISO code, such as "fr" or "us". This is the country URL. */
  countrySlug: string;
  /** Region URL piece. US states use the state slug. Blank when the row has no region. */
  regionSlug: string;
  /**
   * True when the shop has a street, a phone, or a website.
   * Thin shops stay in the catalog but are noindex and left out of the sitemap.
   */
  indexable: boolean;
  phone: string | null;
  website: string | null;
  about: string | null;
  /** Short note from the source, when it is not already the about text. */
  details: string | null;
  hours: Record<string, string> | null;
  hoursRaw: string | null;
  platforms: PlatformLabel[];
  sellsNew: boolean;
  sellsUsed: boolean;
  tradeIns: boolean;
  repairs: boolean;
  lat: number | null;
  lng: number | null;
  photo: string | null;
  brand: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  otherSocials: string[];
  source: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  updatedAt: string;
};

export type CatalogResult =
  | { ok: true; configured: boolean; stores: CatalogStore[] }
  | { ok: false; error: string };

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

function readHours(value: StoreRow["opening_hours"]): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const hours: Record<string, string> = {};
  for (const [key] of WEEKDAYS) {
    const raw = record[key];
    if (typeof raw === "string" && raw.trim()) hours[key] = displayHours(raw);
  }
  return Object.keys(hours).length > 0 ? hours : null;
}

function finiteOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function httpList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

/** A shop can be indexed once it has a street, a phone, or a website. City alone is not enough. */
export function shopIsIndexable(input: {
  address?: string | null;
  phone?: string | null;
  website?: string | null;
}): boolean {
  return Boolean(input.address?.trim() || input.phone?.trim() || input.website?.trim());
}

/**
 * Every named shop stays in the list, including shops outside the US
 * and shops with no street address. Platforms stay empty unless the row
 * already names a known platform. Nothing is guessed.
 */
export function toCatalogStore(row: StoreRow): CatalogStore | null {
  const name = row.name?.trim() ?? "";
  if (!name) return null;
  const storedCountry = row.country?.trim() ?? "";
  const normalized = normalizeCountry(storedCountry);
  const country = normalized.code || storedCountry.toUpperCase();
  const city = row.city?.trim() ?? "";
  const region = row.state?.trim() ?? "";
  const us = country === "US" ? usStateFor(country, region) : null;
  const regionSlug = us?.slug || (region ? placeSlug(region) : "");
  const slug =
    row.slug?.trim() ||
    storeSlug(name, city, us?.abbreviation || country || "shop") ||
    slugify(row.source_id ?? "");
  if (!slug) return null;

  const platforms = [
    ...new Set(
      (row.platforms ?? [])
        .map((item) => getPlatformByLabel(item)?.label)
        .filter((item): item is PlatformLabel => Boolean(item)),
    ),
  ];
  const about = row.about?.trim() || null;
  const detailsText = readableShopInfo(row.store_info);
  const source = row.source?.trim() || null;

  return {
    id: row.id,
    slug,
    name,
    address: row.address?.trim() ?? "",
    city,
    citySlug: row.city_slug?.trim() || (city ? placeSlug(city) : ""),
    state: us?.name || region,
    stateSlug: us?.slug ?? "",
    regionSlug,
    stateAbbr: us?.abbreviation ?? "",
    zip: row.zip_code?.trim() || null,
    countryCode: country,
    country,
    countryName: row.country_name?.trim() || normalized.name,
    countrySlug: normalized.slug,
    indexable: shopIsIndexable({
      address: row.address,
      phone: row.phone,
      website: row.website,
    }),
    phone: row.phone?.trim() || null,
    website: row.website?.trim() || null,
    about,
    details: detailsText && detailsText !== about ? detailsText : null,
    hours: readHours(row.opening_hours),
    hoursRaw: row.opening_hours_raw?.trim() || null,
    platforms,
    sellsNew: row.sells_new,
    sellsUsed: row.sells_used,
    tradeIns: row.accepts_trade_ins,
    repairs: row.repairs_consoles,
    lat: finiteOrNull(row.latitude),
    lng: finiteOrNull(row.longitude),
    photo: row.photo_url?.trim() || null,
    brand: row.brand?.trim() || null,
    facebook: row.facebook_url?.trim() || null,
    instagram: row.instagram_url?.trim() || null,
    twitter: row.twitter_url?.trim() || null,
    otherSocials: httpList(row.other_socials),
    source,
    sourceLabel: sourceLabel(source),
    sourceUrl: row.osm_url?.trim() || row.wikidata_url?.trim() || null,
    updatedAt: row.updated_at,
  };
}

async function readCatalog(): Promise<CatalogResult> {
  const supabase = createReadClient();
  if (!supabase) return { ok: true, configured: false, stores: [] };

  const batch = 1000;
  const rows: StoreRow[] = [];
  for (let from = 0; from < 100000; from += batch) {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .range(from, from + batch - 1);

    if (error) {
      console.error(error.message);
      return { ok: false, error: "The store list could not be loaded." };
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < batch) break;
    if (from + batch >= 100000) {
      return { ok: false, error: "The store list could not be loaded." };
    }
  }

  return rowsToCatalog(rows, true);
}

function rowsToCatalog(rows: StoreRow[], configured: boolean): CatalogResult {
  const bySlug = new Map<string, CatalogStore>();
  for (const row of rows) {
    const store = toCatalogStore(row);
    if (!store) continue;
    const existing = bySlug.get(store.slug);
    if (!existing || existing.updatedAt < store.updatedAt) bySlug.set(store.slug, store);
  }

  const stores = [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
  return { ok: true, configured, stores };
}

function readFallbackRows(): StoreRow[] {
  const file = path.join(process.cwd(), "data", "stores.json");
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("Shop catalog file is not a list.");
  return parsed as StoreRow[];
}

const loadCachedCatalog = unstable_cache(
  async () => {
    const result = await readCatalog();
    if (!result.ok) throw new Error(result.error);
    if (!result.configured) throw new Error("The store database is not connected.");
    return result;
  },
  ["videogameshops-catalog"],
  { revalidate: 86400 },
);

/**
 * A successful list is reused for about a day.
 * A failed read is not saved, so a timeout cannot become a fake empty city.
 */
export async function loadCatalog(): Promise<CatalogResult> {
  if (!createReadClient()) {
    try {
      return rowsToCatalog(readFallbackRows(), true);
    } catch (error) {
      console.error(error);
      return { ok: false, error: "The store list could not be loaded." };
    }
  }
  // A thrown error is not saved as a successful empty directory.
  return loadCachedCatalog();
}
