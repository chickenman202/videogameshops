import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/database.types";
import { displayHours, WEEKDAYS } from "@/lib/hours";
import { getPlatformByLabel, type PlatformLabel } from "@/lib/platforms";
import { isPublishableStore } from "@/lib/publish";
import { slugify, storeSlug } from "@/lib/slug";
import { getStateFromInput } from "@/lib/states";
import { createReadClient } from "@/lib/supabase";

export type CatalogStore = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  citySlug: string;
  state: string;
  stateSlug: string;
  stateAbbr: string;
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

export function toCatalogStore(row: StoreRow): CatalogStore | null {
  const state = row.state ? getStateFromInput(row.state) : null;
  if (!state) return null;
  const name = row.name.trim();
  const address = row.address.trim();
  const city = row.city.trim();
  if (!isPublishableStore({ name, address, city, state: state.name })) return null;

  const slug = row.slug.trim() || storeSlug(name, city, state.abbreviation);
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
    citySlug: row.city_slug?.trim() || slugify(city),
    state: state.name,
    stateSlug: state.slug,
    stateAbbr: state.abbreviation,
    zip: row.zip_code?.trim() || null,
    phone: row.phone?.trim() || null,
    website: row.website?.trim() || null,
    about: row.about?.trim() || null,
    hours: readHours(row.opening_hours),
    platforms,
    sellsNew: row.sells_new,
    sellsUsed: row.sells_used,
    tradeIns: row.accepts_trade_ins,
    repairs: row.repairs_consoles,
    lat: finiteOrNull(row.latitude),
    lng: finiteOrNull(row.longitude),
    photo: row.photo_url?.trim() || null,
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

  const bySlug = new Map<string, CatalogStore>();
  for (const row of rows) {
    const store = toCatalogStore(row);
    if (!store) continue;
    const existing = bySlug.get(store.slug);
    if (!existing || existing.updatedAt < store.updatedAt) bySlug.set(store.slug, store);
  }

  const stores = [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
  return { ok: true, configured: true, stores };
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
    return { ok: true, configured: false, stores: [] };
  }
  // A thrown error is not saved as a successful empty directory.
  return loadCachedCatalog();
}
