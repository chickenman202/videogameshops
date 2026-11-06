import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { buildCatalog } from "./build-catalog";
import { toCatalogStore } from "./catalog";
import { countryBySlug, countryEntries, placeSlug, regionLinks } from "./countries";
import { reviewNearMisses } from "./near-miss-review";
import { parseOsmOpeningHours } from "./osm-hours";
import { countryPath } from "./paths";
import { canonicalRegion } from "./regions";
import { isSameShop, namesSimilar } from "./shop-dedupe";
import type { WikidataFill } from "./shop-record";

const root = path.join(import.meta.dirname, "..");

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
      near_miss_decisions: { label: string; decision: string }[];
    };
    assert.deepEqual(
      report.near_miss_decisions.map((item) => [item.label, item.decision]),
      decisions.map((item) => [item.label, item.decision]),
    );

    const stores = catalog.filter((store): store is NonNullable<typeof store> => Boolean(store));
    const france = countryBySlug(stores, "france");
    const canada = countryBySlug(stores, "canada");
    const japan = countryBySlug(stores, "japan");
    assert.equal(france?.code, "FR");
    assert.equal(canada?.code, "CA");
    assert.equal(japan?.code, "JP");
    assert.equal(countryPath("france"), "/directory/countries/france");
    assert.equal(countryBySlug(stores, "georgia")?.code, "GE");
    const frenchRegions = regionLinks(stores, france!);
    assert.equal(frenchRegions.length > 0, true);
    assert.equal(frenchRegions.every((region) => region.count >= 3), true);
    assert.equal(frenchRegions.every((region) => region.href.startsWith("/directory/countries/france/")), true);
    const unitedStates = countryEntries(stores).find((country) => country.code === "US");
    assert.equal(regionLinks(stores, unitedStates!).find((region) => region.slug === "texas")?.href, "/directory/texas");
    assert.equal(placeSlug("Île-de-France"), "ile-de-france");
  });
});

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
