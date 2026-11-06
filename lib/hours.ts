export type HourRange = { opens: string; closes: string };

export type ParsedDay =
  | { status: "empty" }
  | { status: "closed" }
  | { status: "parsed"; ranges: HourRange[] }
  | { status: "unparsed" };

const UNICODE_DASHES = /[\u2012\u2013\u2014\u2015\u2212]/g;

/** Turn Google's long dashes into a normal hyphen so the hours can be read. */
export function normalizeOpeningHoursDashes(value: string): string {
  return value.replace(UNICODE_DASHES, "-").replace(/\u00A0/g, " ").trim();
}

const RANGE_RE =
  /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i;

function to24Hour(hour12: number, minute: number, period: "AM" | "PM"): string | null {
  if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) return null;
  let hour = hour12;
  if (period === "AM") hour = hour12 === 12 ? 0 : hour12;
  if (period === "PM") hour = hour12 === 12 ? 12 : hour12 + 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Google often writes "3:00 - 8:00 PM" and leaves AM/PM off the opening time.
 * 3 to 8 is the same afternoon. 10 to 6 means 10 in the morning through 6 at night.
 */
function inferMissingPeriod(
  knownHour: number,
  missingHour: number,
  known: "AM" | "PM",
  missingIsOpen: boolean,
): "AM" | "PM" | null {
  if (!missingIsOpen) {
    if (known === "AM") return missingHour > knownHour || missingHour === 12 ? "AM" : "PM";
    return missingHour > knownHour ? "PM" : missingHour === 12 ? "AM" : "AM";
  }
  if (known === "AM") {
    return missingHour === 12 ? "AM" : missingHour < knownHour ? "PM" : "AM";
  }
  if (missingHour === 12) return "PM";
  if (missingHour < knownHour) return "PM";
  return "AM";
}

function parseRange(segment: string): HourRange | null {
  const match = segment.match(RANGE_RE);
  if (!match) return null;
  const openHour = Number(match[1]);
  const openMinute = Number(match[2] ?? "0");
  const closeHour = Number(match[4]);
  const closeMinute = Number(match[5] ?? "0");
  let openPeriod = match[3]?.toUpperCase() as "AM" | "PM" | undefined;
  let closePeriod = match[6]?.toUpperCase() as "AM" | "PM" | undefined;

  if (!openPeriod && !closePeriod) return null;
  if (!openPeriod && closePeriod) {
    openPeriod = inferMissingPeriod(closeHour, openHour, closePeriod, true) ?? undefined;
  } else if (openPeriod && !closePeriod) {
    closePeriod = inferMissingPeriod(openHour, closeHour, openPeriod, false) ?? undefined;
  }
  if (!openPeriod || !closePeriod) return null;

  const opens = to24Hour(openHour, openMinute, openPeriod);
  const closes = to24Hour(closeHour, closeMinute, closePeriod);
  if (!opens || !closes) return null;
  return { opens, closes };
}

export function parseDayHours(value: string | null | undefined): ParsedDay {
  const normalized = normalizeOpeningHoursDashes(value ?? "");
  if (!normalized) return { status: "empty" };
  if (/^closed$/i.test(normalized)) return { status: "closed" };
  if (/^open 24 hours\.?$/i.test(normalized)) {
    return { status: "parsed", ranges: [{ opens: "00:00", closes: "23:59" }] };
  }

  const segments = normalized
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return { status: "empty" };

  const ranges: HourRange[] = [];
  for (const segment of segments) {
    const range = parseRange(segment);
    if (!range) return { status: "unparsed" };
    ranges.push(range);
  }
  return { status: "parsed", ranges };
}

export const WEEKDAYS = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
] as const;

export function displayHours(value: string): string {
  return normalizeOpeningHoursDashes(value);
}
