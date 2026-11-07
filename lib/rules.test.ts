import { displayPlace, distinctPlace, shopLocation, type ShopView } from "./shop-view";
import { isKeyboardMash, isPublishableStore, isUsableAbout } from "./publish";
import { slugify, storeSlug } from "./slug";
import { listingIntro, toMetaDescription, storeTitle } from "./copy";
import { FIXTURE_SHOPS } from "./fixture-shops";
import { storeJsonLd } from "./jsonld";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDayHours } from "./hours";

describe("hours", () => {
  it("reads a normal morning-to-evening range", () => {
    assert.deepEqual(parseDayHours("11:00 AM - 8:00 PM"), {
      status: "parsed",
      ranges: [{ opens: "11:00", closes: "20:00" }],
    });
  });

  it("reads Google hours that only put PM on the closing time", () => {
    assert.deepEqual(parseDayHours("3:00 – 8:00 PM"), {
      status: "parsed",
      ranges: [{ opens: "15:00", closes: "20:00" }],
    });
    assert.deepEqual(parseDayHours("10:00 - 6:00 PM"), {
      status: "parsed",
      ranges: [{ opens: "10:00", closes: "18:00" }],
    });
  });

  it("reads 24 hours, closed, and split shifts", () => {
    assert.deepEqual(parseDayHours("Open 24 hours"), {
      status: "parsed",
      ranges: [{ opens: "00:00", closes: "23:59" }],
    });
    assert.deepEqual(parseDayHours("Closed"), { status: "closed" });
    assert.equal(parseDayHours("11:00 AM - 2:00 PM, 5:00 PM - 9:00 PM").status, "parsed");
    const split = parseDayHours("11:00 AM - 2:00 PM, 5:00 PM - 9:00 PM");
    assert.equal(split.status, "parsed");
    if (split.status === "parsed") assert.equal(split.ranges.length, 2);
  });

  it("does not invent hours it cannot read", () => {
    assert.equal(parseDayHours("by appointment").status, "unparsed");
    assert.equal(parseDayHours("").status, "empty");
  });
});

describe("slugs and publish rules", () => {
  it("builds a store slug without apostrophes", () => {
    assert.equal(slugify("Bob's Games"), "bobs-games");
    assert.equal(storeSlug("Muv Games", "Austin", "TX"), "muv-games-austin-tx");
  });

  it("refuses placeholder stores", () => {
    assert.equal(isKeyboardMash("vvvvvvv"), true);
    assert.equal(isKeyboardMash("sadfadf"), true);
    assert.equal(
      isPublishableStore({
        name: "vvvvvvv",
        address: "1 Main St",
        city: "Austin",
        state: "Texas",
      }),
      false,
    );
    assert.equal(
      isPublishableStore({
        name: "Muv Games",
        address: "",
        city: "Austin",
        state: "Texas",
      }),
      false,
    );
    assert.equal(
      isPublishableStore({
        name: "Muv Games",
        address: "123 Main St",
        city: "Austin",
        state: "Texas",
      }),
      true,
    );
  });

  it("throws away review text and website blurbs", () => {
    assert.equal(isUsableAbout("Great shop!"), false);
    assert.equal(isUsableAbout("Official website for the store."), false);
    assert.equal(isUsableAbout("5 stars on Google review."), false);
    assert.equal(
      isUsableAbout(
        "Muv Games has sold used games in Austin since 2004. The shop also takes trade-ins.",
      ),
      true,
    );
  });
});

