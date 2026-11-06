import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { buildCatalog, existingFromRows } from "./build-catalog";
import { shopIsIndexable, toCatalogStore } from "./catalog";
import { countryEntries, regionLinks } from "./country-browse";
import { COUNTRY_URL_SCHEME } from "./country-route";
import { countryBySlug, normalizeCountry } from "./countries";
import { NEAR_MISS_RULE, reviewNearMisses } from "./near-miss-review";
import { parseOsmOpeningHours } from "./osm-hours";
import { countryPath, statePath, unitedStatesDirectoryPath } from "./paths";
import { canonicalRegion } from "./regions";
import { isSameShop, namesSimilar } from "./shop-dedupe";
import { shopsToRows, SLUG_RULE, type ShopDraft, type StoreRow, type WikidataFill } from "./shop-record";
import { stableSlug } from "./slug";

const root = path.join(import.meta.dirname, "..");

describe("country urls", () => {
  it("uses the ISO code and sends uk and usa to the official code", () => {
    assert.equal(countryBySlug("fr")?.country.code, "FR");
    assert.equal(countryBySlug("fr")?.country.slug, "fr");
    assert.equal(countryBySlug("fr")?.redirectSlug, null);
    assert.equal(countryBySlug("uk")?.redirectSlug, "gb");
    assert.equal(countryBySlug("uk")?.country.code, "GB");
    assert.equal(countryBySlug("usa")?.redirectSlug, "us");
    assert.equal(countryBySlug("usa")?.country.code, "US");
    assert.equal(countryPath("fr"), "/directory/countries/fr");
    assert.equal(COUNTRY_URL_SCHEME.canonical, "/directory/countries/{iso2}");
  });

  it("keeps a blank country blank", () => {
    assert.equal(normalizeCountry("").code, "");
    assert.equal(normalizeCountry("").slug, "");
    assert.equal(normalizeCountry(null).code, "");
    assert.equal(normalizeCountry("   ").name, "");
    assert.notEqual(normalizeCountry("").code, "US");
    const row = shopsToRows([draft("node/blank", { country: null, countryName: null, name: "No Country Shop" })], []);
    assert.equal(row[0]?.country, null);
  });

  it("sends a US state under /directory/countries/us to the state page", () => {
    assert.equal(unitedStatesDirectoryPath({ regionSlug: "texas" }), "/directory/texas");
    assert.equal(unitedStatesDirectoryPath({ regionSlug: "texas", page: 2 }), "/directory/texas/page/2");
    assert.equal(statePath("georgia"), "/directory/georgia");
    assert.equal(countryPath("ge"), "/directory/countries/ge");
    assert.equal(countryBySlug("georgia")?.redirectSlug, "ge");
    assert.notEqual(countryPath("ge"), statePath("georgia"));
  });

  it("marks a shop indexable only when it has a street, phone, or website", () => {
    assert.equal(shopIsIndexable({ address: "", phone: "", website: "" }), false);
    assert.equal(shopIsIndexable({ address: "  ", phone: null, website: null }), false);
    assert.equal(shopIsIndexable({ address: "1 Main St", phone: "", website: "" }), true);
    assert.equal(shopIsIndexable({ address: "", phone: "555-0100", website: "" }), true);
    assert.equal(shopIsIndexable({ address: "", phone: "", website: "https://example.com" }), true);
  });

  it("gives two shops with the same name different slugs and keeps them on a second run", () => {
    const first = shopsToRows([draft("node/1"), draft("node/2")], []);
    assert.equal(first.length, 2);
    assert.notEqual(first[0]?.slug, first[1]?.slug);
    const second = shopsToRows([draft("node/1"), draft("node/2")], existingFromRows(first));
    assert.equal(second.length, 2);
    assert.deepEqual(second.map((row) => row.slug).sort(), first.map((row) => row.slug).sort());
    assert.equal(SLUG_RULE.includes("does not create a second row"), true);
  });
});

