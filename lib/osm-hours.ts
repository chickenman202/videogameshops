import { WEEKDAYS } from "@/lib/hours";

const DAY_INDEX: Record<string, number> = {
  mo: 0,
  tu: 1,
  we: 2,
  th: 3,
  fr: 4,
  sa: 5,
  su: 6,
};

const DAY_KEYS = WEEKDAYS.map(([key]) => key);

/**
 * Read the common OpenStreetMap opening_hours patterns into weekday text.
 * Days that are not written stay blank. A blank day is not the same as closed.
 * If a piece cannot be read, the whole line is left as raw text.
 */
export function parseOsmOpeningHours(input: string | null | undefined): Record<string, string> | null {
  const withoutNotes = (input ?? "").replace(/"[^"]*"/g, " ");
  const text = withoutNotes.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
  if (!text) return null;
  if (/^24\s*\/\s*7$/i.test(text)) {
    return Object.fromEntries(DAY_KEYS.map((day) => [day, "Open 24 hours"]));
  }

  const hours: Record<string, string> = {};
  let parsed = false;
  for (const rule of text.split(";").map((part) => part.trim()).filter(Boolean)) {
    if (isHolidayOnly(rule)) continue;
    const parsedRule = parseRule(rule);
    if (!parsedRule) return null;
    parsed = true;
    for (const [day, value] of parsedRule) hours[day] = value;
  }
  return parsed ? hours : null;
}

function isHolidayOnly(rule: string): boolean {
  return /^(ph|sh)\b/i.test(rule) && !/\b(mo|tu|we|th|fr|sa|su)\b/i.test(rule);
}

function parseRule(rule: string): [string, string][] | null {
  if (/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.test(rule)) {
    const value = parseTimes(rule);
    if (!value) return null;
    return DAY_KEYS.map((day) => [day, value]);
  }

  const match = rule.match(
    /^((?:(?:mo|tu|we|th|fr|sa|su)(?:\s*-\s*(?:mo|tu|we|th|fr|sa|su))?(?:\s*,\s*)?)+)\s+(.+)$/i,
  );
  if (!match) return null;
  const days = parseDays(match[1] ?? "");
  const times = parseTimes(match[2] ?? "");
  if (!days || !times) return null;
  return days
    .map((index): [string, string] => [DAY_KEYS[index] ?? "", times])
    .filter((entry) => entry[0] !== "");
}

function parseDays(spec: string): number[] | null {
  const parts = spec
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const days: number[] = [];
  for (const part of parts) {
    const range = part.match(/^(mo|tu|we|th|fr|sa|su)\s*-\s*(mo|tu|we|th|fr|sa|su)$/);
    if (range) {
      const start = DAY_INDEX[range[1] ?? ""];
      const end = DAY_INDEX[range[2] ?? ""];
      if (start == null || end == null || start > end) return null;
      for (let index = start; index <= end; index += 1) days.push(index);
      continue;
    }
    const one = part.match(/^(mo|tu|we|th|fr|sa|su)$/);
    if (!one) return null;
    const index = DAY_INDEX[one[1] ?? ""];
    if (index == null) return null;
    days.push(index);
  }
  return [...new Set(days)];
}

function parseTimes(spec: string): string | null {
  const text = spec.trim();
  if (/^(off|closed)$/i.test(text)) return "Closed";
  const pieces = text
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean);
  if (pieces.length === 0) return null;
  const ranges: string[] = [];
  for (const piece of pieces) {
    const match = piece.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (!match) return null;
    const opens = clock(match[1] ?? "", false);
    const closes = clock(match[2] ?? "", true);
    if (!opens || !closes) return null;
    ranges.push(`${opens}-${closes}`);
  }
  return ranges.join(", ");
}

function clock(value: string, allowEndOfDay: boolean): string | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  if (allowEndOfDay && hour === 24 && minute === 0) return "24:00";
  if (hour < 0 || hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
