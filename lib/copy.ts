import { BRAND } from "./site";

/** Keep search descriptions in the length Google usually shows in full. */
export function toMetaDescription(lead: string): string {
  let text = lead.replace(/\s+/g, " ").trim();
  const extras = [
    "Addresses, phone numbers, and weekly hours are on each store page.",
    "See what each shop sells before you go.",
  ];
  // Only add a whole extra sentence. A cut-off sentence reads like "Addresses, phone".
  for (const extra of extras) {
    if (text.length >= 150) break;
    const next = `${text} ${extra}`.trim();
    if (next.length > 160) break;
    text = next;
  }
  if (text.length <= 160) return text;
  const sliced = text.slice(0, 157);
  const space = sliced.lastIndexOf(" ");
  const cut = space >= 80 ? sliced.slice(0, space) : sliced;
  return cut.replace(/[.,;:\s]+$/, "");
}

export function toTitle(text: string): string {
  const branded = `${text} | ${BRAND}`;
  if (branded.length <= 60) return branded;
  if (text.length <= 60) return text;
  return text.slice(0, 60).trimEnd();
}

/**
 * "{Shop Name} in {City, Region}".
 * A shop that carries one platform can add that platform when it still fits.
 * A long name keeps the place and drops the brand.
 */
export function storeTitle(name: string, city: string, region: string, platforms: string[]): string {
  const place = `${city}, ${region}`;
  const located = `${name} in ${place}`;
  const single = platforms.length === 1 ? platforms[0] : null;
  if (single) {
    const withPlatform = `${located} | ${single}`;
    if (withPlatform.length <= 60) return withPlatform;
  }
  if (located.length <= 60) return located;
  const suffix = ` in ${place}`;
  if (suffix.length >= 59) return place.slice(0, 60);
  const room = 60 - suffix.length;
  return `${name.slice(0, room).trimEnd()}${suffix}`.slice(0, 60);
}

/** "Austin Video Game Stores" or "Austin, Texas Video Game Stores" when the city name is shared. */
export function cityStoresTitle(city: string, region: string | null, ambiguous: boolean): string {
  if (ambiguous && region) return `${city}, ${region} Video Game Stores`;
  return `${city} Video Game Stores`;
}

export function regionStoresTitle(region: string, country: string | null, ambiguous: boolean): string {
  if (ambiguous && country) return `${region}, ${country} Video Game Stores`;
  return `${region} Video Game Stores`;
}

export function countryStoresTitle(country: string): string {
  return `${country} Video Game Stores`;
}

/** The place shown after "in" on a shop title. US uses the state code. Other countries use the region name. */
export function shopRegionLabel(input: {
  countryCode: string;
  state: string;
  stateAbbr: string;
}): string {
  if (input.countryCode === "US") return input.stateAbbr;
  return input.state;
}

export function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
