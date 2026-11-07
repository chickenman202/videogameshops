import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countryDisplayName, nameForCountryCode } from "./countries";
import { countStoresByCountry } from "./country-browse";

describe("countryDisplayName", () => {
  it("translates a stored bare code", () => {
    const expected: Record<string, string> = {
      BT: "Bhutan", TG: "Togo", CW: "Curaçao", AW: "Aruba", BB: "Barbados", BJ: "Benin", BM: "Bermuda",
      BZ: "Belize", GD: "Grenada", GY: "Guyana", SR: "Suriname", VC: "Saint Vincent and the Grenadines",
    };
    for (const [code, name] of Object.entries(expected)) assert.equal(countryDisplayName(code, code), name);
  });
  it("keeps a real stored name", () => {
    assert.equal(countryDisplayName("FR", "France"), "France");
  });
  it("falls back to Intl.DisplayNames for a code missing from the map", () => {
    assert.ok((nameForCountryCode("XK") ?? "").length > 2);
  });
  it("names countries on the browse list", () => {
    const [row] = countStoresByCountry([{ country: "BT", countryName: "BT" }]);
    assert.equal(row?.name, "Bhutan");
  });
});
