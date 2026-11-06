# videogameshops

A directory of physical video game shops. The shop list can come from Supabase, or from `data/stores.json` when the database is not connected. That fallback is what `npm run build` uses in CI.

Shops are not only in the United States. Each row has a country code. US states still have their own directory pages. Shops in other countries show up in the full store list and on their own store page.

## Show the site

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No Supabase keys are required for the pages to show the imported shops.

## Import or update shops

The source file is `data/video-game-stores.csv`.

```bash
npm run import:shops
```

That command:

1. Reads every row in the CSV.
2. Folds a shop that appears in both OpenStreetMap and Game-Route into one listing when the name, address, or website shows it is the same place.
3. Keeps the existing web address (`slug`) when that shop was already imported.
4. Writes `data/stores.json` and a short `data/import-report.json`.
5. If `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in the environment or in `.env.local`, it also saves the rows to Supabase.

Do not commit `.env.local`. The service role key must never be pasted into the repo.

Before the first database save, run the SQL in `supabase/migrations` (including `0002_store_import_fields.sql`) in the Supabase SQL editor. The JSON file is still written if that step has not been done.

Platforms, trade-ins, and repair flags are left off. The import does not guess which consoles a shop sells. A blank phone, website, hour, or photo stays blank.

A few missing fields were filled from Wikidata records that were already linked in the CSV. Those fills are listed in `data/wikidata-fills.json`. The notes on each row say where a filled value came from.

## Checks

```bash
npm test
npm run build
```

## Sources

Shop locations include data from OpenStreetMap contributors, Game-Route, Wikidata, and Dallas Retro Gamers. OpenStreetMap data is used under the Open Database License. Each store page links to its source when a link was in the file.
