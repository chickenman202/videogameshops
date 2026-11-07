import { BRAND } from "./site";

/** Trim a description. Do not add sentences the listing did not supply. */
export function toMetaDescription(lead: string): string {
  const text = lead.replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;
  const sliced = text.slice(0, 159);
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

export function catalogNoun(platformLabel: string | null): string {
  if (!platformLabel) return "video game stores";
  if (platformLabel === "Retro") return "retro game stores";
  if (platformLabel === "VR") return "VR game stores";
  return `${platformLabel} game stores`;
}

export type ListingIntroFacts = {
  total: number;
  noun: string;
  place: string | null;
  platform: boolean;
  cities: number;
  retro: number;
  used: number;
  tradeIns: number;
  repairs: number;
};

/** A short intro from real counts. Wording shifts with the place, and extra clauses only use stored tags. */
export function listingIntro(facts: ListingIntroFacts): string {
  const noun = facts.total === 1 ? facts.noun.replace(/stores$/, "store") : facts.noun;
  if (facts.total === 0) {
    return facts.place ? `No ${facts.noun} listed in ${facts.place} yet.` : `No ${facts.noun} listed yet.`;
  }

  const count = facts.total.toLocaleString("en-US");
  const cities = facts.cities.toLocaleString("en-US");
  let lead: string;
  if (!facts.place) {
    lead = facts.cities > 1 ? `${count} ${noun} in ${cities} cities.` : `${count} ${noun}.`;
  } else if (facts.cities > 1) {
    const cityWord = facts.cities === 1 ? "city" : "cities";
    lead = `${facts.place} has ${count} ${noun} in ${cities} ${cityWord}.`;
  } else if (facts.total === 1) {
    lead = placeFrame(facts.place, facts.total) === 0 ? `One ${noun} in ${facts.place}.` : `${facts.place} has one ${noun}.`;
  } else if (placeFrame(facts.place, facts.total) === 0) {
    lead = `${count} ${noun} in ${facts.place}.`;
  } else {
    lead = `${facts.place} has ${count} ${noun}.`;
  }

  const extra = introExtra(facts);
  return extra ? `${lead} ${extra}` : lead;
}

function placeFrame(place: string, total: number): number {
  let hash = total;
  for (const char of place) hash += char.charCodeAt(0);
  return hash % 2;
}

function introExtra(facts: ListingIntroFacts): string | null {
  if (facts.total === 0) return null;
  if (!facts.platform && facts.retro > 0) {
    if (facts.retro === facts.total) return facts.total === 1 ? "It is tagged retro." : "Every shop is tagged retro.";
    return ofThem(facts.retro, "is tagged retro", "are tagged retro");
  }
  if (facts.used > 0) {
    if (facts.used === facts.total) return facts.total === 1 ? "It lists used games." : "Every shop lists used games.";
    return ofThem(facts.used, "lists used games", "list used games");
  }
  if (facts.tradeIns > 0) {
    if (facts.tradeIns === facts.total) return facts.total === 1 ? "It takes trade-ins." : "Every shop takes trade-ins.";
    return ofThem(facts.tradeIns, "takes trade-ins", "take trade-ins");
  }
  if (facts.repairs > 0) {
    if (facts.repairs === facts.total) return facts.total === 1 ? "It repairs consoles." : "Every shop repairs consoles.";
    return ofThem(facts.repairs, "repairs consoles", "repair consoles");
  }
  return null;
}

function ofThem(count: number, one: string, many: string): string {
  if (count === 1) return `One of them ${one}.`;
  return `${count.toLocaleString("en-US")} of them ${many}.`;
}

export function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
