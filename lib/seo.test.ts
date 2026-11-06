import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignUniqueSlugs, toCatalogStore, type CatalogStore } from "./catalog";
import { countryBySlug, normalizeCountry } from "./countries";
import { cityStoresTitle, storeTitle } from "./copy";
import type { Database } from "./database.types";
import { isDirectoryListPath } from "./filters";
import { absoluteUrl, storeJsonLd } from "./jsonld";
import { listingCacheKey, storeAbout } from "./listing";
import { unitedStatesDirectoryPath } from "./paths";
import { slugify, storeSlug } from "./slug";
import { canonicalDirectoryRedirect } from "./redirects";
import { isIndexableShop } from "./publish";
import { buildSitemap, fallbackSitemap } from "./sitemap-data";
import { SITE_URL } from "./site";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

function row(partial: Partial<StoreRow> & Pick<StoreRow, "id" | "name">): StoreRow {
  return {
    id: partial.id,
    slug: partial.slug ?? "",
    name: partial.name,
    address: partial.address === undefined ? "100 Main Street" : partial.address,
    city: partial.city === undefined ? "Austin" : partial.city,
    city_slug: partial.city_slug ?? "",
    state: partial.state === undefined ? "Texas" : partial.state,
    zip_code: partial.zip_code ?? "78701",
    country: partial.country ?? "US",
    phone: partial.phone ?? null,
    latitude: partial.latitude ?? null,
    longitude: partial.longitude ?? null,
    website: partial.website ?? null,
    about: partial.about ?? null,
    opening_hours: partial.opening_hours ?? null,
    platforms: partial.platforms ?? [],
    sells_new: partial.sells_new ?? false,
    sells_used: partial.sells_used ?? false,
    accepts_trade_ins: partial.accepts_trade_ins ?? false,
    repairs_consoles: partial.repairs_consoles ?? false,
    is_active: partial.is_active ?? true,
    google_place_id: partial.google_place_id ?? null,
    photo_url: partial.photo_url ?? null,
    created_at: partial.created_at ?? "2026-01-01T00:00:00.000Z",
    updated_at: partial.updated_at ?? "2026-01-02T00:00:00.000Z",
  };
}

function mustStore(partial: Partial<StoreRow> & Pick<StoreRow, "id" | "name">): CatalogStore {
  const store = toCatalogStore(row(partial));
  assert.ok(store, partial.name);
  return store;
}

describe("country and slug helpers", () => {
  it("folds accents and keeps the old apostrophe rule", () => {
    assert.equal(slugify("Bob's Games"), "bobs-games");
    assert.equal(slugify("Île-de-France"), "ile-de-france");
  });

  it("puts the city in the slug, and the country outside the United States", () => {
    assert.equal(storeSlug("Muv Games", "Austin", "TX"), "muv-games-austin-tx");
    assert.equal(storeSlug("Muv Games", "Dallas", "TX"), "muv-games-dallas-tx");
    assert.equal(
      storeSlug("Game One", "Paris", "ile-de-france", "FR"),
      "game-one-paris-ile-de-france-fr",
    );
  });

  it("reads country names without dropping an unknown country", () => {
    assert.equal(normalizeCountry("").code, "");
    assert.equal(normalizeCountry("").name, "");
    assert.equal(normalizeCountry(null).code, "");
    assert.equal(normalizeCountry("USA").slug, "us");
    assert.equal(normalizeCountry("IR").name, "Iran");
    assert.equal(normalizeCountry("CI").name, "Côte d'Ivoire");
    assert.equal(normalizeCountry("TZ").name, "Tanzania");
    assert.equal(normalizeCountry("IQ").name, "Iraq");
    assert.equal(normalizeCountry("PK").name, "Pakistan");
    assert.equal(normalizeCountry("RU").name, "Russia");
    assert.equal(countryBySlug("ir")?.country.name, "Iran");
    assert.equal(countryBySlug("ir")?.country.slug, "ir");
    assert.equal(normalizeCountry("France").code, "FR");
    assert.equal(normalizeCountry("UK").slug, "gb");
    assert.equal(countryBySlug("uk")?.redirectSlug, "gb");
    assert.equal(countryBySlug("fr")?.redirectSlug, null);
    const unknown = normalizeCountry("Narnia");
    assert.equal(unknown.known, false);
    assert.equal(unknown.name, "Narnia");
    assert.equal(unknown.slug, "narnia");
  });

  it("keeps one United States directory URL", () => {
    assert.equal(unitedStatesDirectoryPath({ regionSlug: "texas", citySlug: "austin" }), "/directory/texas/austin");
    assert.equal(
      unitedStatesDirectoryPath({
        regionSlug: "texas",
        citySlug: "austin",
        platformSlug: "retro",
        page: 2,
      }),
      "/directory/texas/austin/retro/page/2",
    );
    assert.equal(absoluteUrl("/"), SITE_URL);
    assert.equal(absoluteUrl("/about"), `${SITE_URL}/about`);
  });

  it("does not treat country hubs as filtered store lists", () => {
    assert.equal(isDirectoryListPath("/directory/countries"), false);
    assert.equal(isDirectoryListPath("/directory/countries/fr"), false);
    assert.equal(isDirectoryListPath("/directory/countries/fr/ile-de-france"), true);
    assert.equal(isDirectoryListPath("/directory/texas"), true);
  });
});

