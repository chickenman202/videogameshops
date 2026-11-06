export type CountryCount = {
  code: string;
  name: string;
  count: number;
};

/** How many shops are in each country. Blank country stays a blank code. */
export function countStoresByCountry(
  stores: { country: string; countryName: string }[],
): CountryCount[] {
  const groups = new Map<string, CountryCount>();
  for (const store of stores) {
    const code = store.country.trim().toUpperCase();
    const current = groups.get(code);
    if (!current) {
      groups.set(code, {
        code,
        name: store.countryName.trim() || code || "Unknown country",
        count: 1,
      });
    } else {
      current.count += 1;
      if (!current.name && store.countryName.trim()) current.name = store.countryName.trim();
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"));
}
