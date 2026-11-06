import { isUsableAbout } from "@/lib/publish";

const BOILERPLATE = [
  /^osm shop=/i,
  /^city inferred/i,
  /^independent video game store \(game-route/i,
  /^listed on dallas retro/i,
  /^wikidata instance of video game store/i,
];

/** Drop source tags. Keep the words a person actually wrote about the shop. */
export function readableShopInfo(storeInfo: string | null | undefined): string | null {
  const parts = (storeInfo ?? "")
    .split("|")
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((part) => !BOILERPLATE.some((pattern) => pattern.test(part)));
  const text = parts.join(" | ").trim();
  return text || null;
}

export function aboutFromShopInfo(storeInfo: string | null | undefined): string | null {
  const text = readableShopInfo(storeInfo);
  return text && isUsableAbout(text) ? text : null;
}
