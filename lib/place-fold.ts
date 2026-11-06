import { stableSlug } from "./slug";

/**
 * City and region pages treat capital letters and accents as the same place.
 * Accents are removed. Letters that do not split into a base letter (ł, ø, đ,
 * ð, þ, æ, œ, ß, ı) become the plain letter. Apostrophes are dropped.
 * Tiranë folds to tirane. When tirana and tirane both appear in the same
 * country and region, they are one place, because the only difference left is
 * a final a versus a final e. A name that appears on its own is not rewritten:
 * Eugene stays eugene, and Rome stays rome unless Roma is in that same region.
 * The page title uses the spelling that already appears most often. Each shop
 * keeps the city and region text it came with. Shops that are only nearby are
 * not merged. 臺 and 台 are the same character, so 台北市 and 臺北市 share a page.
 * English and local names such as Lisbon and Lisboa stay separate.
 */
export const PLACE_FOLD_RULE =
  "City and region pages treat capital letters and accents as the same place. Accents are removed. Letters such as ł, ø, đ, and ß become the plain letter. Apostrophes are dropped. Tiranë folds to tirane, and a final a and a final e are the same ending when both spellings are in the same country and region, so Tirana and Tiranë share one page. A spelling that appears on its own is kept: Eugene stays eugene. The characters 臺 and 台 are the same, so 台北市 and 臺北市 share one page. English and another language stay separate, such as Taipei and 台北市, or Lisbon and Lisboa. The page title uses the spelling that already appears most often. The shop keeps the name it came with. Nearby shops with different names stay separate.";

const LETTER_FOLDS: Record<string, string> = {
  ł: "l",
  Ł: "l",
  ø: "o",
  Ø: "o",
  đ: "d",
  Đ: "d",
  ð: "d",
  Ð: "d",
  þ: "th",
  Þ: "th",
  æ: "ae",
  Æ: "ae",
  œ: "oe",
  Œ: "oe",
  ß: "ss",
  ı: "i",
  ŋ: "n",
  Ŋ: "n",
};

/** Traditional and common forms of the same character. Not a translation. */
const SAME_CHARACTER: Record<string, string> = {
  臺: "台",
};

/** URL piece for one place name. Blank stays blank. The same text always returns the same slug. */
export function placeSlug(value: string): string {
  let folded = "";
  for (const char of value) folded += LETTER_FOLDS[char] ?? char;
  return stableSlug(folded);
}

/** Grouping key. 臺北市 and 台北市 match. The stored slug still comes from the winning spelling. */
export function writtenPlaceKey(value: string): string {
  let folded = "";
  for (const char of value) folded += SAME_CHARACTER[char] ?? char;
  return placeSlug(folded);
}

/**
 * One slug per spelling, for names that belong to the same country and region.
 * The slug is the folded form of the spelling that appears most often.
 * A tie keeps the spelling that sorts first. Nothing new is invented.
 */