describe("catalog places", () => {
  it("keeps a United States shop on the state slug", () => {
    const store = mustStore({ id: "us-1", name: "Muv Games", city: "Austin", state: "Texas" });
    assert.equal(store.countryCode, "US");
    assert.equal(store.stateSlug, "texas");
    assert.equal(store.slug, "muv-games-austin-tx");
  });

  it("keeps a shop outside the United States instead of dropping it", () => {
    const store = mustStore({
      id: "fr-1",
      name: "Game One",
      city: "Paris",
      state: "Île-de-France",
      country: "FR",
      zip_code: "75001",
    });
    assert.equal(store.countryCode, "FR");
    assert.equal(store.countrySlug, "fr");
    assert.equal(store.stateSlug, "ile-de-france");
    assert.equal(store.slug, "game-one-paris-ile-de-france-fr");
  });

  it("gives two different shops their own slugs when the generated slug would match", () => {
    const first = mustStore({ id: "11111111-1111-1111-1111-111111111111", name: "Game Shop", city: "Austin", state: "TX" });
    const second = mustStore({
      id: "22222222-2222-2222-2222-222222222222",
      name: "Game Shop",
      city: "Austin",
      state: "TX",
      address: "200 Other Street",
    });
    const unique = assignUniqueSlugs([first, second]);
    assert.equal(unique.length, 2);
    assert.equal(new Set(unique.map((store) => store.slug)).size, 2);
  });
});

describe("titles and structured data", () => {
  it("uses the city title pattern and disambiguates shared city names", () => {
    assert.equal(cityStoresTitle("Austin", "Texas", false), "Austin Video Game Stores");
    assert.equal(cityStoresTitle("Paris", "Texas", true), "Paris, Texas Video Game Stores");
    const title = storeTitle("Muv Games", "Austin", "TX", ["PlayStation", "Xbox"]);
    assert.equal(title, "Muv Games in Austin, TX");
  });

  it("builds LocalBusiness from stored fields only", () => {
    const plain = mustStore({ id: "plain", name: "Muv Games", city: "Austin", state: "Texas", phone: "512-555-0100" });
    const data = storeJsonLd(plain);
    const text = JSON.stringify(data);
    assert.equal(data["@type"], "LocalBusiness");
    assert.equal(text.includes("aggregateRating"), false);
    assert.equal(text.includes("Offer"), false);
    assert.equal(text.includes("review"), false);
    assert.equal(text.includes("openingHours"), false);
    assert.equal((data.address as { addressCountry: string }).addressCountry, "US");
    assert.equal((data.address as { addressRegion: string }).addressRegion, "Texas");
    assert.equal(data.telephone, "512-555-0100");

    const france = mustStore({
      id: "fr-hours",
      name: "Game One",
      city: "Paris",
      state: "Île-de-France",
      country: "France",
      phone: null,
      opening_hours: { monday: "11:00 AM - 8:00 PM", tuesday: "by appointment" },
      about: "Game One has sold used games in Paris since 2004. The shop also takes trade-ins.",
      website: "https://example.com/game-one",
    });
    const french = storeJsonLd(france);
    const frenchText = JSON.stringify(french);
    assert.equal(frenchText.includes("Offer"), false);
    assert.equal(frenchText.includes("aggregateRating"), false);
    assert.equal((french.address as { addressCountry: string }).addressCountry, "FR");
    const hours = french.openingHoursSpecification as { opens: string; closes: string }[];
    assert.equal(hours.length, 1);
    assert.equal(hours[0]?.opens, "11:00");
    assert.equal(hours[0]?.closes, "20:00");
    assert.equal(french.description?.toString().includes("used games"), true);
    assert.equal(french.sameAs, "https://example.com/game-one");
  });

  it("publishes a shop with no street and does not invent an address", () => {
    const store = mustStore({
      id: "no-street",
      name: "Esports Bauseli",
      address: null,
      city: "la Massana",
      state: "La Massana",
      country: "AD",
      zip_code: null,
      phone: null,
    });
    assert.equal(store.address, "");
    assert.equal(store.countryName, "Andorra");
    const about = storeAbout(store);
    assert.equal(about.includes(" at "), false);
    assert.equal(about.includes("hours"), false);
    assert.equal(about.includes("Phone"), false);
    assert.match(about, /Esports Bauseli is a video game store in la Massana, La Massana, Andorra/);
    const data = storeJsonLd(store);
    const address = data.address as Record<string, unknown>;
    assert.equal("streetAddress" in address, false);
    assert.equal(address.addressLocality, "la Massana");
    assert.equal(address.addressCountry, "AD");
    assert.equal("telephone" in data, false);
    assert.equal("openingHoursSpecification" in data, false);
  });

  it("keeps a blank country blank and still publishes a located shop in Iran", () => {
    const blank = toCatalogStore(
      row({
        id: "blank-country",
        name: "No Country Games",
        city: "Austin",
        state: "Texas",
        country: "",
      }),
    );
    assert.equal(blank, null);

    const iran = mustStore({
      id: "iran-1",
      name: "Game Shop Tehran",
      address: null,
      city: null,
      state: null,
      country: "IR",
      latitude: 35.7,
      longitude: 51.4,
      phone: null,
    });
    assert.equal(iran.countryCode, "IR");
    assert.equal(iran.countryName, "Iran");
    assert.equal(iran.countrySlug, "ir");
    assert.equal(iran.city, "");
    const data = storeJsonLd(iran);
    const address = data.address as Record<string, unknown>;
    assert.equal("streetAddress" in address, false);
    assert.equal(address.addressCountry, "IR");
    assert.equal((data.geo as { latitude: number }).latitude, 35.7);
  });
});

