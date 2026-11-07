import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One slash style: /directory is the real address. /directory/ redirects once.
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  // Prerendered pages are served from the CDN with the router Vary list only.
  // The proxy also serves markdown for Accept: text/markdown, so caches must key on Accept too.
  // The router tokens are repeated so they stay in Vary whether this header replaces or appends.
  async headers() {
    const htmlPages = [
      "/",
      "/about",
      "/contact",
      "/privacy",
      "/submit",
      "/terms",
      "/directory/countries",
      "/directory/platforms",
      "/directory/states",
    ];
    return htmlPages.map((source) => ({
      source,
      headers: [
        // Next sends no-store on a dynamic page; this lets the Vercel CDN still cache it, keyed by Vary.
        { key: "Vercel-CDN-Cache-Control", value: "s-maxage=3600, stale-while-revalidate=86400" },
        {
          key: "Vary",
          value: "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept",
        },
      ],
    }));
  },
  // The shop list is read from disk when Supabase is not configured.
  outputFileTracingIncludes: {
    "/*": ["./data/stores.json"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
