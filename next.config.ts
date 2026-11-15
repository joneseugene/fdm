import type { NextConfig } from "next";

/** Uploaded images are served from this project's Supabase storage bucket. */
const supabaseHost = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // The landing page is prerendered from cached content ("use cache") and
  // re-generated only when an admin saves, so visitors always get static HTML.
  cacheComponents: true,

  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" }]
      : [],
    // Uploaded files get new, random names on every upload and never change,
    // so optimized copies can be cached for a year.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },

  experimental: {
    serverActions: {
      // Image uploads (max 12 MB; checked again on the server).
      bodySizeLimit: "13mb",
    },
    // /admin goes through proxy.ts, which buffers request bodies.
    proxyClientMaxBodySize: "13mb",
  },

  logging: {
    // Dev logs would print server action arguments, including passwords.
    serverFunctions: false,
  },
};

export default nextConfig;
