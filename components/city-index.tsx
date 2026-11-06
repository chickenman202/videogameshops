"use client";

import { useMemo, useState } from "react";

type CityItem = { name: string; href: string; count: number };

/** City list with a local name filter. It only hides rows on this page. */
export function CityIndex({ cities }: { cities: CityItem[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cities;
    return cities.filter((city) => city.name.toLowerCase().includes(needle));
  }, [cities, query]);

  return (
    <section className="mt-8" aria-labelledby="cities-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="cities-heading" className="text-2xl text-ink sm:text-3xl">
            Cities
          </h2>
          <p className="mt-1 text-sm text-muted">Pick a city to see its shops. The number is how many are listed.</p>
        </div>
        {cities.length > 8 ? (
          <label className="block w-full sm:max-w-xs">
            <span className="sr-only">Find a city</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a city"
              className="field"
              type="search"
            />
          </label>
        ) : null}
      </div>
      {shown.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((city) => (
            <li key={city.href}>
              <a
                href={city.href}
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 py-2 hover:border-pine"
              >
                <span className="font-semibold text-ink">{city.name}</span>
                <span className="shrink-0 text-sm text-muted">
                  {city.count.toLocaleString("en-US")}
                  <span className="sr-only"> stores</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-ink-soft">No city on this page matches that name.</p>
      )}
    </section>
  );
}
