"use server";

import { after } from "next/server";
import { z } from "zod";

import { defineAction } from "@/server/core/action";
import { logger } from "@/server/core/logger";
import { serverEnv } from "@/server/env";
import { SECTION_KEYS, type ImageAsset } from "./schemas";
import { resetSection, saveSection } from "./server/service";

const sectionKey = z.enum(SECTION_KEYS as [string, ...string[]]).transform((k) => k as (typeof SECTION_KEYS)[number]);

export const saveSectionAction = defineAction({
  permissions: ["content.edit"],
  input: z.object({ key: sectionKey, data: z.unknown() }),
  handler: async ({ key, data }, { user }) => {
    const saved = await saveSection(key, data, user.id);
    if (key === "hero") after(() => warmImage((saved as { image: ImageAsset }).image.src));
  },
  refresh: true,
});

export const resetSectionAction = defineAction({
  permissions: ["content.edit"],
  input: z.object({ key: sectionKey }),
  handler: async ({ key }) => resetSection(key),
  refresh: true,
});

/**
 * Ask the image optimizer for the hero at common screen widths right after
 * it changes, so its resized copies are already cached when visitors arrive.
 * Best effort: failures only mean the first visitor waits a little.
 */
const HERO_WIDTHS = [640, 828, 1080, 1200, 1920, 2048];

async function warmImage(src: string) {
  await Promise.all(
    HERO_WIDTHS.map(async (w) => {
      const url = new URL("/_next/image", serverEnv.APP_URL);
      url.searchParams.set("url", src);
      url.searchParams.set("w", String(w));
      url.searchParams.set("q", "75");
      try {
        const res = await fetch(url, { headers: { Accept: "image/avif,image/webp,*/*" } });
        await res.arrayBuffer();
      } catch (error) {
        logger.debug("Hero warm-up failed", { w, message: (error as Error)?.message });
      }
    }),
  );
}