export function groupPlaceNames(names: string[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  const distinct = [...counts.keys()];
  const slugOf = new Map(distinct.map((name) => [name, placeSlug(name)]));
  const keyOf = new Map(distinct.map((name) => [name, writtenPlaceKey(name)]));
  const parent = new Map(distinct.map((name) => [name, name]));

  function find(name: string): string {
    let root = name;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    if (root !== name) parent.set(name, root);
    return root;
  }

  function unite(left: string, right: string) {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  }

  const byKey = new Map<string, string[]>();
  const bySlug = new Map<string, string[]>();
  for (const name of distinct) {
    const key = keyOf.get(name) ?? "";
    const keyList = byKey.get(key) ?? [];
    keyList.push(name);
    byKey.set(key, keyList);
    const slug = slugOf.get(name) ?? "";
    const slugList = bySlug.get(slug) ?? [];
    slugList.push(name);
    bySlug.set(slug, slugList);
  }
  for (const list of byKey.values()) {
    for (let index = 1; index < list.length; index += 1) {
      const first = list[0];
      const next = list[index];
      if (first && next) unite(first, next);
    }
  }
  for (const slug of bySlug.keys()) {
    if (slug.length < 4 || (!slug.endsWith("a") && !slug.endsWith("e"))) continue;
    const other = `${slug.slice(0, -1)}${slug.endsWith("a") ? "e" : "a"}`;
    const left = bySlug.get(slug)?.[0];
    const right = bySlug.get(other)?.[0];
    if (left && right) unite(left, right);
  }

  const members = new Map<string, string[]>();
  for (const name of distinct) {
    const root = find(name);
    const list = members.get(root) ?? [];
    list.push(name);
    members.set(root, list);
  }

  const grouped = new Map<string, string>();
  for (const list of members.values()) {
    const best = [...list].sort(
      (left, right) => (counts.get(right) ?? 0) - (counts.get(left) ?? 0) || left.localeCompare(right, "en"),
    )[0];
    const slug = best ? (slugOf.get(best) ?? "") : "";
    for (const name of list) grouped.set(name, slug);
  }
  return grouped;
}

const SMALL_WORDS = new Set([
  "a",
  "ad",
  "al",
  "am",
  "an",
  "and",
  "ar",
  "as",
  "auf",
  "d",
  "da",
  "das",
  "de",
  "dei",
  "del",
  "della",
  "delle",
  "dello",
  "degli",
  "den",
  "der",
  "des",
  "di",
  "do",
  "dos",
  "du",
  "e",
  "ed",
  "el",
  "es",
  "i",
  "im",
  "in",
  "l",
  "la",
  "las",
  "le",
  "les",
  "los",
  "o",
  "of",
  "près",
  "pres",
  "the",
  "upon",
  "va",
  "van",
  "von",
  "y",
]);

function isLetter(char: string): boolean {
  return char.toLocaleLowerCase("en") !== char.toLocaleUpperCase("en");
}

/**
 * Readable label for a city or region. Accents that are already in the text stay.
 * No accent is added. A short all-caps code such as ES stays as written.
 */
export function readablePlace(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const letters = [...trimmed].filter(isLetter);
  const allCaps = letters.length > 0 && letters.every((char) => char === char.toLocaleUpperCase("en"));
  if (allCaps && letters.length <= 3 && !trimmed.includes(" ")) return trimmed;

  let firstWord = true;
  return trimmed
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const word = titleToken(part, firstWord, allCaps);
      firstWord = false;
      return word;
    })
    .join("");
}

function titleToken(token: string, first: boolean, force: boolean): string {
  const letters = [...token].filter(isLetter);
  const isLower = letters.length > 0 && letters.every((char) => char === char.toLocaleLowerCase("en"));
  const isCaps = letters.length > 0 && letters.every((char) => char === char.toLocaleUpperCase("en"));
  // "St. John's" and "D.C." already have capitals. Leave them alone.
  if (!force && !isLower) return token;
  if (!force && isCaps) return token;
  if (token.includes("-")) {
    return token
      .split("-")
      .map((part, index) => titlePiece(part, first && index === 0, force))
      .join("-");
  }
  return titlePiece(token, first, force);
}

function titlePiece(piece: string, first: boolean, force: boolean): string {
  const split = piece.match(/^([^,.;]*)([,.;]*)$/);
  const core = split?.[1] ?? piece;
  const tail = split?.[2] ?? "";
  const apostrophe = core.match(/^([^’']+)([’'])(.+)$/);
  // Only d', l', and o' are particles. John's stays a possessive.
  if (apostrophe && (apostrophe[1] ?? "").length <= 2) {
    const left = apostrophe[1] ?? "";
    const mark = apostrophe[2] ?? "'";
    const right = apostrophe[3] ?? "";
    return `${titleWord(left, first, force)}${mark}${titleWord(right, true, force)}${tail}`;
  }
  return `${titleWord(core, first, force)}${tail}`;
}

function titleWord(word: string, first: boolean, force: boolean): string {
  if (!word) return word;
  const lower = word.toLocaleLowerCase("en");
  if (!first && SMALL_WORDS.has(lower)) return lower;
  return `${word.charAt(0).toLocaleUpperCase("en")}${word.slice(1).toLocaleLowerCase("en")}`;
}

/** The spelling already stored most often. Ties use the one that sorts first. */
export function preferredPlaceName(names: string[]): string {
  const counts = new Map<string, number>();
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  return (
    [...counts.entries()].sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"),
    )[0]?.[0] ?? ""
  );
}
