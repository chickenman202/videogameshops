import type { PlatformLabel } from "@/lib/platforms";

/**
 * A shop title drops a keyword list only when it is appended after a dash,
 * colon, bar, or slash, or as a comma-separated category list. The stored name
 * stays the original string. A name written entirely in capitals is shown in
 * title case. A token of three letters or fewer stays in capitals, and so does
 * a token that contains & or a digit. GameStop, EB Games, and CeX keep those
 * spellings. A name that already mixes capitals and lowercase is left as
 * written. A platform tag is filled only when a keyword list names exactly one
 * platform this site already has. Nothing else is filled in.
 */
export const DISPLAY_NAME_RULE =
  "The stored name is the original text. A title hides a keyword list when that list is appended after a dash, colon, bar, or slash, or as a comma-separated category list, and every word in it is a category such as video games, anime, or retro. The list is kept when it is a place, a translation, or part of the name, as in Hi-Score or West Monroe. A name written in all capitals is shown in title case. A token of three letters or fewer stays in capitals, as do tokens that contain & or a digit, including EB, GS, TCG, VR, USA, UK, and C&AS. GAMESTOP is shown as GameStop, EB GAMES as EB Games, and CEX as CeX. A name that already mixes capitals and lowercase is left as written. The platforms field is filled only when that list names exactly one of Retro, PlayStation, Xbox, Nintendo, PC, Handheld, or VR. No phone, website, hour, or address is created.";

const CATEGORIES = [
  "pop culture",
  "video games",
  "videogames",
  "video game",
  "pokemon cards",
  "pokémon cards",
  "trading cards",
  "board games",
  "retro games",
  "and more",
  "pokemon",
  "pokémon",
  "funko",
  "anime",
  "manga",
  "comics",
  "records",
  "collectibles",
  "figures",
  "movies",
  "games",
  "cards",
  "toys",
  "gear",
  "repairs",
  "retro",
  "more",
].sort((left, right) => right.length - left.length);

const PLATFORM_WORDS: { word: string; label: PlatformLabel }[] = [
  { word: "playstation", label: "PlayStation" },
  { word: "nintendo", label: "Nintendo" },
  { word: "handheld", label: "Handheld" },
  { word: "xbox", label: "Xbox" },
  { word: "retro", label: "Retro" },
  { word: "pc", label: "PC" },
  { word: "vr", label: "VR" },
];

export type CleanedShopName = {
  displayName: string;
  platforms: PlatformLabel[];
};

const BRAND_CASE: Record<string, string> = {
  GAMESTOP: "GameStop",
  CEX: "CeX",
};

/** Title text for a shop. The raw name is not changed. */
export function cleanShopName(raw: string): CleanedShopName {
  const prepared = prepareShopTitle(raw);
  return { displayName: titleCaseAllCaps(prepared.title), platforms: prepared.platforms };
}

/** Which display adjustments applied. The stored name is not one of them. */
export function shopTitleAdjustments(raw: string): { hidKeywordList: boolean; titleCased: boolean } {
  const prepared = prepareShopTitle(raw);
  return {
    hidKeywordList: prepared.hidList,
    titleCased: titleCaseAllCaps(prepared.title) !== prepared.title,
  };
}

function prepareShopTitle(raw: string): { title: string; platforms: PlatformLabel[]; hidList: boolean } {
  const name = raw.trim();
  const split = appendedList(name);
  if (!split) return { title: name, platforms: [], hidList: false };
  const phrases = categoryPhrases(split.suffix);
  if (!phrases || phrases.length < 2) return { title: name, platforms: [], hidList: false };
  return { title: split.title, platforms: platformsIn(phrases), hidList: true };
}

/** A name whose letters are all capitals becomes title case. Mixed case stays. */
function titleCaseAllCaps(value: string): string {
  if (!isAllCapsName(value)) return value;
  return value
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : titleCaseToken(part)))
    .join("");
}

