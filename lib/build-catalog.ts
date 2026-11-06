import { parseCsv } from "./csv";
import { toCatalogStore } from "./catalog";
import { countStoresByCountry } from "./country-browse";
import {
  dedupeDrafts,
  draftFromCsv,
  shopsToRows,
  type ExistingStore,
  type ShopDraft,
  type StoreRow,
  type WikidataFill,
} from "./shop-record";
import { distanceMeters, isSameShop } from "./shop-dedupe";

export type CatalogBuild = {
  csvRows: number;
  mergedGroups: number;
  rows: StoreRow[];
  dropped: number;
};

export function buildCatalog(
  csvText: string,
  fills: Record<string, WikidataFill>,
  existing: ExistingStore[] = [],
): CatalogBuild {
  const records = parseCsv(csvText);
  const drafts = records
    .map((record) => draftFromCsv(record, fills))
    .filter((shop) => shop.name && shop.source && shop.sourceId);
  const { shops, mergedGroups } = dedupeDrafts(drafts);
  return {
    csvRows: records.length,
    mergedGroups,
    rows: shopsToRows(shops, existing),
    dropped: records.length - drafts.length,
  };
}

export function catalogReport(csvRows: number, mergedGroups: number, dropped: number, rows: StoreRow[]) {
  const blank = (pick: (row: StoreRow) => string | null | undefined) =>
    rows.filter((row) => !pick(row)?.trim()).length;
  const hoursParsed = rows.filter((row) => row.opening_hours && !Array.isArray(row.opening_hours)).length;
  const hoursPresent = rows.filter((row) => row.opening_hours_raw?.trim()).length;
  const countries = countStoresByCountry(
    rows.map((row) => ({ country: row.country ?? "", countryName: row.country_name ?? "" })),
  );
  const published = rows.map((row) => toCatalogStore(row)).filter((store) => store !== null);
  const indexable = published.filter((store) => store.indexable).length;
  return {
    csv_rows: csvRows,
    listings: rows.length,
    public_listings: published.length,
    indexable_listings: indexable,
    noindex_listings: published.length - indexable,
    merged_twin_groups: mergedGroups,
    dropped_blank_names: dropped,
    rows_folded_by_dedupe: csvRows - rows.length - dropped,
    by_source: countBy(rows, (row) => row.source ?? ""),
    countries: countries.slice(0, 20),
    country_count: countries.length,
    blank: {
      address: blank((row) => row.address),
      city: blank((row) => row.city),
      region: blank((row) => row.state),
      country: blank((row) => row.country),
      phone: blank((row) => row.phone),
      website: blank((row) => row.website),
      opening_hours: blank((row) => row.opening_hours_raw),
      image: blank((row) => row.photo_url),
      social: rows.filter((row) => !row.facebook_url && !row.instagram_url && !row.twitter_url && !row.other_socials)
        .length,
    },
    opening_hours_parsed: hoursParsed,
    opening_hours_left_as_text: hoursPresent - hoursParsed,
    platforms_filled: rows.filter((row) => row.platforms.length > 0).length,
    sells_new: rows.filter((row) => row.sells_new).length,
  };
}

function countBy(rows: StoreRow[], pick: (row: StoreRow) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = pick(row) || "(blank)";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function existingFromRows(rows: StoreRow[]): ExistingStore[] {
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    source: row.source,
    sourceId: row.source_id,
    alternateSourceIds: row.alternate_source_ids ?? [],
    createdAt: row.created_at,
  }));
}

/** Cross-source shops within 40 meters that were kept as separate listings. */
export function nearMisses(drafts: ShopDraft[], limit = 30): string[] {
  const grid = new Map<string, number[]>();
  drafts.forEach((shop, index) => {
    if (shop.latitude == null || shop.longitude == null) return;
    const key = `${shop.latitude.toFixed(2)}:${shop.longitude.toFixed(2)}`;
    const bucket = grid.get(key);
    if (bucket) bucket.push(index);
    else grid.set(key, [index]);
  });
  const found: string[] = [];
  const seen = new Set<string>();
  for (const [key, indexes] of grid) {
    const [latText, lonText] = key.split(":");
    const lat = Number(latText);
    const lon = Number(lonText);
    const neighbors: number[] = [];
    for (const dLat of [-0.01, 0, 0.01]) {
      for (const dLon of [-0.01, 0, 0.01]) {
        const near = grid.get(`${(lat + dLat).toFixed(2)}:${(lon + dLon).toFixed(2)}`);
        if (near) neighbors.push(...near);
      }
    }
    for (const left of indexes) {
      for (const right of neighbors) {
        if (left >= right) continue;
        const a = drafts[left];
        const b = drafts[right];
        if (!a || !b || a.source === b.source) continue;
        if (a.latitude == null || b.latitude == null || a.longitude == null || b.longitude == null) continue;
        const meters = distanceMeters(
          { latitude: a.latitude, longitude: a.longitude },
          { latitude: b.latitude, longitude: b.longitude },
        );
        if (meters > 40 || isSameShop(a, b)) continue;
        const id = `${a.sourceId}:${b.sourceId}`;
        if (seen.has(id)) continue;
        seen.add(id);
        found.push(
          `${Math.round(meters)}m ${a.source}:${a.name} / ${b.source}:${b.name} (${a.city ?? ""} ${a.country ?? ""})`,
        );
        if (found.length >= limit) return found;
      }
    }
  }
  return found;
}
