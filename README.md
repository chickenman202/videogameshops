# videogameshops

A directory of physical video game shops. The shop list can come from Supabase, or from `data/stores.json` when the database is not connected. That fallback is what `npm run build` uses in CI.

Shops are not only in the United States. Each row has a country code. The country page uses that code in lowercase, such as `/directory/countries/fr`, `/directory/countries/ca`, `/directory/countries/jp`, and `/directory/countries/us`. The country name, such as France, is only used in the title. Older spellings redirect: `/directory/countries/france` goes to `/directory/countries/fr`, `/directory/countries/uk` goes to `/directory/countries/gb`, and `/directory/countries/usa` goes to `/directory/countries/us`.

US state pages stay at `/directory/texas`. A United States address written under the country prefix, such as `/directory/countries/us/texas`, redirects there. A region inside another country gets its own page when that region has at least three shops, such as `/directory/countries/fr/ile-de-france`. Smaller regions stay on the country page. Region and city names on the page are spellings already stored on a shop, shown in readable title case. An accent is kept when the source has it, and none is added. Capital letters and accents are the same place: Sao Paulo and São Paulo share one page, and Tirana and Tiranë share one page. 台北市 and 臺北市 share one page, and English Taipei uses that same page. Taichung and Tainan do the same with their Chinese names. Lisbon and Lisboa stay separate. A town that is only nearby, with a different name, stays on its own page. The shop row keeps the spelling it came with.

A shop title hides a trailing keyword list, such as “Anime, Pop Culture, Pokemon”, only when that list is appended after a dash. The original name stays in the shop file. Hi-Score and “Disc Traders - Battle Creek” stay whole.

A shop with a name and a country stays in the catalog even when the street, phone, and website are blank. Those thin shops are marked `indexable: false`. Their pages use `noindex, follow` and are left out of the sitemap until a street, phone, or website is added from a real source.

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
2. Folds a shop that appears in both OpenStreetMap and Game-Route into one listing when the name, initials, address, or website shows it is the same place. Pairs that are only nearby stay as two listings. Those decisions are listed in `data/import-report.json`.
3. Keeps the existing web address (`slug`) when that shop was already imported. A new United States shop uses name-city-state. A shop in another country uses name-city-country. If that address is already taken, the source id is added, then a number. A second run does not create a duplicate shop.
4. Writes `data/stores.json` and `data/import-report.json`. The report includes `public_listings`, `indexable_listings`, `noindex_listings`, the country URL scheme, the near-miss decisions, the place-fold rule, the Supabase note, and `stores_json_sha256` (the SHA-256 of `data/stores.json`).
5. If `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both set, it also saves the rows to Supabase. If only one of those two is set, the command stops and names the missing variable. If neither is set, it only writes the JSON file.

Do not commit `.env.local`. The service role key must never be pasted into the repo.

To save into Supabase the first time:

1. In the Supabase SQL editor, run `supabase/migrations/0001_stores.sql`.
2. Then run `supabase/migrations/0002_store_import_fields.sql`. That migration stops forcing a blank country to `US`.
3. Put `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
4. Run `npm run import:shops`.

`data/import-report.json` records `public_listings`, the number of shops that become public pages. That is the count to use everywhere. It also records which nearby pairs were merged and which were kept separate.

Platforms, trade-ins, and repair flags are left off. The import does not guess which consoles a shop sells. A blank phone, website, hour, or photo stays blank.

A few missing fields were filled from Wikidata records that were already linked in the CSV. Those fills are listed in `data/wikidata-fills.json`. The notes on each row say where a filled value came from.

## Checks

```bash
npm test
npm run build
```

## Sources

Shop locations include data from OpenStreetMap contributors, Game-Route, Wikidata, and Dallas Retro Gamers. OpenStreetMap data is used under the Open Database License. Each store page links to its source when a link was in the file.
