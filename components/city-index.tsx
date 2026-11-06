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
    <section className="mt-10" aria-labelledby="cities-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="cities-heading" className="text-4xl uppercase text-ink sm:text-5xl">
            Cities
          </h2>
          <p className="mt-2 text-sm text-muted">Pick a city. The number is how many shops are listed.</p>
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
        <ul className="mt-4 border-t border-ink">
          {shown.map((city) => (
            <li key={city.href} className="border-b border-line">
              <a href={city.href} className="flex min-h-12 items-baseline justify-between gap-3 py-2 hover:text-blue-ink">
                <span className="font-display text-2xl font-bold uppercase">{city.name}</span>
                <span className="kicker text-muted">
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
