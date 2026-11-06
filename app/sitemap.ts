import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/catalog";
import { buildSitemap } from "@/lib/sitemap-data";

// The store list inside loadCatalog refreshes about once a day.
// A failed read is not saved as an empty sitemap.

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await loadCatalog();
  if (!catalog.ok) {
    throw new Error(catalog.error);
  }
  return buildSitemap(catalog.stores);
}
