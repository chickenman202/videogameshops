/**
 * Read the shop CSV, fold OpenStreetMap / Game-Route twins into one row,
 * and write data/stores.json.
 *
 * If Supabase is configured, the same rows are saved there.
 * Existing slugs are kept. No secret values are printed.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildCatalog, catalogReport, existingFromRows, nearMisses } from "../lib/build-catalog";
import { parseCsv } from "../lib/csv";
import type { Database } from "../lib/database.types";
import { draftFromCsv, type ExistingStore, type StoreRow, type WikidataFill } from "../lib/shop-record";

const root = process.cwd();
const csvPath = path.join(root, "data", "video-game-stores.csv");
const jsonPath = path.join(root, "data", "stores.json");
const reportPath = path.join(root, "data", "import-report.json");
const fillsPath = path.join(root, "data", "wikidata-fills.json");

async function main() {
  loadEnvFile(path.join(root, ".env.local"));
  loadEnvFile(path.join(root, ".env"));

  const csvText = readFileSync(csvPath, "utf8");
  const fills = JSON.parse(readFileSync(fillsPath, "utf8")) as Record<string, WikidataFill>;
  const previous = existsSync(jsonPath)
    ? existingFromRows(JSON.parse(readFileSync(jsonPath, "utf8")) as StoreRow[])
    : [];

  const database = await loadDatabaseRows();
  const built = buildCatalog(csvText, fills, [...previous, ...database.existing]);
  const drafts = parseCsv(csvText)
    .map((record) => draftFromCsv(record, fills))
    .filter((shop) => shop.name && shop.source && shop.sourceId);
  const report = {
    ...catalogReport(built.csvRows, built.mergedGroups, built.dropped, built.rows),
    near_misses_within_40m: nearMisses(drafts),
    supabase: database.configured ? "upserted" : "skipped_no_service_role",
  };

  writeFileSync(jsonPath, `${JSON.stringify(built.rows)}\n`);
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (database.client) {
    await saveRows(database.client, built.rows, database.existing);
    report.supabase = "upserted";
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(
    `Imported ${built.rows.length} shops from ${built.csvRows} CSV rows. Merged groups: ${built.mergedGroups}. Supabase: ${report.supabase}.`,
  );
}

void main();

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function loadDatabaseRows(): Promise<{
  configured: boolean;
  client: ReturnType<typeof createClient<Database>> | null;
  existing: ExistingStore[];
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return { configured: false, client: null, existing: [] };
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const existing: ExistingStore[] = [];
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await client
      .from("stores")
      .select("id,slug,source,source_id,alternate_source_ids,created_at")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) {
      console.error(`Supabase read failed: ${error.message}`);
      console.error("The JSON catalog was still written. Apply supabase/migrations before importing to the database.");
      return { configured: false, client: null, existing: [] };
    }
    for (const row of data ?? []) {
      existing.push({
        id: row.id,
        slug: row.slug,
        source: row.source,
        sourceId: row.source_id,
        alternateSourceIds: row.alternate_source_ids ?? [],
        createdAt: row.created_at,
      });
    }
    if ((data ?? []).length < 1000) break;
  }
  return { configured: true, client, existing };
}

async function saveRows(
  client: ReturnType<typeof createClient<Database>>,
  rows: StoreRow[],
  existing: ExistingStore[],
) {
  const keep = new Set(rows.map((row) => row.id));
  const retiring = existing.filter((row) => row.sourceId && !keep.has(row.id));
  for (const row of retiring) {
    const { error } = await client
      .from("stores")
      .update({
        slug: `retired-${row.id}`,
        source_id: `retired:${row.id}`,
        is_active: false,
      })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  }

  for (let index = 0; index < rows.length; index += 200) {
    const chunk = rows.slice(index, index + 200);
    const { error } = await client.from("stores").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  for (let index = 0; index < retiring.length; index += 200) {
    const ids = retiring.slice(index, index + 200).map((row) => row.id);
    if (ids.length === 0) continue;
    const { error } = await client.from("stores").delete().in("id", ids);
    if (error) throw new Error(error.message);
  }
}
