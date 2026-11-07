import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/database.types";
import { normalizeCountry, type Country } from "@/lib/countries";
import { displayHours, WEEKDAYS } from "@/lib/hours";
import { getPlatformByLabel, type PlatformLabel } from "@/lib/platforms";
import { isPublishableStore } from "@/lib/publish";
import { stableSlug, storeSlug } from "@/lib/slug";
import { getStateFromInput } from "@/lib/states";
import { createReadClient } from "@/lib/supabase";

export type CatalogStore = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  citySlug: string;
  /** Region name. For the United States this is the state name. */
  state: string;
  /** Region slug. For the United States this is the state slug, such as "texas". */
  stateSlug: string;
  /** Short region label when one is stored, otherwise the region name. */
  stateAbbr: string;
  countryCode: string;
  countryName: string;
  countrySlug: string;
  zip: string | null;
  phone: string | null;
  website: string | null;
  about: string | null;
  hours: Record<string, string> | null;
  platforms: PlatformLabel[];
  sellsNew: boolean;
  sellsUsed: boolean;
  tradeIns: boolean;
  repairs: boolean;
  lat: number | null;
  lng: number | null;
  photo: string | null;
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

function shortRegionCode(value: string): string | null {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9]{2,3}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

/** Strings from the import can be null. Never call trim on a null field. */
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type StoredPlace = StoreRow & {
  country_name?: string | null;
  region_slug?: string | null;
  state_slug?: string | null;
};

function countryOf(row: StoreRow): Country {
  const fromCode = normalizeCountry(text(row.country));
  if (fromCode.code || fromCode.name) return fromCode;
  const storedName = text((row as StoredPlace).country_name);
  if (!storedName) return fromCode;
  return normalizeCountry(storedName);
}

/** The import already folded accents and Tirana/Tiranë. Keep that slug. */
function storedRegionSlug(row: StoreRow): string {
  const place = row as StoredPlace;
  return text(place.region_slug) || text(place.state_slug);
}

export function toCatalogStore(row: StoreRow): CatalogStore | null {
  const country = countryOf(row);
  const name = text(row.name);
  const address = text(row.address);
  const city = text(row.city);
  const regionRaw = text(row.state);
  const lat = finiteOrNull(row.latitude);
  const lng = finiteOrNull(row.longitude);

  if (!isPublishableStore({ name, country: country.code || country.name })) return null;

  let regionName = "";
  let regionSlug = "";
  let regionAbbr = "";
  if (regionRaw && country.code === "US") {
    const state = getStateFromInput(regionRaw);
    if (state) {
      regionName = state.name;
      regionSlug = state.slug;
      regionAbbr = state.abbreviation;
    } else {
      regionName = regionRaw;
      regionSlug = storedRegionSlug(row);
      regionAbbr = shortRegionCode(regionRaw) ?? "";
    }
  } else if (regionRaw) {
    regionName = regionRaw;
    regionSlug = storedRegionSlug(row) || stableSlug(regionRaw);
    regionAbbr = shortRegionCode(regionRaw) ?? regionName;
  }

  const slug =
    text(row.slug) ||
    storeSlug(name, city, country.code === "US" ? regionAbbr || regionSlug : regionSlug, country.code);
  if (!slug) return null;

  const platforms = [
    ...new Set(
      (row.platforms ?? [])
        .map((item) => getPlatformByLabel(item)?.label)
        .filter((item): item is PlatformLabel => Boolean(item)),
    ),
  ];

  return {
    id: row.id,
    slug,
    name,
    address,
    city,
    citySlug: text(row.city_slug) || (city ? stableSlug(city) : ""),
    state: regionName,
    stateSlug: regionSlug,
    stateAbbr: regionAbbr,
    countryCode: country.code,
    countryName: country.name,
    countrySlug: country.slug,
    zip: text(row.zip_code) || null,
    phone: text(row.phone) || null,
    website: text(row.website) || null,
    about: text(row.about) || null,
    hours: readHours(row.opening_hours),
    platforms,
    sellsNew: row.sells_new,
    sellsUsed: row.sells_used,
    tradeIns: row.accepts_trade_ins,
    repairs: row.repairs_consoles,
    lat,
    lng,
    photo: text(row.photo_url) || null,
    updatedAt: text(row.updated_at) || text(row.created_at),
  };
}

