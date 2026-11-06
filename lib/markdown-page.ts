import { loadCatalog } from "@/lib/catalog";
import { loadCountryPage } from "@/lib/country-page";
import { CONTENT_SIGNAL, markdownPath } from "@/lib/discovery";
import { absoluteUrl } from "@/lib/jsonld";
import { countryLinks, formatAddressLine, storePlaceLinks } from "@/lib/links";
import { buildListing, storeAbout, type ListingOk } from "@/lib/listing";
import { countriesPath, countryPath, platformPath, statePath, storePath } from "@/lib/paths";
import { getPlatformBySlug, PLATFORMS } from "@/lib/platforms";
import { isIndexableShop } from "@/lib/publish";
import { MIN_CITY_STORES, SITE_URL } from "@/lib/site";
import { getStateBySlug, US_STATES } from "@/lib/states";
import { WEEKDAYS } from "@/lib/hours";

export type MarkdownDoc = {
  status: number;
  index: boolean;
  htmlPath: string;
  body: string;
};

function link(path: string, label: string): string {
  return `[${label}](${absoluteUrl(path)})`;
}

function doc(htmlPath: string, title: string, lines: string[], index: boolean, status = 200): MarkdownDoc {
  const body = [`# ${title}`, "", ...lines.filter((line) => line !== null)].join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  return { status, index, htmlPath, body };
}

function listingMarkdown(listing: ListingOk): MarkdownDoc {
  const lines = [
    listing.description,
    "",
    listing.indexable
      ? `Canonical: ${absoluteUrl(listing.canonicalPath)}`
      : `This address is not the indexed URL. Canonical: ${absoluteUrl(listing.canonicalPath)}`,
    "",
  ];
  if (listing.cities.length > 0) {
    lines.push("## Cities", "");
    for (const city of listing.cities) {
      if (city.count < MIN_CITY_STORES) continue;
      lines.push(`- ${link(city.href, city.name)}: ${city.count} shops`);
    }
    lines.push("");
  }
  if (listing.countries.length > 0) {
    lines.push("## Countries", "");
    for (const country of listing.countries) {
      lines.push(`- ${link(country.href, country.name)}: ${country.count} shops`);
    }
    lines.push("");
  }
  if (listing.platformLinks.length > 0) {
    lines.push("## Platforms", "");
    for (const platform of listing.platformLinks) {
      lines.push(`- ${link(platform.href, platform.label)}: ${platform.count} shops`);
    }
    lines.push("");
  }
  if (listing.stores.length > 0) {
    lines.push("## Shops", "");
    for (const store of listing.stores) {
      const place = [store.city, store.state, store.countryCode === "US" ? "" : store.countryName]
        .filter(Boolean)
        .join(", ");
      lines.push(`- ${link(storePath(store.slug), store.name)}${place ? `: ${place}` : ""}`);
    }
    lines.push("");
  }
  return doc(listing.canonicalPath, listing.h1, lines, listing.indexable);
}

async function homeMarkdown(): Promise<MarkdownDoc> {
  const catalog = await loadCatalog();
  const lines = ["Find physical video game stores by country, region, and city.", ""];
  if (!catalog.ok) {
    lines.push("The store list could not be loaded.");
    return doc("/", "Video game stores near you", lines, false);
  }
  lines.push(`${catalog.stores.length.toLocaleString("en-US")} video game stores.`, "");
  const countries = countryLinks(catalog.stores);
  if (countries.length > 0) {
    lines.push("## Countries", "");
    for (const country of countries) lines.push(`- ${link(country.href, country.name)}: ${country.count} shops`);
    lines.push("");
  }
  const states = US_STATES.map((state) => ({
    ...state,
    count: catalog.stores.filter((store) => store.countryCode === "US" && store.stateSlug === state.slug).length,
  })).filter((state) => state.count >= MIN_CITY_STORES);
  if (states.length > 0) {
    lines.push("## United States", "");
    for (const state of states) lines.push(`- ${link(statePath(state.slug), state.name)}: ${state.count} shops`);
    lines.push("");
  }
  lines.push(`Browse ${link(countriesPath(), "countries")}, ${link("/directory/states", "US states")}, and ${link("/directory/platforms", "platforms")}.`);
  return doc("/", "Video game stores near you", lines, true);
}

