import { getStateFromInput, type UsState } from "./states";

/**
 * Canadian provinces and Australian states show up as both full names and
 * short codes in the shop file. This map only expands those codes.
 */
const CANADA: Record<string, string> = {
  ab: "Alberta",
  bc: "British Columbia",
  mb: "Manitoba",
  nb: "New Brunswick",
  nl: "Newfoundland and Labrador",
  ns: "Nova Scotia",
  nt: "Northwest Territories",
  nu: "Nunavut",
  on: "Ontario",
  pe: "Prince Edward Island",
  qc: "Quebec",
  sk: "Saskatchewan",
  yt: "Yukon",
};

const AUSTRALIA: Record<string, string> = {
  act: "Australian Capital Territory",
  nsw: "New South Wales",
  nt: "Northern Territory",
  qld: "Queensland",
  sa: "South Australia",
  tas: "Tasmania",
  vic: "Victoria",
  wa: "Western Australia",
};

const CANADA_NAMES = new Map(Object.values(CANADA).map((name) => [fold(name), name]));
const AUSTRALIA_NAMES = new Map(Object.values(AUSTRALIA).map((name) => [fold(name), name]));

function fold(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

/**
 * Turn a region cell into one spelling.
 * US "TX" and "Texas" both become "Texas".
 * Unknown regions stay exactly as they were written.
 */
export function canonicalRegion(country: string | null, region: string | null): string {
  const raw = region?.trim() ?? "";
  if (!raw) return "";
  const code = country?.trim().toUpperCase() ?? "";

  if (code === "US") {
    const folded = fold(raw);
    if (
      folded === "washington dc" ||
      folded === "washington d c" ||
      folded === "district of columbia"
    ) {
      return "District of Columbia";
    }
    return getStateFromInput(raw)?.name ?? raw;
  }

  if (code === "CA") {
    return CANADA[raw.toLowerCase()] ?? CANADA_NAMES.get(fold(raw)) ?? raw;
  }

  if (code === "AU") {
    return AUSTRALIA[raw.toLowerCase()] ?? AUSTRALIA_NAMES.get(fold(raw)) ?? raw;
  }

  return raw;
}

export function usStateFor(country: string, region: string): UsState | null {
  if (country !== "US" || !region) return null;
  return getStateFromInput(region);
}
