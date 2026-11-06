import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One slash style: /directory is the real address. /directory/ redirects once.
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
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