async function storeMarkdown(slug: string): Promise<MarkdownDoc> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return doc(`/store/${slug}`, "Directory unavailable", ["The store list could not be loaded."], false, 503);
  const store = catalog.stores.find((item) => item.slug === slug);
  if (!store) return doc(`/store/${slug}`, "Page not found", ["That page is not in the directory."], false, 404);
  const lines = [storeAbout(store), "", `Canonical: ${absoluteUrl(storePath(store.slug))}`, ""];
  const address = formatAddressLine(store);
  if (address) lines.push(`- Place: ${address}`);
  if (store.phone) lines.push(`- Phone: ${store.phone}`);
  if (store.website) lines.push(`- Website: ${store.website}`);
  if (store.platforms.length > 0) lines.push(`- Platforms: ${store.platforms.join(", ")}`);
  const offers = [
    store.sellsNew ? "new games" : "",
    store.sellsUsed ? "used games" : "",
    store.tradeIns ? "trade-ins" : "",
    store.repairs ? "console repair" : "",
  ].filter(Boolean);
  if (offers.length > 0) lines.push(`- Listed services: ${offers.join(", ")}`);
  if (store.hours) {
    lines.push("", "## Hours", "");
    for (const [key, label] of WEEKDAYS) {
      const value = store.hours[key];
      if (value) lines.push(`- ${label}: ${value}`);
    }
  }
  const places = storePlaceLinks(store);
  if (places.length > 0) {
    lines.push("", "## More stores", "");
    for (const place of places) lines.push(`- ${link(place.href, place.label)}`);
  }
  return doc(storePath(store.slug), store.name, lines, isIndexableShop(store));
}

function staticPage(path: string): MarkdownDoc | null {
  const pages: Record<string, { title: string; text: string }> = {
    "/about": {
      title: "About videogameshops",
      text: "videogameshops is a worldwide directory of physical video game stores. Find physical video game stores by country, region, and city. Add a shop from any country on the submit page. The form asks for the shop name, the street, the city, and the country. Use the contact page to correct a listing that is already public. A city or region page is included in search when that place has at least three stores. A smaller place stays public.",
    },
    "/contact": {
      title: "Contact",
      text: "Send a correction for a store that is already listed. Include the store name and city so the right page can be updated.",
    },
    "/submit": {
      title: "Submit a store",
      text: "Submit a physical video game store from any country. Include the shop name, the street, the city, and the country. A closed business, a clothing brand, or a big-box store with no game counter should not be submitted.",
    },
    "/privacy": {
      title: "Privacy",
      text: "videogameshops publishes public business details that are on file for each shop. Contact and submit notes are kept for review and are not sold.",
    },
    "/terms": {
      title: "Terms",
      text: "videogameshops is a directory of physical video game stores. A listing is informational. Check with the shop before you travel.",
    },
    "/directory/platforms": {
      title: "Video Game Stores by Platform",
      text: "Browse video game stores by platform: PlayStation, Xbox, Nintendo, PC, handheld, retro, and VR.",
    },
  };
  const page = pages[path];
  if (!page) return null;
  return doc(path, page.title, [page.text, "", `Canonical: ${absoluteUrl(path)}`], true);
}

async function countriesMarkdown(): Promise<MarkdownDoc> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return doc(countriesPath(), "Video Game Stores by Country", ["The store list could not be loaded."], false);
  const countries = countryLinks(catalog.stores);
  const lines = [
    "Browse video game stores by country. Each country links to its regions, cities, and shops.",
    "",
    `${catalog.stores.length.toLocaleString("en-US")} video game stores.`,
    "",
    "## Countries",
    "",
    ...countries.map((country) => `- ${link(country.href, country.name)}: ${country.count} shops`),
  ];
  return doc(countriesPath(), "Video Game Stores by Country", lines, countries.length > 0);
}

