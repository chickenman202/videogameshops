export function formatStorePlace(store: {
  address: string;
  city: string;
  state: string;
  stateAbbr: string;
  zip: string | null;
  country: string;
  countryName: string;
}): string {
  const parts = [store.address.trim(), store.city.trim()].filter(Boolean);
  if (store.country === "US") {
    const region = [store.stateAbbr || store.state, store.zip ?? ""].filter(Boolean).join(" ").trim();
    if (region) parts.push(region);
    return parts.join(", ");
  }
  if (store.state && store.zip) parts.push(`${store.state} ${store.zip}`);
  else if (store.state) parts.push(store.state);
  else if (store.zip) parts.push(store.zip);
  const country = store.countryName.trim() || store.country.trim();
  if (country) parts.push(country);
  return parts.join(", ");
}

export function sourceLabel(source: string | null | undefined): string | null {
  if (source === "osm") return "OpenStreetMap";
  if (source === "gameroute") return "Game-Route";
  if (source === "wikidata") return "Wikidata";
  if (source === "dallasretrogamers") return "Dallas Retro Gamers";
  if (!source?.trim()) return null;
  return source.trim();
}

export function linkLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("facebook.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host === "x.com" || host.includes("twitter.")) return "X";
    if (host.includes("youtube.") || host === "youtu.be") return "YouTube";
    if (host.includes("tiktok.")) return "TikTok";
    return host;
  } catch {
    return "Link";
  }
}
