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
 * not merged.
 */
export const PLACE_FOLD_RULE =
  "City and region pages treat capital letters and accents as the same place. Accents are removed. Letters such as ł, ø, đ, and ß become the plain letter. Apostrophes are dropped. Tiranë folds to tirane, and a final a and a final e are the same ending when both spellings are in the same country and region, so Tirana and Tiranë share one page. A spelling that appears on its own is kept: Eugene stays eugene. The page title uses the spelling that already appears most often. The shop keeps the name it came with. Nearby shops with different names stay separate.";

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

/** URL piece for one place name. Blank stays blank. The same text always returns the same slug. */
export function placeSlug(value: string): string {
  let folded = "";
  for (const char of value) folded += LETTER_FOLDS[char] ?? char;
  return stableSlug(folded);
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

  const bySlug = new Map<string, string[]>();
  for (const name of distinct) {
    const slug = slugOf.get(name) ?? "";
    const list = bySlug.get(slug) ?? [];
    list.push(name);
    bySlug.set(slug, list);
  }
  for (const list of bySlug.values()) {
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