async function statesMarkdown(): Promise<MarkdownDoc> {
  const catalog = await loadCatalog();
  if (!catalog.ok) return doc("/directory/states", "Video Game Stores by State", ["The store list could not be loaded."], false);
  const states = US_STATES.map((state) => ({
    ...state,
    count: catalog.stores.filter((store) => store.countryCode === "US" && store.stateSlug === state.slug).length,
  })).filter((state) => state.count >= MIN_CITY_STORES);
  const total = catalog.stores.filter((store) => store.countryCode === "US").length;
  const lines = [
    `${total.toLocaleString("en-US")} video game stores in the United States.`,
    "",
    "## States",
    "",
    ...states.map((state) => `- ${link(statePath(state.slug), state.name)}: ${state.count} shops`),
  ];
  return doc("/directory/states", "Video Game Stores by State", lines, states.length > 0);
}

async function platformsMarkdown(): Promise<MarkdownDoc> {
  const catalog = await loadCatalog();
  const base = staticPage("/directory/platforms");
  if (!base) return doc("/directory/platforms", "Video Game Stores by Platform", [], false);
  if (!catalog.ok) return base;
  const lines = [
    base.body.replace(/^# .+\n+/, "").trim(),
    "",
    "## Platforms",
    "",
    ...PLATFORMS.map((platform) => {
      const count = catalog.stores.filter((store) => store.platforms.includes(platform.label)).length;
      return `- ${link(platformPath(platform.slug), platform.label)}: ${count} shops`;
    }),
  ];
  return doc("/directory/platforms", "Video Game Stores by Platform", lines, true);
}

function peelPage(parts: string[]): { parts: string[]; page: number } | null {
  if (parts.length >= 2 && parts.at(-2) === "page") {
    const raw = parts.at(-1) ?? "";
    if (!/^[1-9]\d*$/.test(raw)) return null;
    return { parts: parts.slice(0, -2), page: Number(raw) };
  }
  return { parts, page: 1 };
}

function searchRecord(search: URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of search.entries()) record[key] = value;
  return record;
}

/** Markdown for one public HTML path, built from the same catalog as the HTML page. */
export async function renderMarkdown(htmlPath: string, search: URLSearchParams = new URLSearchParams()): Promise<MarkdownDoc> {
  if (htmlPath === "/") return homeMarkdown();
  if (htmlPath === "/directory/countries") return countriesMarkdown();
  if (htmlPath === "/directory/states") return statesMarkdown();
  if (htmlPath === "/directory/platforms") return platformsMarkdown();
  const fixed = staticPage(htmlPath);
  if (fixed) return fixed;
  if (htmlPath.startsWith("/store/")) {
    const slug = htmlPath.slice("/store/".length);
    if (!slug || slug.includes("/")) return doc(htmlPath, "Page not found", ["That page is not in the directory."], false, 404);
    return storeMarkdown(slug);
  }

  if (!htmlPath.startsWith("/directory")) {
    return doc(htmlPath, "Page not found", ["That page is not in the directory."], false, 404);
  }

  const peeled = peelPage(htmlPath.split("/").filter(Boolean));
  if (!peeled) return doc(htmlPath, "Page not found", ["That page is not in the directory."], false, 404);
  const parts = peeled.parts.slice(1);
  const searchParams = searchRecord(search);

  if (parts[0] === "countries" && parts.length === 2 && parts[1]) {
    const loaded = await loadCountryPage(parts[1]);
    if (loaded.status === "redirect") {
      return doc(loaded.href, "Redirect", [`This country page lives at ${absoluteUrl(loaded.href)}.`], false);
    }
    if (loaded.status !== "ok") {
      return doc(htmlPath, loaded.status === "not-found" ? "Page not found" : "Directory unavailable", ["That page is not in the directory."], false, loaded.status === "not-found" ? 404 : 503);
    }
    const page = loaded.page;
    const lines = [
      `${page.total.toLocaleString("en-US")} video game ${page.total === 1 ? "store" : "stores"} in ${page.countryName}. Browse regions and cities with published shops.`,
      "",
      `Canonical: ${absoluteUrl(countryPath(page.countrySlug))}`,
      "",
    ];
    if (page.regions.length > 0) {
      lines.push("## Regions", "");
      for (const region of page.regions) lines.push(`- ${link(region.href, region.name)}: ${region.count} shops`);
    }
    return doc(countryPath(page.countrySlug), `${page.countryName} Video Game Stores`, lines, page.total > 0);
  }

  let input: Parameters<typeof buildListing>[0] | null = null;
  if (parts[0] === "platforms" && parts[1] && getPlatformBySlug(parts[1]) && parts.length === 2) {
    input = { page: peeled.page, platformSlug: parts[1], searchParams };
  } else if (parts[0] === "countries" && parts.length >= 3 && parts[1]) {
    input = {
      page: peeled.page,
      countrySlug: parts[1],
      stateSlug: parts[2],
      citySlug: parts[3],
      platformSlug: parts[4],
      searchParams,
    };
    if (parts.length > 5) input = null;
  } else if (parts[0] && getStateBySlug(parts[0])) {
    input = {
      page: peeled.page,
      stateSlug: parts[0],
      citySlug: parts[1],
      platformSlug: parts[2],
      searchParams,
    };
    if (parts.length > 3) input = null;
  } else if (parts.length === 0) {
    input = { page: peeled.page, searchParams };
  }

  if (!input) return doc(htmlPath, "Page not found", ["That page is not in the directory."], false, 404);
  const listing = await buildListing(input);
  if (listing.status === "not-found") return doc(htmlPath, "Page not found", ["That page is not in the directory."], false, 404);
  if (listing.status === "error") return doc(htmlPath, "Directory unavailable", ["The store list could not be loaded."], false, 503);
  return listingMarkdown(listing);
}

