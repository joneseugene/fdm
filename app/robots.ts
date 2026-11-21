import type { MetadataRoute } from "next";

import { serverEnv } from "@/server/env";

/** Crawlers may index the public site, never the admin or sign-in pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/sign-in", "/join", "/forgot-password", "/reset-password"],
    },
    sitemap: new URL("/sitemap.xml", serverEnv.APP_URL).toString(),
    host: serverEnv.APP_URL,
  };
}
