import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One slash style: /directory is the real address. /directory/ redirects once.
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
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
