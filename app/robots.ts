import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const disallow = ["/admin", "/admin/", "/account", "/account/", "/dashboard", "/dashboard/", "/api", "/api/"];

const agents = [
  "*",
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: agents.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow,
    })),
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
