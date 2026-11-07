import type { CatalogStore } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/jsonld";
import { isIndexableShop } from "@/lib/publish";
import { storePath } from "@/lib/paths";
import { SITE_URL } from "@/lib/site";

export type PublicShop = {
  name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  url: string;
};

export function toPublicShop(store: CatalogStore): PublicShop {
  return {
    name: store.displayName,
    city: store.city || null,
    region: store.state || null,
    country: store.countryName || null,
    url: absoluteUrl(storePath(store.slug)),
  };
}

export function searchPublicShops(
  stores: CatalogStore[],
  input: { q?: string; country?: string; limit?: number },
): PublicShop[] {
  const q = (input.q ?? "").trim().toLowerCase();
  const country = (input.country ?? "").trim().toLowerCase();
  const limit = Math.min(50, Math.max(1, input.limit ?? 20));
  return stores
    .filter((store) => isIndexableShop(store))
    .filter((store) => {
      if (!country) return true;
      return (
        store.countryCode.toLowerCase() === country ||
        store.countrySlug.toLowerCase() === country ||
        store.countryName.toLowerCase() === country
      );
    })
    .filter((store) => {
      if (!q) return true;
      return (
        store.name.toLowerCase().includes(q) ||
        store.city.toLowerCase().includes(q) ||
        store.state.toLowerCase().includes(q) ||
        store.countryName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .slice(0, limit)
    .map(toPublicShop);
}

export function shopsOpenApi(): Record<string, unknown> {
  return {
    openapi: "3.0.3",
    info: {
      title: "videogameshops public shop list",
      version: "1.0.0",
      description:
        "Read-only list of indexable physical video game stores. Each item has the name, place, and public page URL.",
    },
    servers: [{ url: SITE_URL }],
    paths: {
      "/api/shops": {
        get: {
          summary: "List indexable shops",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" }, description: "Match a name, city, region, or country." },
            { name: "country", in: "query", schema: { type: "string" }, description: "ISO code, slug, or English country name." },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
          ],
          responses: {
            "200": {
              description: "Matching public shops.",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
    },
  };
}
