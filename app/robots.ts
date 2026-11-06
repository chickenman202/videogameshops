import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const privatePaths = ["/admin", "/admin/", "/account", "/account/", "/dashboard", "/dashboard/", "/api", "/api/"];

/** Public pages are allowed. Private tools and form handlers are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privatePaths,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
