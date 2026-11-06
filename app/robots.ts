import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const privatePaths = ["/admin", "/admin/", "/account", "/account/", "/dashboard", "/dashboard/", "/api", "/api/"];

/**
 * Search and answer bots may read public pages.
 * Training-bot rules are unchanged: they follow the * rule.
 * Private tools stay blocked for every agent.
 */
const searchBots = ["Googlebot", "Bingbot", "OAI-SearchBot", "PerplexityBot", "Claude-SearchBot", "Applebot"];

export default function robots(): MetadataRoute.Robots {
  const publicRule = {
    allow: "/",
    disallow: privatePaths,
  };
  return {
    rules: [
      { userAgent: "*", ...publicRule },
      ...searchBots.map((userAgent) => ({ userAgent, ...publicRule })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