export function markdownHeaders(document: MarkdownDoc): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Vary", "Accept");
  headers.set("Content-Signal", CONTENT_SIGNAL);
  headers.set("X-Robots-Tag", `${document.index ? "index" : "noindex"}, follow`);
  headers.set(
    "Link",
    [
      `<${absoluteUrl(document.htmlPath)}>; rel="canonical"`,
      `</sitemap.xml>; rel="sitemap"`,
      `<${markdownPath(document.htmlPath)}>; rel="alternate"; type="text/markdown"`,
    ].join(", "),
  );
  return headers;
}

export async function buildLlmsTxt(): Promise<string> {
  const catalog = await loadCatalog();
  const lines = [
    "# videogameshops",
    "",
    "> Find physical video game stores by country, region, and city.",
    "",
    "videogameshops is a worldwide directory of physical video game stores. Pages list only the details on file for each shop.",
    "",
    "## Read first",
    "",
    `- [Video game stores near you](${absoluteUrl("/index.md")}): Find physical video game stores by country, region, and city.`,
    `- [About](${absoluteUrl("/about/index.md")}): What a listing includes and how to correct one.`,
    `- [Contact](${absoluteUrl("/contact/index.md")}): Send a correction for a listed store.`,
    `- [Submit a store](${absoluteUrl("/submit/index.md")}): Add a physical shop from any country.`,
    `- [Countries](${absoluteUrl("/directory/countries/index.md")}): Browse shops by country.`,
    `- [Platforms](${absoluteUrl("/directory/platforms/index.md")}): Browse shops by platform.`,
    `- [United States states](${absoluteUrl("/directory/states/index.md")}): Browse US shops by state.`,
    "",
  ];
  if (catalog.ok) {
    lines.push("## Places", "");
    for (const country of countryLinks(catalog.stores).slice(0, 8)) {
      lines.push(`- [${country.name} video game stores](${absoluteUrl(`${country.href}/index.md`)}): ${country.count} shops.`);
    }
    const states = US_STATES.map((state) => ({
      ...state,
      count: catalog.stores.filter((store) => store.countryCode === "US" && store.stateSlug === state.slug).length,
    }))
      .filter((state) => state.count >= MIN_CITY_STORES)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    for (const state of states) {
      lines.push(`- [${state.name} video game stores](${absoluteUrl(`${statePath(state.slug)}/index.md`)}): ${state.count} shops.`);
    }
    lines.push("");
  }
  lines.push(`Shop search API: ${SITE_URL}/api/shops`, `API catalog: ${SITE_URL}/.well-known/api-catalog`, "");
  return lines.join("\n");
}
