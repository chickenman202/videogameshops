const BLOCKED_NAMES = new Set([
  "test",
  "testing",
  "asdf",
  "asdfasdf",
  "qwerty",
  "placeholder",
  "sample",
  "sample store",
  "todo",
  "xxx",
  "vvvvvvv",
  "sadfadf",
  "tbd",
  "n/a",
  "null",
  "undefined",
  "store",
  "shop",
]);

/** Keyboard mash and placeholder names must never become public pages. */
export function isKeyboardMash(value: string): boolean {
  const letters = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!letters) return false;
  if (BLOCKED_NAMES.has(value.trim().toLowerCase())) return true;
  if (BLOCKED_NAMES.has(letters)) return true;
  if (/(.)\1{4,}/.test(letters)) return true;
  if (/asdf|sdfa|fdsa|qwer|zxcv|hjkl/.test(letters)) return true;
  const vowels = letters.replace(/[^aeiou]/g, "").length;
  if (letters.length >= 8 && vowels === 0) return true;
  return false;
}

/**
 * A public shop needs a real name and a country so the page can say where it is.
 * A missing street, city, region, or map point does not hide the shop.
 * Keyboard-mash and placeholder names stay off the site.
 */
export function isPublishableStore(input: {
  name: string;
  country: string;
}): boolean {
  const name = input.name.trim();
  const country = input.country.trim();
  if (!name || !country) return false;
  if (isKeyboardMash(name)) return false;
  return true;
}

/**
 * Thrown-away "about" text: too short to be a sentence, a review quote,
 * or a line that just points at the official website.
 */
export function isUsableAbout(value: string | null | undefined): boolean {
  const text = value?.trim() ?? "";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8 || !text.includes(".")) return false;
  if (/^official website/i.test(text)) return false;
  if (/\b(\d(\.\d)?\s*stars?|google review)\b/i.test(text)) return false;
  if (isKeyboardMash(text)) return false;
  return true;
}
