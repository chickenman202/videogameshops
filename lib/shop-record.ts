import { createHash } from "node:crypto";
import type { Database } from "./database.types";
import { cleanShopName } from "./display-name";
import { TAIWAN_CITY_ALIASES, groupPlaceNames, placeSlug, readablePlace, writtenPlaceKey } from "./place-fold";
import { slugify, storeSlug } from "./slug";
import { canonicalRegion, usStateFor } from "./regions";
import { aboutFromShopInfo } from "./shop-details";
import { parseOsmOpeningHours } from "./osm-hours";
import { clusterShops, compactName, type DedupeShop } from "./shop-dedupe";

export type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

export type WikidataFill = {
  country?: string;
  country_name?: string;
  address_line?: string;
  city?: string;
  note: string;
};

/** One shop after cleaning, before two sources are folded together. */
export type ShopDraft = {
  name: string;
  brand: string | null;
  address: string | null;
  city: string | null;
  region: string;
  postalCode: string | null;
  country: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  websiteDomain: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  otherSocials: string[];
  imageUrl: string | null;
  openingHoursRaw: string | null;
  openingHours: Record<string, string> | null;
  storeInfo: string | null;
  source: string;
  sourceId: string;
  osmUrl: string | null;
  wikidataUrl: string | null;
  fetchedAt: string | null;
  dataUpdatedAt: string | null;
  enrichmentNotes: string | null;
  /** Other source:sourceId values folded into this shop. */
  alternateIdentities: string[];
};

export type ExistingStore = {
  id: string;
  slug: string;
  source: string | null;
  sourceId: string | null;
  alternateSourceIds: string[];
  createdAt: string;
};

const SOURCE_RANK: Record<string, number> = {
  osm: 0,
  gameroute: 1,
  dallasretrogamers: 2,
  wikidata: 3,
};

export function blankToNull(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  return text ? text : null;
}

