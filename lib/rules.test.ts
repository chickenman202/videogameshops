import { isKeyboardMash, isPublishableStore, isUsableAbout } from "./publish";
import { slugify, storeSlug } from "./slug";
import { toMetaDescription, storeTitle } from "./copy";

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

  it("keeps a description honest and within search length", () => {
    const lead = "12 video game stores in Austin, Texas.";
    assert.equal(toMetaDescription(lead), lead);
    const long = `${"Physical video game shops in a long city name. ".repeat(8)}End.`;
    const text = toMetaDescription(long);
    assert.ok(text.length <= 160, text);
    assert.equal(text.includes("before you go"), false);
  });
});
