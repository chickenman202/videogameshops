import { BRAND } from "./site";

/** Keep search descriptions in the length Google usually shows in full. */
export function toMetaDescription(lead: string): string {
  let text = lead.replace(/\s+/g, " ").trim();
  const extras = [
    "Addresses, phone numbers, and weekly hours are on each store page.",
    "See what each shop sells before you go.",
  ];
  for (const extra of extras) {
    if (text.length >= 140) break;
    text = `${text} ${extra}`.trim();
  }
  if (text.length <= 160) return text;
  const sliced = text.slice(0, 159);
  const space = sliced.lastIndexOf(" ");
  const cut = space >= 140 ? sliced.slice(0, space) : sliced;
  return cut.replace(/[.,;:\s]+$/, "");
}

export function toTitle(text: string): string {
  const branded = `${text} | ${BRAND}`;
  if (branded.length <= 60) return branded;
  if (text.length <= 60) return text;
  return text.slice(0, 60).trimEnd();
}

/**
 * A store that carries one platform can name it.
 * A store that carries several stays a general video game store.
 * If the name is long, the brand goes before the city does.
 */
export function storeTitle(
  name: string,
  city: string,
  abbr: string,
  platforms: string[],
): string {
  const place = `${city}, ${abbr}`;
  const single = platforms.length === 1 ? platforms[0] : null;
  const core = single ? `${single} Store in ${place}` : `Video Game Store in ${place}`;
  const withBrand = `${name} | ${core} | ${BRAND}`;
  if (withBrand.length <= 60) return withBrand;
  const noBrand = `${name} | ${core}`;
  if (noBrand.length <= 60) return noBrand;
  const placeOnly = `${name} | ${place}`;
  if (placeOnly.length <= 60) return placeOnly;
  const suffix = ` | ${place}`;
  const room = Math.max(1, 60 - suffix.length);
  return `${name.slice(0, room).trimEnd()}${suffix}`.slice(0, 60);
}

export function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
