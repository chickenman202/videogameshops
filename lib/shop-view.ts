import type { CatalogStore } from "@/lib/catalog";
import type { Filters } from "@/lib/filters";
import { parseDayHours, WEEKDAYS } from "@/lib/hours";
import type { PlatformLabel } from "@/lib/platforms";
import { FIXTURE_SHOPS } from "@/lib/fixture-shops";

/**
 * Extra facts the import adds onto a shop. They are optional here so the
 * page can render them after that branch merges, and skip them when absent.
 */
export type ShopView = CatalogStore & {
  country?: string;
  countryName?: string;
  displayName?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  otherSocials?: string[];
  hoursRaw?: string | null;
};

export type ShopLink = { label: string; href: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function httpUrl(value: unknown): string | null {
  const url = text(value);
  return /^https?:\/\//i.test(url) ? url : null;
}

export function shopCountry(store: ShopView): string {
  return text(store.country).toUpperCase();
}

export function shopCountryName(store: ShopView): string {
  const name = text(store.countryName);
  if (name) return name;
  const code = shopCountry(store);
  return code && code !== "US" ? code : "";
}

function placeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Same place after case, accents, and a final vowel (Tirana / Tiranë / Tirane). */
function samePlace(a: string, b: string): boolean {
  const left = placeKey(a);
  const right = placeKey(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const stem = (key: string) => key.replace(/[aeiou]+$/, "");
  const leftStem = stem(left);
  const rightStem = stem(right);
  return leftStem.length >= 4 && leftStem === rightStem;
}

/** Drop a later name when it is the same place as an earlier one. */
export function distinctPlace(parts: string[]): string[] {
  const kept: string[] = [];
  for (const part of parts) {
    const value = part.trim();
    if (!value) continue;
    if (kept.some((item) => samePlace(item, value))) continue;
    kept.push(value);
  }
  return kept;
}

const SMALL_PLACE_WORDS = new Set(["and", "d", "da", "de", "del", "des", "di", "du", "en", "la", "le", "of", "y"]);

/** Title case that keeps accents already in the name. Small words stay lower after the first word. */
export function displayPlace(value: string): string {
  let seenWord = false;
  return value
    .split(/(\s+|-|')/)
    .map((part) => {
      if (!part || /^(\s+|-|')$/.test(part)) return part;
      const lower = part.toLocaleLowerCase("en");
      const capped = lower.charAt(0).toLocaleUpperCase("en") + lower.slice(1);
      if (!seenWord) {
        seenWord = true;
        return capped;
      }
      seenWord = true;
      return SMALL_PLACE_WORDS.has(lower) ? lower : capped;
    })
    .join("");
}

/** City and region. `line` drops a long region so it does not wrap beside the city. `full` keeps both. */
export function shopLocation(store: ShopView): { line: string; full: string; country: string } {
  const abbr = text(store.stateAbbr);
  const region = abbr || text(store.state);
  const parts = distinctPlace([text(store.city), region]);
  const pretty = parts.map((part, index) =>
    index > 0 && abbr && /^[A-Za-z]{2}$/.test(part) ? part.toUpperCase() : displayPlace(part),
  );
  const full = pretty.join(", ");
  const regionLabel = pretty[1] ?? "";
  const line = regionLabel.length > 18 ? (pretty[0] ?? "") : full;
  return { line, full, country: shopCountryName(store) };
}

/** Street, city, and country. A blank address is left out instead of guessed. */
export function formatShopPlace(store: ShopView): string {
  const address = text(store.address);
  const region = text(store.stateAbbr) || text(store.state);
  const local = distinctPlace([text(store.city), region]).join(", ");
  const localLine = [local, text(store.zip)].filter(Boolean).join(" ");
  const country = shopCountry(store);
  const countryLabel = country && country !== "US" ? shopCountryName(store) : "";
  return distinctPlace([address, localLine, countryLabel]).join(", ");
}

export function hasAddress(store: ShopView): boolean {
  return Boolean(text(store.address));
}

/**
 * Directions need a street. A city name or a map pin from coordinates is not enough,
 * because many imported rows only have a place centroid.
 */
export function directionsUrl(store: ShopView): string | null {
  if (!hasAddress(store)) return null;
  const place = formatShopPlace(store);
  return place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : null;
}

/** US numbers display as (205) 624-3234. Anything else stays as stored. */
export function formatPhone(value: string | null | undefined): string | null {
  const original = text(value);
  if (!original) return null;
  const digits = original.replace(/\D/g, "");
  const us = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits.length === 10 ? digits : "";
  if (!us) return original;
  return `(${us.slice(0, 3)}) ${us.slice(3, 6)}-${us.slice(6)}`;
}

export function socialLinks(store: ShopView): ShopLink[] {
  const links: ShopLink[] = [];
  const facebook = httpUrl(store.facebook);
  const instagram = httpUrl(store.instagram);
  const twitter = httpUrl(store.twitter);
  if (facebook) links.push({ label: "Facebook", href: facebook });
  if (instagram) links.push({ label: "Instagram", href: instagram });
  if (twitter) links.push({ label: "X", href: twitter });
  for (const item of store.otherSocials ?? []) {
    const href = httpUrl(item);
    if (href) links.push({ label: socialLabel(href), href });
  }
  return links;
}

export function hoursNote(store: ShopView): string | null {
  const note = text(store.hoursRaw);
  if (!note) return null;
  return formatOsmHours(note) ?? note;
}

const SCHEMA_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

/**
 * Schema.org openingHours strings. A day or an OSM string that does not parse is left out.
 * Closed days are not invented.
 */
export function schemaOpeningHours(store: ShopView): string[] {
  const fromDays = openingHoursFromDayMap(store.hours);
  if (fromDays.length > 0) return fromDays;
  // The day map did not parse (for example 24-hour "10:00-19:00"); use the stored OSM string instead.
  const raw = text(store.hoursRaw);
  if (!raw) return [];
  return openingHoursFromOsm(raw) ?? [];
}

function openingHoursFromDayMap(hours: ShopView["hours"]): string[] {
  if (!hours) return [];
  const lines: string[] = [];
  WEEKDAYS.forEach(([key], index) => {
    const parsed = parseDayHours(hours[key]);
    if (parsed.status !== "parsed") return;
    const day = SCHEMA_DAYS[index];
    for (const range of parsed.ranges) lines.push(`${day} ${range.opens}-${range.closes}`);
  });
  return lines;
}

function openingHoursFromOsm(value: string): string[] | null {
  const raw = value.replace(/\s+/g, " ").trim();
  if (!raw) return null;
  if (/^24\/7$/i.test(raw)) return ["Mo-Su 00:00-23:59"];

  const byDay: Array<string | null> = Array.from({ length: 7 }, () => null);
  for (const rule of raw.split(";")) {
    const parsed = parseOsmRuleSchema(rule.trim());
    if (!parsed) return null;
    for (const day of parsed.days) byDay[day] = parsed.times;
  }
  return groupSchemaDays(byDay);
}

function parseOsmRuleSchema(rule: string): { days: number[]; times: string } | null {
  if (!rule) return null;
  const closed = /^([A-Za-z]{2}(?:\s*[-,]\s*[A-Za-z]{2})*)\s+(off|closed)$/i.exec(rule);
  if (closed) {
    const days = expandOsmDays(closed[1]);
    return days ? { days, times: "" } : null;
  }
  const open = /^([A-Za-z]{2}(?:\s*[-,]\s*[A-Za-z]{2})*)\s+(.+)$/.exec(rule);
  if (!open) return null;
  const days = expandOsmDays(open[1]);
  const times = schemaTimes(open[2]);
  if (!days || !times) return null;
  return { days, times };
}

function schemaTimes(spec: string): string | null {
  const ranges = spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (ranges.length === 0) return null;
  const formatted: string[] = [];
  for (const range of ranges) {
    const match = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(range);
    if (!match) return null;
    const opens = schemaClock(match[1]);
    const closes = schemaClock(match[2]);
    if (!opens || !closes) return null;
    formatted.push(`${opens}-${closes}`);
  }
  return formatted.join(",");
}

function schemaClock(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const minute = Number(match[2]);
  const hour = Number(match[1]);
  if (minute > 59 || hour > 24 || (hour === 24 && minute !== 0)) return null;
  if (hour === 24) return "24:00";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function groupSchemaDays(byDay: Array<string | null>): string[] {
  const parts: string[] = [];
  let index = 0;
  while (index < 7) {
    const label = byDay[index];
    if (!label) {
      index += 1;
      continue;
    }
    let end = index;
    while (end + 1 < 7 && byDay[end + 1] === label) end += 1;
    const span = index === end ? SCHEMA_DAYS[index] : `${SCHEMA_DAYS[index]}-${SCHEMA_DAYS[end]}`;
    parts.push(`${span} ${label}`);
    index = end + 1;
  }
  return parts;
}

const OSM_DAYS = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;
const OSM_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Turn a common OSM opening_hours string into weekday ranges. Unreadable strings stay raw. */
export function formatOsmHours(value: string): string | null {
  const raw = value.replace(/\s+/g, " ").trim();
  if (!raw) return null;
  if (/^24\/7$/i.test(raw)) return "Open 24 hours";

  const byDay: Array<string | undefined> = Array.from({ length: 7 }, () => undefined);
  for (const rule of raw.split(";")) {
    const parsed = parseOsmRule(rule.trim());
    if (!parsed) return null;
    for (const day of parsed.days) byDay[day] = parsed.label;
  }

  const parts: string[] = [];
  let index = 0;
  while (index < 7) {
    const label = byDay[index];
    if (!label) {
      index += 1;
      continue;
    }
    let end = index;
    while (end + 1 < 7 && byDay[end + 1] === label) end += 1;
    const span = index === end ? OSM_LABELS[index] : `${OSM_LABELS[index]}–${OSM_LABELS[end]}`;
    parts.push(label === "closed" ? `${span} closed` : `${span} ${label}`);
    index = end + 1;
  }
  return parts.length > 0 ? parts.join(". ") : null;
}

function parseOsmRule(rule: string): { days: number[]; label: string } | null {
  if (!rule) return null;
  const closed = /^([A-Za-z]{2}(?:\s*[-,]\s*[A-Za-z]{2})*)\s+(off|closed)$/i.exec(rule);
  if (closed) {
    const days = expandOsmDays(closed[1]);
    return days ? { days, label: "closed" } : null;
  }
  const open = /^([A-Za-z]{2}(?:\s*[-,]\s*[A-Za-z]{2})*)\s+(.+)$/.exec(rule);
  if (!open) return null;
  const days = expandOsmDays(open[1]);
  const label = formatOsmTimes(open[2]);
  if (!days || !label) return null;
  return { days, label };
}

function expandOsmDays(spec: string): number[] | null {
  const days: number[] = [];
  for (const part of spec.split(",")) {
    const bits = part
      .trim()
      .toLowerCase()
      .split("-")
      .map((bit) => bit.trim())
      .filter(Boolean);
    if (bits.length === 1) {
      const day = OSM_DAYS.indexOf(bits[0] as (typeof OSM_DAYS)[number]);
      if (day < 0) return null;
      days.push(day);
      continue;
    }
    if (bits.length !== 2) return null;
    const start = OSM_DAYS.indexOf(bits[0] as (typeof OSM_DAYS)[number]);
    const end = OSM_DAYS.indexOf(bits[1] as (typeof OSM_DAYS)[number]);
    if (start < 0 || end < 0 || start > end) return null;
    for (let day = start; day <= end; day += 1) days.push(day);
  }
  return days.length > 0 ? days : null;
}

function formatOsmTimes(spec: string): string | null {
  const ranges = spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (ranges.length === 0) return null;
  const formatted: string[] = [];
  for (const range of ranges) {
    const match = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(range);
    if (!match) return null;
    const opens = formatOsmClock(match[1]);
    const closes = formatOsmClock(match[2]);
    if (!opens || !closes) return null;
    formatted.push(`${opens}–${closes}`);
  }
  return formatted.join(", ");
}

function formatOsmClock(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const minute = Number(match[2]);
  let hour = Number(match[1]);
  if (minute > 59 || hour > 24 || (hour === 24 && minute !== 0)) return null;
  if (hour === 24) hour = 0;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function socialLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("facebook.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host === "x.com" || host.includes("twitter.")) return "X";
    if (host.includes("youtube.") || host === "youtu.be") return "YouTube";
    if (host.includes("tiktok.")) return "TikTok";
    return host;
  } catch {
    return "Link";
  }
}

/** The fixture is only for an empty live catalog. Real rows always win. */
export function previewShopsFor(input: {
  liveCount: number;
  stateSlug?: string | null;
  citySlug?: string | null;
  platformLabel?: PlatformLabel | null;
  filters: Filters;
}): ShopView[] | null {
  if (input.liveCount > 0) return null;
  const query = input.filters.q.toLowerCase();
  return FIXTURE_SHOPS.filter((store) => {
    if (input.stateSlug && store.stateSlug !== input.stateSlug) return false;
    if (input.citySlug && store.citySlug !== input.citySlug) return false;
    if (input.platformLabel && !store.platforms.includes(input.platformLabel)) return false;
    if (input.filters.sellsNew && !store.sellsNew) return false;
    if (input.filters.sellsUsed && !store.sellsUsed) return false;
    if (input.filters.tradeIns && !store.tradeIns) return false;
    if (input.filters.repairs && !store.repairs) return false;
    if (input.filters.platform && !store.platforms.includes(input.filters.platform)) return false;
    if (!query) return true;
    const haystack = [store.name, store.city, store.state, store.countryName ?? "", store.country ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