describe("titles and descriptions", () => {
  it("keeps the city and drops the brand when the name is long", () => {
    const title = storeTitle(
      "The Extremely Long Neighborhood Video Game Exchange and Hobby House",
      "Austin",
      "TX",
      ["PlayStation", "Xbox"],
    );
    assert.ok(title.length <= 60);
    assert.match(title, /Austin, TX/);
    assert.equal(title.includes("videogameshops"), false);
  });

  it("uses one platform only when the store carries just that platform", () => {
    const single = storeTitle("Muv Games", "Austin", "TX", ["Retro"]);
    assert.match(single, /Retro/);
    const multi = storeTitle("Muv Games", "Austin", "TX", ["Retro", "PlayStation"]);
    assert.match(multi, /Video Game Store/);
    assert.equal(multi.includes("Retro"), false);
  });

  it("folds city and region names that differ by case or accents", () => {
    assert.deepEqual(distinctPlace(["la Massana", "La Massana"]), ["la Massana"]);
    assert.deepEqual(distinctPlace(["Tirana", "Tiranë"]), ["Tirana"]);
    assert.deepEqual(distinctPlace(["Tirana", "Tirane"]), ["Tirana"]);
    assert.deepEqual(distinctPlace(["Aix-en-Provence", "Provence-Alpes-Cote d'Azur"]).length, 2);
    assert.equal(displayPlace("la Massana"), "La Massana");
    assert.equal(displayPlace("Aix-en-Provence"), "Aix-en-Provence");
    assert.equal(displayPlace("Provence-Alpes-Cote d'Azur"), "Provence-Alpes-Cote d'Azur");
    const folded = shopLocation({
      city: "la Massana",
      state: "La Massana",
      stateAbbr: "",
    } as ShopView);
    assert.equal(folded.line, "La Massana");
    const longRegion = shopLocation({
      city: "Aix-en-Provence",
      state: "Provence-Alpes-Cote d'Azur",
      stateAbbr: "",
    } as ShopView);
    assert.equal(longRegion.line, "Aix-en-Provence");
    assert.equal(longRegion.full, "Aix-en-Provence, Provence-Alpes-Cote d'Azur");
  });

  it("keeps a description honest and within search length", () => {
    const lead = "12 video game stores in Austin, Texas.";
    assert.equal(toMetaDescription(lead), lead);
    const long = `${"Physical video game shops in a long city name. ".repeat(8)}End.`;
    const text = toMetaDescription(long);
    assert.ok(text.length <= 160, text);
    assert.equal(text.includes("before you go"), false);
  });

  it("varies listing intros from real counts and skips tags that are not stored", () => {
    const austin = listingIntro({
      total: 6,
      noun: "video game stores",
      place: "Austin, Texas",
      platform: false,
      cities: 1,
      retro: 2,
      used: 4,
      tradeIns: 1,
      repairs: 0,
    });
    const dallas = listingIntro({
      total: 6,
      noun: "video game stores",
      place: "Dallas, Texas",
      platform: false,
      cities: 1,
      retro: 0,
      used: 0,
      tradeIns: 0,
      repairs: 0,
    });
    assert.match(austin, /Austin, Texas/);
    assert.match(austin, /retro/);
    assert.equal(austin.includes("used"), false);
    assert.equal(dallas.includes("retro"), false);
    assert.equal(dallas.includes("used"), false);
    assert.notEqual(austin, dallas);
    const texas = listingIntro({
      total: 264,
      noun: "video game stores",
      place: "Texas",
      platform: false,
      cities: 40,
      retro: 0,
      used: 10,
      tradeIns: 0,
      repairs: 0,
    });
    assert.match(texas, /40 cities/);
    assert.match(texas, /used games/);
    const one = listingIntro({
      total: 1,
      noun: "video game stores",
      place: "Andorra",
      platform: false,
      cities: 1,
      retro: 0,
      used: 0,
      tradeIns: 0,
      repairs: 0,
    });
    assert.match(one, /one video game store/i);
    assert.equal(one.includes("stores in"), false);
  });
});

describe("shop JSON-LD", () => {
  type Business = {
    "@type": string;
    name: string;
    url: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    telephone?: string;
    sameAs?: string[];
    geo?: { latitude: number; longitude: number };
    openingHours?: string | string[];
  };

  function business(name: string): Business {
    const store = FIXTURE_SHOPS.find((item) => item.name === name);
    assert.ok(store, name);
    return storeJsonLd(store) as unknown as Business;
  }

  it("writes LocalBusiness for a US shop from stored fields", () => {
    const data = business("Press Start Video Games");
    assert.equal(data["@type"], "LocalBusiness");
    assert.equal(data.name, "Press Start Video Games");
    assert.match(data.url, /\/store\/press-start-video-games-alabaster-al$/);
    assert.equal(data.address?.addressCountry, "US");
    assert.equal(data.address?.addressRegion, "AL");
    assert.equal(data.address?.addressLocality, "Alabaster");
    assert.equal(data.address?.streetAddress, "102 1st St N");
    assert.equal(data.address?.postalCode, "35007");
    assert.equal(data.telephone, "2056243234");
    assert.ok(data.sameAs?.includes("https://pressstartal.com/"));
    assert.ok(data.sameAs?.includes("https://www.instagram.com/pressstart_al"));
    assert.equal(data.geo?.latitude, 33.2439176);
    assert.equal(data.geo?.longitude, -86.8163246);
    assert.equal(data.openingHours, "Mo-Sa 08:00-18:00");

    const store = FIXTURE_SHOPS.find((item) => item.name === "Press Start Video Games");
    assert.ok(store);
    const named = storeJsonLd({ ...store, displayName: "Press Start" }) as unknown as Business;
    assert.equal(named.name, "Press Start");
    const unread = storeJsonLd({
      ...store,
      hours: { monday: "by appointment" },
      hoursRaw: "not hours",
    }) as unknown as Business;
    assert.equal(unread.openingHours, undefined);
  });

  it("writes LocalBusiness for a non-US shop and leaves out missing facts", () => {
    const data = business("Esports Bauseli");
    assert.equal(data["@type"], "LocalBusiness");
    assert.equal(data.name, "Esports Bauseli");
    assert.match(data.url, /\/store\/esports-bauseli-la-massana-ad$/);
    assert.equal(data.address?.addressCountry, "AD");
    assert.equal(data.address?.addressLocality, "la Massana");
    assert.equal(data.address?.addressRegion, "La Massana");
    assert.equal(data.address?.streetAddress, undefined);
    assert.equal(data.address?.postalCode, undefined);
    assert.equal(data.telephone, undefined);
    assert.equal(data.sameAs, undefined);
    assert.equal(data.openingHours, undefined);
    assert.equal(data.geo?.latitude, 42.5483125);
    assert.equal(data.geo?.longitude, 1.5133131);

    const france = business("Maxxi Games");
    assert.equal(france.address?.addressCountry, "FR");
    assert.equal(france.address?.streetAddress, "16 Rue Paul Bert");
    assert.equal(france.address?.postalCode, undefined);
    assert.equal(france.telephone, undefined);
    assert.deepEqual(france.sameAs, ["https://www.facebook.com/maxxigamesaix"]);
    assert.equal(france.openingHours, "Mo-Sa 10:00-19:00");
  });
});
