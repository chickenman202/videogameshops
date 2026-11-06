import { slugify } from "@/lib/slug";

/**
 * A country the directory knows by its two-letter code.
 * Shop rows store a country string. This file only translates that string.
 * It does not invent shops.
 */
export type Country = {
  code: string;
  slug: string;
  name: string;
  known: boolean;
};

const NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  GB: "United Kingdom",
  IE: "Ireland",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  PT: "Portugal",
  NL: "Netherlands",
  BE: "Belgium",
  LU: "Luxembourg",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czechia",
  HU: "Hungary",
  GR: "Greece",
  RO: "Romania",
  BG: "Bulgaria",
  HR: "Croatia",
  SK: "Slovakia",
  SI: "Slovenia",
  EE: "Estonia",
  LV: "Latvia",
  LT: "Lithuania",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  TW: "Taiwan",
  HK: "Hong Kong",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  PH: "Philippines",
  ID: "Indonesia",
  VN: "Vietnam",
  IN: "India",
  AU: "Australia",
  NZ: "New Zealand",
  ZA: "South Africa",
  AE: "United Arab Emirates",
  IL: "Israel",
  TR: "Turkey",
  UA: "Ukraine",
  GE: "Georgia",
};

/** Extra spellings people store in the country column. Values are two-letter codes. */
const EXTRA_ALIASES: Record<string, string> = {
  usa: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  "united states": "US",
  "united states of america": "US",
  america: "US",
  uk: "GB",
  "u.k.": "GB",
  "great britain": "GB",
  britain: "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  "united kingdom": "GB",
  gbr: "GB",
  fra: "FR",
  france: "FR",
  can: "CA",
  canada: "CA",
  ita: "IT",
  italy: "IT",
  esp: "ES",
  spain: "ES",
  aus: "AU",
  australia: "AU",
  jpn: "JP",
  japan: "JP",
  deu: "DE",
  germany: "DE",
  deutschland: "DE",
  mex: "MX",
  mexico: "MX",
  bra: "BR",
  brazil: "BR",
  nld: "NL",
  netherlands: "NL",
  holland: "NL",
  bel: "BE",
  belgium: "BE",
  che: "CH",
  switzerland: "CH",
  aut: "AT",
  austria: "AT",
  swe: "SE",
  sweden: "SE",
  nor: "NO",
  norway: "NO",
  dnk: "DK",
  denmark: "DK",
  fin: "FI",
  finland: "FI",
  pol: "PL",
  poland: "PL",
  cze: "CZ",
  czechia: "CZ",
  "czech republic": "CZ",
  prt: "PT",
  portugal: "PT",
  irl: "IE",
  ireland: "IE",
  nzl: "NZ",
  "new zealand": "NZ",
  kor: "KR",
  korea: "KR",
  "south korea": "KR",
  "republic of korea": "KR",
  chn: "CN",
  china: "CN",
  twn: "TW",
  taiwan: "TW",
  hkg: "HK",
  "hong kong": "HK",
  sgp: "SG",
  singapore: "SG",
  ind: "IN",
  india: "IN",
  zaf: "ZA",
  "south africa": "ZA",
  are: "AE",
  uae: "AE",
  "united arab emirates": "AE",
  geo: "GE",
  georgia: "GE",
};

const ALIASES = new Map<string, string>();
for (const code of Object.keys(NAMES)) {
  ALIASES.set(code.toLowerCase(), code);
  ALIASES.set(NAMES[code]!.toLowerCase(), code);
}
for (const [alias, code] of Object.entries(EXTRA_ALIASES)) {
  ALIASES.set(alias, code);
}

function knownCountry(code: string): Country {
  return {
    code,
    slug: code.toLowerCase(),
    name: NAMES[code] ?? code,
    known: true,
  };
}

export const UNITED_STATES = knownCountry("US");

const BY_CODE = new Map(Object.keys(NAMES).map((code) => [code, knownCountry(code)]));
const BY_SLUG = new Map([...BY_CODE.values()].map((country) => [country.slug, country]));

/**
 * Turn the stored country text into one country record.
 * A blank value stays the United States because older rows were US-only.
 * An unknown value is kept as written. It is not dropped and not renamed.
 */
export function normalizeCountry(input: string | null | undefined): Country {
  const raw = input?.trim() ?? "";
  if (!raw) return UNITED_STATES;
  const code = ALIASES.get(raw.toLowerCase());
  if (code) return BY_CODE.get(code) ?? knownCountry(code);
  const slug = slugify(raw);
  return {
    code: /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : "",
    slug: slug || "unknown",
    name: raw,
    known: false,
  };
}

/**
 * Read a country from a URL piece such as "fr" or "uk".
 * `redirectSlug` is set when the URL should move to the one official slug.
 */
export function countryBySlug(slug: string): { country: Country; redirectSlug: string | null } | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const direct = BY_SLUG.get(normalized);
  if (direct) return { country: direct, redirectSlug: null };
  const alias = ALIASES.get(normalized) ?? ALIASES.get(normalized.replace(/-/g, " "));
  if (!alias) return null;
  const country = BY_CODE.get(alias) ?? knownCountry(alias);
  return {
    country,
    redirectSlug: country.slug === normalized ? null : country.slug,
  };
}

export function isUnitedStatesSlug(slug: string): boolean {
  return countryBySlug(slug)?.country.code === "US";
}