function isAllCapsName(value: string): boolean {
  const letters = [...value].filter((char) => /\p{L}/u.test(char));
  if (letters.length === 0) return false;
  return letters.every((char) => {
    const upper = char.toLocaleUpperCase("en");
    const lower = char.toLocaleLowerCase("en");
    return char === upper && upper !== lower;
  });
}

function titleCaseToken(token: string): string {
  if (/[&\d]/.test(token)) return token;
  const letters = token.match(/\p{L}/gu)?.join("") ?? "";
  const brand = BRAND_CASE[letters.toLocaleUpperCase("en")];
  if (brand) return token.replace(/\p{L}+/u, brand);
  const runs = token.match(/\p{L}+/gu) ?? [];
  if (runs.length > 0 && runs.every((run) => [...run].length <= 3)) return token;
  return token.replace(/\p{L}+/gu, (run: string, offset: number) => {
    const mark = token.slice(offset - 1, offset);
    if ((mark === "'" || mark === "’") && [...run].length === 1) return run.toLocaleLowerCase("en");
    if ([...run].length <= 3) return run;
    const chars = [...run];
    return (chars[0] ?? "").toLocaleUpperCase("en") + chars.slice(1).join("").toLocaleLowerCase("en");
  });
}

function appendedList(name: string): { title: string; suffix: string } | null {
  const separator = /(?:\s[-–—|:/]|[-–—|:/])\s+/g;
  const matches = [...name.matchAll(separator)].reverse();
  for (const match of matches) {
    const index = match.index ?? 0;
    const title = name.slice(0, index).trim();
    const suffix = name.slice(index + match[0].length).trim();
    if (title.length >= 3 && categoryPhrases(suffix) && !consumeCategories(title)) {
      return { title, suffix };
    }
  }
  return trailingCommaList(name);
}

/** A comma list at the end, such as "Matt's Games, Collectibles & More". */
function trailingCommaList(name: string): { title: string; suffix: string } | null {
  const parts = name.split(",");
  if (parts.length < 2) return null;
  let start = parts.length;
  while (start > 1) {
    const piece = parts[start - 1]?.trim() ?? "";
    if (!piece || (!consumeCategories(piece) && !categoryPhrases(piece))) break;
    start -= 1;
  }
  if (start === parts.length) return null;
  const title = parts.slice(0, start).join(",").trim();
  const suffix = parts.slice(start).join(",").trim();
  if (title.length < 3 || consumeCategories(title) || !categoryPhrases(suffix)) return null;
  return { title, suffix };
}

function categoryPhrases(suffix: string): string[] | null {
  const text = suffix.replace(/[!?.]+$/g, "").trim();
  if (!text) return null;
  const phrases: string[] = [];
  for (const chunk of text.split(",")) {
    const piece = chunk.trim();
    if (!piece) continue;
    const whole = consumeCategories(piece);
    if (whole) {
      phrases.push(...whole);
      continue;
    }
    const bits = piece.split(/\s+(?:&|and)\s+/i).map((item) => item.trim()).filter(Boolean);
    if (bits.length < 2) return null;
    for (const bit of bits) {
      const consumed = consumeCategories(bit);
      if (!consumed) return null;
      phrases.push(...consumed);
    }
  }
  return phrases.length >= 2 ? phrases : null;
}

function consumeCategories(text: string): string[] | null {
  let rest = text.toLocaleLowerCase("en").replace(/\s+/g, " ").trim();
  const found: string[] = [];
  while (rest) {
    const hit = CATEGORIES.find((phrase) => rest === phrase || rest.startsWith(`${phrase} `));
    if (!hit) return null;
    found.push(hit);
    rest = rest.slice(hit.length).trim();
  }
  return found;
}

function platformsIn(phrases: string[]): PlatformLabel[] {
  const labels: PlatformLabel[] = [];
  for (const phrase of phrases) {
    const words = new Set(phrase.split(" "));
    for (const platform of PLATFORM_WORDS) {
      if (words.has(platform.word) && !labels.includes(platform.label)) labels.push(platform.label);
    }
  }
  return labels.length === 1 ? labels : [];
}
