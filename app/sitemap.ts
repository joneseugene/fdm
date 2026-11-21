import type { MetadataRoute } from "next";

import { serverEnv } from "@/server/env";

/** The public site is a single page; its sections are anchors on it. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: new URL("/", serverEnv.APP_URL).toString(), changeFrequency: "weekly", priority: 1 }];
}