export function httpUrl(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function domainFromWebsite(website: string | null, given: string | null): string | null {
  const fromFile = blankToNull(given)?.toLowerCase().replace(/^www\./, "") ?? null;
  if (fromFile) return fromFile;
  if (!website) return null;
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function numberOrNull(value: string | null | undefined): number | null {
  const text = value?.trim() ?? "";
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function timestampOrNull(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  if (!text) return null;
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function qidFrom(sourceId: string, wikidataUrl: string): string | null {
  if (/^Q\d+$/i.test(sourceId)) return sourceId.toUpperCase();
  const match = wikidataUrl.match(/Q\d+/i);
  return match?.[0]?.toUpperCase() ?? null;
}

export function draftFromCsv(record: Record<string, string>, fills: Record<string, WikidataFill>): ShopDraft {
  const notes: string[] = [];
  const addNote = (note: string | null | undefined) => {
    const text = note?.trim();
    if (text) notes.push(text);
  };
  addNote(record.enrichment_notes);

  let country = blankToNull(record.country)?.toUpperCase() ?? null;
  let countryName = blankToNull(record.country_name);
  let address = blankToNull(record.address_line);
  let city = blankToNull(record.city);
  const qid = qidFrom(record.source_id ?? "", record.wikidata_url ?? "");
  const fill = qid ? fills[qid] : undefined;
  if (fill) {
    if (!country && fill.country) country = fill.country.toUpperCase();
    if (!countryName && fill.country_name) countryName = fill.country_name;
    if (!address && fill.address_line) address = fill.address_line;
    if (!city && fill.city) city = fill.city;
    if (
      (!record.country?.trim() && fill.country) ||
      (!record.address_line?.trim() && fill.address_line) ||
      (!record.city?.trim() && fill.city)
    ) {
      addNote(fill.note);
    }
  }

  const website = httpUrl(record.website);
  const otherSocials = (record.other_socials ?? "")
    .split("|")
    .map((item) => httpUrl(item))
    .filter((item): item is string => Boolean(item));
  const hoursRaw = blankToNull(record.opening_hours);

  return {
    name: (record.store_name ?? "").trim(),
    brand: blankToNull(record.brand_or_chain),
    address,
    city,
    region: canonicalRegion(country, record.state_region ?? ""),
    postalCode: blankToNull(record.postal_code),
    country,
    countryName,
    latitude: numberOrNull(record.latitude),
    longitude: numberOrNull(record.longitude),
    phone: blankToNull(record.phone),
    website,
    websiteDomain: domainFromWebsite(website, record.website_domain ?? null),
    facebook: httpUrl(record.facebook_url),
    instagram: httpUrl(record.instagram_url),
    twitter: httpUrl(record.twitter_url),
    otherSocials: [...new Set(otherSocials)],
    imageUrl: httpUrl(record.image_url),
    openingHoursRaw: hoursRaw,
    openingHours: parseOsmOpeningHours(hoursRaw),
    storeInfo: blankToNull(record.store_info),
    source: (record.source ?? "").trim(),
    sourceId: (record.source_id ?? "").trim(),
    osmUrl: httpUrl(record.osm_url),
    wikidataUrl: httpUrl(record.wikidata_url),
    fetchedAt: timestampOrNull(record.fetched_at),
    dataUpdatedAt: timestampOrNull(record.data_updated_at),
    enrichmentNotes: notes.length ? notes.join("; ") : null,
    alternateIdentities: [],
  };
}

function richness(shop: ShopDraft): number {
  return [
    shop.address,
    shop.city,
    shop.region,
    shop.postalCode,
    shop.phone,
    shop.website,
    shop.openingHoursRaw,
    shop.imageUrl,
    shop.facebook,
    shop.instagram,
    shop.latitude,
  ].filter((value) => value != null && value !== "").length;
}

function preferText(primary: string | null, extra: string | null): { value: string | null; conflict: string | null } {
  if (!primary) return { value: extra, conflict: null };
  if (!extra) return { value: primary, conflict: null };
  const a = compactName(primary);
  const b = compactName(extra);
  if (!a || !b || a === b || a.includes(b)) return { value: primary, conflict: null };
  if (b.includes(a)) return { value: extra, conflict: null };
  return { value: primary, conflict: extra };
}

function latest(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

export function mergeDrafts(drafts: ShopDraft[]): ShopDraft {
  if (drafts.length === 1) return drafts[0] as ShopDraft;
  const ranked = [...drafts].sort((left, right) => {
    const byFacts = richness(right) - richness(left);
    if (byFacts !== 0) return byFacts;
    const bySource = (SOURCE_RANK[left.source] ?? 9) - (SOURCE_RANK[right.source] ?? 9);
    if (bySource !== 0) return bySource;
    return left.sourceId.localeCompare(right.sourceId);
  });
  const primary = { ...(ranked[0] as ShopDraft) };
  const notes = [primary.enrichmentNotes].filter(Boolean) as string[];
  const alternates = new Set(primary.alternateIdentities);

  for (const extra of ranked.slice(1)) {
    notes.push(`merged_with=${extra.source}:${extra.sourceId}`);
    alternates.add(`${extra.source}:${extra.sourceId}`);
    for (const identity of extra.alternateIdentities) alternates.add(identity);
    const address = preferText(primary.address, extra.address);
    if (address.conflict) notes.push(`also_address=${extra.sourceId}: ${address.conflict}`);
    primary.address = address.value;
    const phone = preferText(primary.phone, extra.phone);
    if (phone.conflict) notes.push(`also_phone=${extra.sourceId}: ${phone.conflict}`);
    primary.phone = phone.value;
    if (compactName(extra.name) && compactName(extra.name) !== compactName(primary.name)) {
      notes.push(`also_named=${extra.name}`);
    }
    primary.brand ??= extra.brand;
    primary.city ??= extra.city;
    if (!primary.region) primary.region = extra.region;
    primary.postalCode ??= extra.postalCode;
    primary.country ??= extra.country;
    primary.countryName ??= extra.countryName;
    primary.latitude ??= extra.latitude;
    primary.longitude ??= extra.longitude;
    primary.website ??= extra.website;
    primary.websiteDomain ??= extra.websiteDomain;
    primary.facebook ??= extra.facebook;
    primary.instagram ??= extra.instagram;
    primary.twitter ??= extra.twitter;
    primary.otherSocials = [...new Set([...primary.otherSocials, ...extra.otherSocials])];
    primary.imageUrl ??= extra.imageUrl;
    primary.openingHoursRaw ??= extra.openingHoursRaw;
    primary.openingHours ??= extra.openingHours;
    if (!primary.storeInfo) primary.storeInfo = extra.storeInfo;
    else if (extra.storeInfo && extra.storeInfo !== primary.storeInfo) {
      primary.storeInfo = `${primary.storeInfo} | ${extra.storeInfo}`;
    }
    primary.osmUrl ??= extra.osmUrl;
    primary.wikidataUrl ??= extra.wikidataUrl;
    primary.fetchedAt = latest(primary.fetchedAt, extra.fetchedAt);
    primary.dataUpdatedAt = latest(primary.dataUpdatedAt, extra.dataUpdatedAt);
    if (extra.enrichmentNotes) notes.push(extra.enrichmentNotes);
  }

  primary.enrichmentNotes = notes.filter(Boolean).join("; ") || null;
  primary.alternateIdentities = [...alternates];
  return primary;
}

export function dedupeDrafts(drafts: ShopDraft[]): { shops: ShopDraft[]; mergedGroups: number } {
  const clusters = clusterShops(drafts.map(toDedupeShop));
  let mergedGroups = 0;
  const shops = clusters.map((indexes) => {
    const group = indexes.map((index) => drafts[index]).filter((item): item is ShopDraft => Boolean(item));
    if (group.length > 1) mergedGroups += 1;
    return mergeDrafts(group);
  });
  return { shops, mergedGroups };
}

function toDedupeShop(shop: ShopDraft): DedupeShop {
  return {
    source: shop.source,
    sourceId: shop.sourceId,
    name: shop.name,
    country: shop.country,
    address: shop.address,
    latitude: shop.latitude,
    longitude: shop.longitude,
    websiteDomain: shop.websiteDomain,
    phone: shop.phone,
  };
}

function identityOf(source: string | null, sourceId: string | null): string | null {
  if (!source || !sourceId) return null;
  return `${source}:${sourceId}`;
}

export function uuidFromIdentity(identity: string): string {
  const namespace = Buffer.from("6ba7b8109dad11d180b400c04fd430c8", "hex");
  const hash = createHash("sha1");
  hash.update(namespace);
  hash.update(`videogameshops:${identity}`);
  const bytes = Buffer.from(hash.digest().subarray(0, 16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * A shop keeps the slug it already has.
 * A new United States shop uses name-city-state. A shop in another country uses name-city-country.
 * If that slug is already taken, the source id is added. If that is taken too, a number is added.
 * Running the import again does not create a second row for the same shop.
 */
export const SLUG_RULE =
  "A shop keeps the slug it already has. A new United States shop uses name-city-state. A shop in another country uses name-city-country. If that slug is already taken, the source id is added, then a number if needed. Running the import again does not create a second row for the same shop.";

function desiredSlug(shop: ShopDraft): string {
  const us = shop.country ? usStateFor(shop.country, shop.region) : null;
  const namePart = slugify(shop.name);
  if (shop.country === "US") {
    const base = storeSlug(shop.name, shop.city ?? "", us?.abbreviation || "us");
    if (namePart && base) return base;
  }
  const base = slugify(`${shop.name}-${shop.city ?? ""}-${shop.country ?? "shop"}`);
  if (namePart && base) return base;
  return slugify(`${shop.city ?? "shop"}-${shop.country ?? "shop"}-${shop.sourceId}`) || slugify(shop.sourceId);
}

function memberIdentities(shop: ShopDraft): string[] {
  const primary = identityOf(shop.source, shop.sourceId);
  return [...new Set([primary, ...shop.alternateIdentities].filter((item): item is string => Boolean(item)))];
}

/**
 * City slugs for one import. Names are grouped inside a country and region.
 * The city text on the shop is not changed.
 */
function foldedCitySlugs(shops: ShopDraft[]): string[] {
  const regionNames = new Map<string, string[]>();
  for (const shop of shops) {
    const region = shop.region?.trim() ?? "";
    if (!region) continue;
    const country = shop.country ?? "";
    const list = regionNames.get(country) ?? [];
    list.push(region);
    regionNames.set(country, list);
  }
  const regionSlug = new Map<string, Map<string, string>>();
  for (const [country, names] of regionNames) regionSlug.set(country, groupPlaceNames(names));

  const buckets = new Map<string, string[]>();
  const bucketKeys: string[] = [];
  for (const shop of shops) {
    const city = shop.city?.trim() ?? "";
    const country = shop.country ?? "";
    const region = shop.region?.trim() ?? "";
    const regionKey = region ? (regionSlug.get(country)?.get(region) ?? placeSlug(region)) : "";
    const bucket = `${country}\n${regionKey}`;
    bucketKeys.push(city ? bucket : "");
    if (!city) continue;
    const list = buckets.get(bucket) ?? [];
    list.push(city);
    buckets.set(bucket, list);
  }
  const citySlug = new Map<string, Map<string, string>>();
  for (const [bucket, names] of buckets) citySlug.set(bucket, groupPlaceNames(names));

  const slugs = shops.map((shop, index) => {
    const city = shop.city?.trim() ?? "";
    const bucket = bucketKeys[index] ?? "";
    if (!city || !bucket) return "";
    return citySlug.get(bucket)?.get(city) ?? placeSlug(city);
  });
  // The same written city can sit in a blank region and in a named one.
  // 臺 and 台 still share one slug. The a/e rule stays inside each region.
  const written = new Map<string, number[]>();
  shops.forEach((shop, index) => {
    const city = shop.city?.trim() ?? "";
    if (!city || !slugs[index]) return;
    const key = `${shop.country ?? ""}\n${writtenPlaceKey(city)}`;
    const list = written.get(key) ?? [];
    list.push(index);
    written.set(key, list);
  });
  for (const indexes of written.values()) {
    if (new Set(indexes.map((index) => slugs[index])).size < 2) continue;
    const counts = new Map<string, number>();
    for (const index of indexes) {
      const city = shops[index]?.city?.trim() ?? "";
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
    const best = [...counts.entries()].sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"),
    )[0]?.[0];
    if (!best) continue;
    const slug = placeSlug(best);
    for (const index of indexes) slugs[index] = slug;
  }
  // English Taipei, Taichung, and Tainan join the Chinese page already chosen.
  // The shop's own city text is not rewritten.
  for (const group of TAIWAN_CITY_ALIASES) {
    const local = new Set<string>(group.local);
    const english = new Set<string>(group.english);
    const indexes = shops.flatMap((shop, index) => {
      const city = shop.city?.trim() ?? "";
      if (shop.country !== "TW" || !city || !slugs[index]) return [];
      if (!local.has(city) && !english.has(city)) return [];
      return [index];
    });
    const localIndexes = indexes.filter((index) => local.has(shops[index]?.city?.trim() ?? ""));
    if (localIndexes.length === 0 || indexes.length === localIndexes.length) continue;
    const counts = new Map<string, number>();
    for (const index of localIndexes) {
      const city = shops[index]?.city?.trim() ?? "";
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
    const best = [...counts.entries()].sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"),
    )[0]?.[0];
    if (!best) continue;
    const slug = placeSlug(best);
    for (const index of indexes) slugs[index] = slug;
  }
  return slugs;
}

export function shopsToRows(shops: ShopDraft[], existing: ExistingStore[]): StoreRow[] {
  const byIdentity = new Map<string, ExistingStore>();
  for (const row of existing) {
    const primary = identityOf(row.source, row.sourceId);
    if (primary) byIdentity.set(primary, row);
    for (const alternate of row.alternateSourceIds) byIdentity.set(alternate, row);
  }

  const prepared = shops.map((shop) => {
    const identities = memberIdentities(shop);
    const matches = identities
      .map((identity) => byIdentity.get(identity))
      .filter((item): item is ExistingStore => Boolean(item));
    const uniqueMatches = [...new Map(matches.map((item) => [item.id, item])).values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
    const kept = uniqueMatches[0] ?? null;
    return { shop, identities, kept };
  });

  const used = new Set<string>();
  const slugs = new Array<string>(prepared.length).fill("");
  prepared.forEach((item, index) => {
    if (!item.kept) return;
    if (used.has(item.kept.slug)) return;
    slugs[index] = item.kept.slug;
    used.add(item.kept.slug);
  });
  prepared.forEach((item, index) => {
    if (slugs[index]) return;
    const suffix = slugify(item.shop.sourceId) || "shop";
    let candidate = desiredSlug(item.shop);
    if (!candidate || used.has(candidate)) candidate = `${desiredSlug(item.shop) || "shop"}-${suffix}`;
    let extra = 2;
    while (used.has(candidate)) {
      candidate = `${desiredSlug(item.shop) || "shop"}-${suffix}-${extra}`;
      extra += 1;
    }
    slugs[index] = candidate;
    used.add(candidate);
  });

  const citySlugs = foldedCitySlugs(prepared.map((item) => item.shop));
  return prepared.map((item, index) => {
    const alternates = item.identities.filter((identity) => identity !== identityOf(item.shop.source, item.shop.sourceId));
    const stamp = item.shop.dataUpdatedAt ?? item.shop.fetchedAt ?? new Date(0).toISOString();
    return {
      id: item.kept?.id ?? uuidFromIdentity(identityOf(item.shop.source, item.shop.sourceId) ?? item.shop.sourceId),
      slug: slugs[index] ?? slugify(item.shop.sourceId),
      name: item.shop.name,
      address: item.shop.address,
      city: item.shop.city ? readablePlace(item.shop.city) : null,
      city_slug: citySlugs[index] ?? "",
      state: item.shop.region ? readablePlace(item.shop.region) || null : null,
      zip_code: item.shop.postalCode,
      country: item.shop.country,
      country_name: item.shop.countryName,
      phone: item.shop.phone,
      latitude: item.shop.latitude,
      longitude: item.shop.longitude,
      website: item.shop.website,
      website_domain: item.shop.websiteDomain,
      about: aboutFromShopInfo(item.shop.storeInfo),
      opening_hours: item.shop.openingHours as StoreRow["opening_hours"],
      opening_hours_raw: item.shop.openingHoursRaw,
      platforms: cleanShopName(item.shop.name).platforms,
      sells_new: false,
      sells_used: false,
      accepts_trade_ins: false,
      repairs_consoles: false,
      is_active: true,
      google_place_id: null,
      photo_url: item.shop.imageUrl,
      brand: item.shop.brand,
      facebook_url: item.shop.facebook,
      instagram_url: item.shop.instagram,
      twitter_url: item.shop.twitter,
      other_socials: item.shop.otherSocials.length ? item.shop.otherSocials.join(" | ") : null,
      store_info: item.shop.storeInfo,
      source: item.shop.source,
      source_id: item.shop.sourceId,
      osm_url: item.shop.osmUrl,
      wikidata_url: item.shop.wikidataUrl,
      fetched_at: item.shop.fetchedAt,
      data_updated_at: item.shop.dataUpdatedAt,
      enrichment_notes: item.shop.enrichmentNotes,
      alternate_source_ids: alternates,
      created_at: item.shop.fetchedAt ?? stamp,
      updated_at: stamp,
    };
  });
}
