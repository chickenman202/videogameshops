/**
 * Some shops were collected twice: once from OpenStreetMap and once from
 * Game-Route. This file decides when two rows are the same shop.
 * Different shops on the same street stay as two listings.
 */

export type DedupeShop = {
  source: string;
  sourceId: string;
  name: string;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteDomain: string | null;
  phone?: string | null;
};

const STOP_WORDS = new Set(["video", "game", "games", "store", "shop", "the", "and", "inc", "llc", "co"]);

const GENERIC_NAMES = new Set([
  "gamestop",
  "ebgames",
  "micromania",
  "game",
  "gamelife",
  "cex",
  "gamemania",
]);

export function compactName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function namesSimilar(left: string, right: string): boolean {
  const a = compactName(left);
  const b = compactName(right);
  if (!a || !b) return false;
  if (a === b) return true;
  // "Video Juegos 2" and "Video Juegos 3" are different shops.
  if (a.replace(/\d+/g, "#") === b.replace(/\d+/g, "#")) return false;
  const shorter = Math.min(a.length, b.length);
  if (shorter >= 8 && levenshtein(a, b) <= 1) return true;
  if (shorter >= 6 && (a.includes(b) || b.includes(a))) {
    const longer = a.length >= b.length ? a : b;
    const small = a.length >= b.length ? b : a;
    const extra = longer.replace(small, "");
    if (extra.length > 0 && extra.length <= 2) return true;
    if (/^(video|games|game|store|shop)+$/.test(extra)) return true;
  }
  return false;
}

