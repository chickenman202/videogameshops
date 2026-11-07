import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { assignUniqueSlugs, toCatalogStore } from "./catalog";
import type { Database } from "./database.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

/**
 * The public catalog must stay the same length as data/import-report.json.
 * Import owns that report. This test fails if a shop is dropped or the file drifts.
 */
describe("import catalog count", () => {
  it("keeps every shop in the import report", () => {
    const root = process.cwd();
    const report = JSON.parse(readFileSync(path.join(root, "data/import-report.json"), "utf8")) as {
      listings: number;
      stores_json_sha256?: string;
      country_url_scheme?: { canonical?: string };
    };
    const file = readFileSync(path.join(root, "data/stores.json"));
    const rows = JSON.parse(file.toString("utf8")) as StoreRow[];
    assert.equal(rows.length, report.listings, "stores.json length drifted from the import report");
    if (report.stores_json_sha256) {
      assert.equal(createHash("sha256").update(file).digest("hex"), report.stores_json_sha256);
    }
    assert.equal(report.country_url_scheme?.canonical, "/directory/countries/{iso2}");

    const parsed = [];
    for (const row of rows) {
      if (row.is_active === false) continue;
      const store = toCatalogStore(row);
      if (store) parsed.push(store);
    }
    const stores = assignUniqueSlugs(parsed);
    assert.equal(parsed.length, report.listings, "toCatalogStore dropped a shop from the import file");
    assert.equal(stores.length, report.listings, "slug dedupe changed the public shop count");
  });
});