describe("opening hours", () => {
  it("reads a weekday range and leaves Sunday blank", () => {
    const hours = parseOsmOpeningHours("Mo-Fr 10:00-19:00; Sa 10:00-15:00");
    assert.equal(hours?.monday, "10:00-19:00");
    assert.equal(hours?.saturday, "10:00-15:00");
    assert.equal(hours?.sunday, undefined);
  });

  it("reads closed days, split shifts, and 24/7", () => {
    const split = parseOsmOpeningHours("Mo-Fr 08:30-12:30, 16:30-20:30; Sa 08:30-12:30; Su off");
    assert.equal(split?.monday, "08:30-12:30, 16:30-20:30");
    assert.equal(split?.sunday, "Closed");
    assert.equal(parseOsmOpeningHours("24/7")?.wednesday, "Open 24 hours");
    assert.equal(parseOsmOpeningHours("10:30 - 18:30")?.friday, "10:30-18:30");
  });

  it("does not invent hours for a line it cannot read", () => {
    assert.equal(parseOsmOpeningHours("sunrise-sunset"), null);
    assert.equal(parseOsmOpeningHours(""), null);
  });
});

describe("region names", () => {
  it("uses one spelling for US, Canada, and Australia", () => {
    assert.equal(canonicalRegion("US", "TX"), "Texas");
    assert.equal(canonicalRegion("US", "Washington, D.C."), "District of Columbia");
    assert.equal(canonicalRegion("CA", "BC"), "British Columbia");
    assert.equal(canonicalRegion("CA", "Québec"), "Quebec");
    assert.equal(canonicalRegion("AU", "NSW"), "New South Wales");
    assert.equal(canonicalRegion("FR", "Île-de-France"), "Île-de-France");
  });
});

describe("twins", () => {
  it("matches renamed spellings and the same shop on two websites", () => {
    assert.equal(namesSimilar("Game X Change", "GameXChange"), true);
    assert.equal(
      isSameShop(
        shop({ name: "Disc Replay", source: "osm", domain: "discreplay.com", address: "5700 Beckley Road" }),
        shop({
          name: "Disc Traders - Battle Creek",
          source: "gameroute",
          domain: "discreplay.com",
          address: "5700 Beckley Rd B1A",
        }),
      ),
      true,
    );
  });

  it("does not fold numbered shops or a different phone counter into one", () => {
    assert.equal(namesSimilar("Video Juegos 2", "Video Juegos 3"), false);
    assert.equal(namesSimilar("Sat.Elite Games", "Sat.Elite Games (Nintendo)"), false);
    assert.equal(namesSimilar("Sat.Elite Games", "Sat.Elite Games (Xbox)"), false);
    assert.equal(namesSimilar("8 Bit Retro", "8-Bit Retro Video Games"), true);
  });

  it("keeps a GameStop and a different shop nearby", () => {
    assert.equal(
      isSameShop(
        shop({ name: "FunTrade", source: "gameroute", lat: 45.783, lon: -108.56 }),
        shop({ name: "GameStop", source: "osm", lat: 45.7831, lon: -108.5602 }),
      ),
      false,
    );
  });

  it("folds CGR Games into Classic Games Revisited at the same address", () => {
    assert.equal(
      isSameShop(
        shop({
          name: "CGR Games",
          source: "osm",
          address: "46 East State Street, J",
          lat: 40.3103643,
          lon: -75.1291881,
        }),
        shop({
          name: "Classic Games Revisited",
          source: "gameroute",
          address: "46 E State St",
          lat: 40.3104058,
          lon: -75.1292336,
        }),
      ),
      true,
    );
  });

  it("keeps a different name at the same suite as its own listing", () => {
    assert.equal(
      isSameShop(
        shop({
          name: "Game Mechanix - West Monroe",
          source: "gameroute",
          address: "3212 Cypress St #2",
          lat: 32.504,
          lon: -92.119,
        }),
        shop({
          name: "Retro Fix",
          source: "osm",
          address: "3212 Cypress Street, #2",
          lat: 32.50401,
          lon: -92.11901,
        }),
      ),
      false,
    );
  });
});

