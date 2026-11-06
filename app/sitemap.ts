import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/catalog";
import { buildSitemap, fallbackSitemap } from "@/lib/sitemap-data";

// The store list inside loadCatalog refreshes about once a day.
// A failed read returns the hub list so /sitemap.xml does not 500.

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const catalog = await loadCatalog();
    if (!catalog.ok) {
      console.error(catalog.error);
      return fallbackSitemap();
    }
    return buildSitemap(catalog.stores);
  } catch (error) {
    console.error(error);
    return fallbackSitemap();
  }
}