export function streetNumber(address: string | null): string | null {
  if (!address) return null;
  const match = address.trim().match(/^(\d+[a-z]?)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export function distanceMeters(
  left: { latitude: number; longitude: number },
  right: { latitude: number; longitude: number },
): number {
  const earth = 6371000;
  const lat1 = (left.latitude * Math.PI) / 180;
  const lat2 = (right.latitude * Math.PI) / 180;
  const dLat = ((right.latitude - left.latitude) * Math.PI) / 180;
  const dLon = ((right.longitude - left.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function domainOf(value: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/^www\./, "");
}

function tokens(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function tokenLoose(left: string, right: string): boolean {
  const a = tokens(left);
  const b = tokens(right);
  if (a.length === 0 || b.length === 0) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  return shorter.every((token) =>
    longer.some((other) => {
      const size = Math.min(token.length, other.length);
      return (
        token === other ||
        (size >= 6 && (token.startsWith(other) || other.startsWith(token)))
      );
    }),
  );
}

function isGeneric(name: string): boolean {
  return GENERIC_NAMES.has(compactName(name));
}

export function isSameShop(left: DedupeShop, right: DedupeShop): boolean {
  if (left.source === right.source && left.sourceId === right.sourceId) return false;
  if (!left.country || !right.country || left.country !== right.country) return false;
  if (
    left.latitude == null ||
    right.latitude == null ||
    left.longitude == null ||
    right.longitude == null
  ) {
    return false;
  }

  const meters = distanceMeters(
    { latitude: left.latitude, longitude: left.longitude },
    { latitude: right.latitude, longitude: right.longitude },
  );
  const sameSource = left.source === right.source;
  if (meters > (sameSource ? 30 : 80)) return false;

  const similar = namesSimilar(left.name, right.name);
  const generic = isGeneric(left.name) || isGeneric(right.name);
  const numberA = streetNumber(left.address);
  const numberB = streetNumber(right.address);
  if (numberA && numberB && numberA !== numberB) return false;
  const sameNumber = Boolean(numberA && numberB && numberA === numberB);

  if (sameSource) {
    if (!similar) return false;
    if (!generic) return true;
    return sameNumber || meters <= 15;
  }

  if (similar && generic) return sameNumber || meters <= 15;
  if (similar) return true;

  const sameDomain =
    domainOf(left.websiteDomain) !== "" && domainOf(left.websiteDomain) === domainOf(right.websiteDomain);
  if (sameDomain && sameNumber && meters <= 50) return true;
  if (sameNumber && meters <= 40 && tokenLoose(left.name, right.name)) return true;
  // "Disc Replay" and "Disc Traders" share a word and the same street number.
  if (sameNumber && meters <= 15 && sharedToken(left.name, right.name) && !phonesConflict(left.phone, right.phone)) {
    return true;
  }
  // "CGR Games" is the initials of "Classic Games Revisited" at the same street number.
  if (sameNumber && meters <= 30 && acronymMatch(left.name, right.name) && !phonesConflict(left.phone, right.phone)) {
    return true;
  }
  return false;
}

function nameWords(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0);
}

/** One name contains a short word that is the initials of the other name. */
function acronymMatch(left: string, right: string): boolean {
  const leftWords = nameWords(left);
  const rightWords = nameWords(right);
  const leftInitials = leftWords.map((word) => word[0] ?? "").join("");
  const rightInitials = rightWords.map((word) => word[0] ?? "").join("");
  return wordIsInitials(leftWords, rightInitials) || wordIsInitials(rightWords, leftInitials);
}

function wordIsInitials(words: string[], initials: string): boolean {
  if (initials.length < 3 || initials.length > 6) return false;
  return words.some((word) => word === initials);
}

function sharedToken(left: string, right: string): boolean {
  const tokensA = new Set(tokens(left).filter((token) => token.length >= 4));
  return tokens(right).some((token) => token.length >= 4 && tokensA.has(token));
}

function phonesConflict(left: string | null | undefined, right: string | null | undefined): boolean {
  const a = (left ?? "").replace(/\D/g, "");
  const b = (right ?? "").replace(/\D/g, "");
  if (a.length < 7 || b.length < 7) return false;
  return a !== b && !a.endsWith(b) && !b.endsWith(a);
}

/** Group row indexes that describe one shop. Singletons are included. */
export function clusterShops(shops: DedupeShop[]): number[][] {
  const parent = shops.map((_, index) => index);
  const find = (index: number): number => {
    let cursor = index;
    while (parent[cursor] !== cursor) {
      parent[cursor] = parent[parent[cursor] ?? cursor] ?? cursor;
      cursor = parent[cursor] ?? cursor;
    }
    return cursor;
  };
  const union = (left: number, right: number) => {
    const a = find(left);
    const b = find(right);
    if (a !== b) parent[b] = a;
  };

  const grid = new Map<string, number[]>();
  shops.forEach((shop, index) => {
    if (shop.latitude == null || shop.longitude == null) return;
    const key = `${shop.latitude.toFixed(2)}:${shop.longitude.toFixed(2)}`;
    const bucket = grid.get(key);
    if (bucket) bucket.push(index);
    else grid.set(key, [index]);
  });

  for (const [key, indexes] of grid) {
    const [latText, lonText] = key.split(":");
    const lat = Number(latText);
    const lon = Number(lonText);
    const neighbors: number[] = [];
    for (const dLat of [-0.01, 0, 0.01]) {
      for (const dLon of [-0.01, 0, 0.01]) {
        const near = grid.get(`${(lat + dLat).toFixed(2)}:${(lon + dLon).toFixed(2)}`);
        if (near) neighbors.push(...near);
      }
    }
    for (const left of indexes) {
      for (const right of neighbors) {
        if (left >= right) continue;
        const a = shops[left];
        const b = shops[right];
        if (a && b && isSameShop(a, b)) union(left, right);
      }
    }
  }

  const groups = new Map<number, number[]>();
  shops.forEach((_, index) => {
    const root = find(index);
    const group = groups.get(root);
    if (group) group.push(index);
    else groups.set(root, [index]);
  });
  return [...groups.values()];
}

function levenshtein(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j] ?? 0;
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min((row[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, previous + cost);
      previous = current;
    }
  }
  return row[right.length] ?? 0;
}
