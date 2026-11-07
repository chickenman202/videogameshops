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
  "na",
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

export function isPublishableStore(input: {
  name: string;
  address: string;
  city: string;
  state: string;
}): boolean {
  const name = input.name.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  if (name.length < 2 || address.length < 4 || city.length < 2 || !state) return false;
  if (isKeyboardMash(name)) return false;
  if (isKeyboardMash(address)) return false;
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

/**
 * A shop page stays public either way.
 * It is indexable only when at least one of street, phone, or website is stored.
 */
export function isIndexableShop(store: {
  address: string;
  phone: string | null;
  website: string | null;
}): boolean {
  return Boolean(store.address.trim() || store.phone?.trim() || store.website?.trim());
}