function rowsToCatalog(rows: StoreRow[], configured: boolean): CatalogResult {
  const parsed: CatalogStore[] = [];
  for (const row of rows) {
    if (row.is_active === false) continue;
    const store = toCatalogStore(row);
    if (store) parsed.push(store);
  }
  const stores = assignUniqueSlugs(parsed).sort((a, b) => a.name.localeCompare(b.name, "en"));
  return { ok: true, configured, stores };
}

/** The import branch writes this file. It is used only when the database is not connected. */
function readStoresFile(): StoreRow[] | null {
  const file = path.join(process.cwd(), "data", "stores.json");
  if (!existsSync(file)) return null;
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) return null;
  return parsed as StoreRow[];
}

const FILE_TTL_MS = 86_400_000;
let fileCache: { at: number; result: CatalogResult } | null = null;

function loadStoresFile(): CatalogResult | null {
  if (!existsSync(path.join(process.cwd(), "data", "stores.json"))) return null;
  if (fileCache && Date.now() - fileCache.at < FILE_TTL_MS) return fileCache.result;
  try {
    const rows = readStoresFile();
    if (!rows) return { ok: true, configured: false, stores: [] };
    const result = rowsToCatalog(rows, true);
    fileCache = { at: Date.now(), result };
    return result;
  } catch (error) {
    console.error(error);
    return { ok: false, error: "The store list could not be loaded." };
  }
}

async function readCatalog(): Promise<CatalogResult> {
  const supabase = createReadClient();
  if (!supabase) {
    return loadStoresFile() ?? { ok: true, configured: false, stores: [] };
  }

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

function sameShop(a: CatalogStore, b: CatalogStore): boolean {
  if (!a.address || !b.address) return false;
  return (
    a.name === b.name &&
    a.address === b.address &&
    a.city === b.city &&
    a.countrySlug === b.countrySlug &&
    a.stateSlug === b.stateSlug
  );
}

/**
 * Each shop gets one slug. The same shop imported twice keeps the newer row.
 * Two different shops that would share a slug get a stable extra ending from the id.
 */
export function assignUniqueSlugs(stores: CatalogStore[]): CatalogStore[] {
  const ordered = [...stores].sort((a, b) => a.id.localeCompare(b.id));
  const kept: CatalogStore[] = [];
  const bySlug = new Map<string, CatalogStore>();

  for (const store of ordered) {
    const existing = bySlug.get(store.slug);
    if (!existing) {
      bySlug.set(store.slug, store);
      kept.push(store);
      continue;
    }
    if (sameShop(existing, store)) {
      if (existing.updatedAt <= store.updatedAt) {
        const index = kept.indexOf(existing);
        if (index >= 0) kept[index] = store;
        bySlug.set(store.slug, store);
      }
      continue;
    }
    const suffix = store.id.replace(/-/g, "").slice(0, 8);
    let slug = `${store.slug}-${suffix}`;
    while (bySlug.has(slug)) slug = `${slug}-${suffix}`;
    const unique = { ...store, slug };
    bySlug.set(slug, unique);
    kept.push(unique);
  }

  return kept;
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
 * React cache() shares one read between the page and its metadata in the same visit.
 */
export const loadCatalog = cache(async function loadCatalog(): Promise<CatalogResult> {
  if (!createReadClient()) {
    return loadStoresFile() ?? { ok: true, configured: false, stores: [] };
  }
  // A thrown error is not saved as a successful empty directory.
  return loadCachedCatalog();
});