describe("shop file", () => {
  it("keeps every CSV shop in the catalog and does not invent platforms", () => {
    const csv = readFileSync(path.join(root, "data", "video-game-stores.csv"), "utf8");
    const fills = JSON.parse(readFileSync(path.join(root, "data", "wikidata-fills.json"), "utf8")) as Record<
      string,
      WikidataFill
    >;
    const built = buildCatalog(csv, fills);
    assert.equal(built.csvRows, 6732);
    assert.equal(built.dropped, 0);
    assert.equal(built.rows.length + built.mergedGroups <= 6732, true);
    assert.equal(built.rows.length >= 6700, true);
    assert.equal(new Set(built.rows.map((row) => row.slug)).size, built.rows.length);
    assert.equal(new Set(built.rows.map((row) => `${row.source}:${row.source_id}`)).size, built.rows.length);
    assert.equal(
      built.rows.every((row) => row.platforms.length === 0 && row.sells_new === false && row.sells_used === false),
      true,
    );

    const published = JSON.parse(readFileSync(path.join(root, "data", "stores.json"), "utf8")) as { slug: string; source_id: string }[];
    const publishedBySource = new Map(published.map((row) => [row.source_id, row.slug]));
    for (const row of built.rows) {
      const saved = publishedBySource.get(row.source_id ?? "");
      if (saved) assert.equal(row.slug, saved);
    }

    const catalog = built.rows.map((row) => toCatalogStore(row));
    assert.equal(catalog.every(Boolean), true);
    assert.equal(catalog.filter((store) => store?.country === "US").length > 3000, true);
    assert.equal(catalog.filter((store) => store?.country && store.country !== "US").length > 3000, true);
    const nedgame = built.rows.find((row) => row.source_id === "Q16964881");
    assert.equal(nedgame?.country, "NL");
    assert.equal(nedgame?.address, null);
    const osaka = built.rows.find((row) => row.wikidata_url?.includes("Q125055846"));
    assert.match(osaka?.address ?? "", /梅田/);
    assert.equal(osaka?.city, "Umeda");

    const cgr = built.rows.find((row) =>
      (row.alternate_source_ids ?? []).includes("osm:way/387026089") ||
      (row.source === "osm" && row.source_id === "way/387026089"),
    );
    const classic = built.rows.find((row) => row.source === "gameroute" && row.source_id === "gameroute/1699");
    assert.equal(cgr?.id, classic?.id);
    const funtrade = built.rows.find((row) => row.source === "gameroute" && row.source_id === "gameroute/1459");
    const billingsStop = built.rows.find((row) => row.source === "osm" && row.source_id === "way/1363234827");
    assert.notEqual(funtrade?.id, billingsStop?.id);

    const decisions = reviewNearMisses(built.rows);
    assert.equal(decisions.length, 9);
    assert.equal(decisions.filter((item) => item.decision === "merged").length, 1);
    assert.equal(decisions.find((item) => item.label.includes("Doylestown"))?.decision, "merged");
    assert.equal(decisions.find((item) => item.label.includes("Billings"))?.decision, "kept_separate");
    const report = JSON.parse(readFileSync(path.join(root, "data", "import-report.json"), "utf8")) as {
      public_listings: number;
      indexable_listings: number;
      noindex_listings: number;
      duplicate_slugs: number;
      near_miss_rule: string;
      slug_rule: string;
      stores_json_sha256: string;
      supabase: string;
      country_url_scheme: { canonical: string };
      near_miss_decisions: { label: string; decision: string }[];
    };
    assert.deepEqual(
      report.near_miss_decisions.map((item) => [item.label, item.decision]),
      decisions.map((item) => [item.label, item.decision]),
    );

    const stores = catalog.filter((store): store is NonNullable<typeof store> => Boolean(store));
    assert.equal(stores.length, built.rows.length);
    assert.equal(stores.every((store) => store.slug.length > 0), true);
    assert.equal(new Set(stores.map((store) => store.slug)).size, stores.length);
    const france = countryEntries(stores).find((country) => country.code === "FR");
    const canada = countryEntries(stores).find((country) => country.code === "CA");
    const japan = countryEntries(stores).find((country) => country.code === "JP");
    assert.equal(france?.slug, "fr");
    assert.equal(canada?.slug, "ca");
    assert.equal(japan?.slug, "jp");
    assert.equal(france?.name, "France");
    assert.equal(countryPath("fr"), "/directory/countries/fr");
    assert.equal(countryBySlug("fr")?.redirectSlug, null);
    assert.equal(countryBySlug("france")?.redirectSlug, "fr");
    assert.equal(countryBySlug("uk")?.redirectSlug, "gb");
    assert.equal(countryBySlug("usa")?.redirectSlug, "us");
    assert.equal(countryBySlug("ge")?.country.code, "GE");
    assert.equal(countryBySlug("georgia")?.redirectSlug, "ge");
    assert.equal(statePath("georgia"), "/directory/georgia");
    const frenchRegions = regionLinks(stores, france!);
    assert.equal(frenchRegions.length > 0, true);
    assert.equal(frenchRegions.every((region) => region.count >= 3), true);
    assert.equal(frenchRegions.every((region) => region.href.startsWith("/directory/countries/fr/")), true);
    const unitedStates = countryEntries(stores).find((country) => country.code === "US");
    assert.equal(unitedStates?.slug, "us");
    assert.equal(regionLinks(stores, unitedStates!).find((region) => region.slug === "texas")?.href, "/directory/texas");
    assert.equal(stableSlug("Île-de-France"), "ile-de-france");
    const frenchShop = stores.find((store) => store.country === "FR" && store.state);
    const cityShop = stores.find((store) => store.city);
    assert.equal(frenchShop?.countrySlug, "fr");
    assert.equal(Boolean(frenchShop && frenchShop.regionSlug.length > 0), true);
    assert.equal(Boolean(cityShop && cityShop.citySlug.length > 0), true);
    assert.equal(shopIsIndexable({ address: "", phone: "", website: "" }), false);
    assert.equal(shopIsIndexable({ address: "1 Main St", phone: "", website: "" }), true);
    assert.equal(stores.some((store) => !store.indexable), true);
    assert.equal(
      stores.every((store) => store.indexable === shopIsIndexable(store)),
      true,
    );
    assert.equal(report.public_listings, built.rows.length);
    assert.equal(report.public_listings, stores.length);
    assert.equal(report.indexable_listings + report.noindex_listings, report.public_listings);
    assert.equal(report.indexable_listings, stores.filter((store) => store.indexable).length);
    assert.equal(report.duplicate_slugs, 0);
    assert.equal(report.near_miss_rule, NEAR_MISS_RULE);
    assert.equal(report.slug_rule, SLUG_RULE);
    assert.equal(report.country_url_scheme.canonical, "/directory/countries/{iso2}");
    assert.equal(report.supabase, "skipped_no_service_role");
    const fileBytes = readFileSync(path.join(root, "data", "stores.json"));
    const savedRows = JSON.parse(fileBytes.toString("utf8")) as StoreRow[];
    assert.equal(savedRows.length, report.public_listings);
    assert.equal(new Set(savedRows.map((row) => row.slug)).size, savedRows.length);
    assert.equal(
      savedRows.every((row) => row.country == null || /^[A-Z]{2}$/.test(row.country)),
      true,
    );
    assert.equal(createHash("sha256").update(fileBytes).digest("hex"), report.stores_json_sha256);
    const rerun = buildCatalog(csv, fills, existingFromRows(savedRows));
    assert.equal(rerun.rows.length, savedRows.length);
    assert.equal(rerun.rows.length, built.rows.length);
  });
});

function draft(sourceId: string, patch: Partial<ShopDraft> = {}): ShopDraft {
  return {
    name: "Same Name Games",
    brand: null,
    address: null,
    city: "Austin",
    region: "Texas",
    postalCode: null,
    country: "US",
    countryName: "United States",
    latitude: null,
    longitude: null,
    phone: null,
    website: null,
    websiteDomain: null,
    facebook: null,
    instagram: null,
    twitter: null,
    otherSocials: [],
    imageUrl: null,
    openingHoursRaw: null,
    openingHours: null,
    storeInfo: null,
    source: "osm",
    sourceId,
    osmUrl: null,
    wikidataUrl: null,
    fetchedAt: "2026-11-06T00:00:00.000Z",
    dataUpdatedAt: null,
    enrichmentNotes: null,
    alternateIdentities: [],
    ...patch,
  };
}

function shop(input: {
  name: string;
  source: string;
  lat?: number;
  lon?: number;
  address?: string;
  domain?: string;
}) {
  return {
    source: input.source,
    sourceId: `${input.source}-1`,
    name: input.name,
    country: "US",
    address: input.address ?? null,
    latitude: input.lat ?? 42.27,
    longitude: input.lon ?? -85.18,
    websiteDomain: input.domain ?? null,
  };
}