describe("country URL redirects", () => {
  it("sends name and alias country URLs to the ISO code", () => {
    assert.equal(canonicalDirectoryRedirect("/directory/countries/france"), "/directory/countries/fr");
    assert.equal(canonicalDirectoryRedirect("/directory/countries/uk"), "/directory/countries/gb");
    assert.equal(canonicalDirectoryRedirect("/directory/countries/usa"), "/directory/countries/us");
    assert.equal(canonicalDirectoryRedirect("/directory/countries/us/texas"), "/directory/texas");
    assert.equal(canonicalDirectoryRedirect("/directory/countries/united-states/texas"), "/directory/texas");
    assert.equal(canonicalDirectoryRedirect("/directory/countries/fr"), null);
    assert.equal(canonicalDirectoryRedirect("/directory/texas"), null);
  });
});

describe("listing cache key", () => {
  it("keeps filter queries so the same visit can apply them", () => {
    const parsed = JSON.parse(
      listingCacheKey({ page: 1, stateSlug: "texas", searchParams: { used: "1" } }),
    ) as { searchParams: { used: string }; stateSlug: string };
    assert.equal(parsed.searchParams.used, "1");
    assert.equal(parsed.stateSlug, "texas");
  });
});

describe("sitemap", () => {
  it("lists real hubs and shops and skips thin cities, priority, and page 2", () => {
    const austin = ["One", "Two", "Three"].map((name, index) =>
      mustStore({
        id: `austin-${index}`,
        name,
        city: "Austin",
        state: "Texas",
        platforms: index === 0 ? ["Retro", "PlayStation", "Nintendo"] : ["Retro"],
        updated_at: `2026-02-0${index + 1}T00:00:00.000Z`,
      }),
    );
    const dallas = mustStore({ id: "dallas-1", name: "Solo", city: "Dallas", state: "Texas" });
    const paris = ["Un", "Deux", "Trois"].map((name, index) =>
      mustStore({
        id: `paris-${index}`,
        name,
        city: "Paris",
        state: "Île-de-France",
        country: "FR",
        zip_code: "75001",
      }),
    );
    const entries = buildSitemap([...austin, dallas, ...paris]);
    const urls = entries.map((entry) => entry.url);
    assert.equal(urls.some((url) => url.endsWith("/directory/texas/austin")), true);
    assert.equal(urls.some((url) => url.endsWith("/directory/texas/dallas")), false);
    assert.equal(urls.some((url) => url.endsWith("/directory/countries/us/texas")), false);
    assert.equal(urls.some((url) => url.includes("/directory/countries/fr/")), true);
    assert.equal(urls.some((url) => url.endsWith("/store/one-austin-tx")), true);
    assert.equal(urls.some((url) => url.includes("/page/")), false);
    assert.equal(urls.filter((url) => url.endsWith("/directory/texas")).length, 1);
    for (const entry of entries) {
      assert.equal("priority" in entry, false);
      assert.equal("changeFrequency" in entry, false);
    }

    const thin = mustStore({
      id: "thin-1",
      name: "Map Pin Games",
      address: null,
      city: "Lyon",
      state: "Auvergne-Rhone-Alpes",
      country: "FR",
      phone: null,
      website: null,
      zip_code: null,
    });
    assert.equal(isIndexableShop(thin), false);
    const withStreet = mustStore({ id: "street-1", name: "Shop With Door", city: "Lyon", state: "Auvergne-Rhone-Alpes", country: "FR" });
    const lyonUrls = buildSitemap([thin, withStreet, withStreet, withStreet]).map((item) => item.url);
    assert.equal(lyonUrls.some((url) => url.endsWith(`/store/${thin.slug}`)), false);
    assert.equal(lyonUrls.some((url) => url.endsWith(`/store/${withStreet.slug}`)), true);
  });

  it("returns hub URLs when the catalog cannot be read", () => {
    const urls = fallbackSitemap("2026-11-06").map((entry) => entry.url);
    for (const path of ["/", "/directory", "/about", "/directory/countries", "/directory/platforms", "/directory/states"]) {
      assert.equal(urls.includes(`${SITE_URL}${path === "/" ? "" : path}`), true, path);
    }
    assert.equal(urls.some((url) => url.includes("/store/")), false);
  });
});
