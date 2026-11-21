import type { MetadataRoute } from "next";

import { getSiteContent } from "@/features/content/server/service";

/** Lets phones add the site to the home screen with the right name and icon. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { site } = await getSiteContent();
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.seoDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#FBF8F1",
    theme_color: "#E8B523",
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
