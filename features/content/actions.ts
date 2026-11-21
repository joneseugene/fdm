"use server";

import { after } from "next/server";
import { z } from "zod";

import { assertPublish, assertSection } from "@/server/auth/session";
import { defineAction } from "@/server/core/action";
import { logger } from "@/server/core/logger";
import { serverEnv } from "@/server/env";
import { reviewNoteSchema, SECTION_KEYS, type ImageAsset } from "./schemas";
import { deleteDraft, returnDraft, saveDraft } from "./server/drafts";
import { resetSection, saveSection } from "./server/service";

/**
 * Editing a section:
 *   save draft       anyone with access — nothing changes on the website
 *   send for review  anyone with access — publishers are emailed
 *   publish          Super/Church Admins, and Content Managers allowed to publish
 *   send back        publishers, on a draft that's in review
 */

const sectionKey = z.enum(SECTION_KEYS as [string, ...string[]]).transform((k) => k as (typeof SECTION_KEYS)[number]);
const sectionInput = z.object({ key: sectionKey, data: z.unknown() });

export const saveDraftAction = defineAction({
  permissions: ["content.edit"],
  input: sectionInput,
  handler: async ({ key, data }) => {
    const user = await assertSection(key);
    await saveDraft(key, data, user.id, false);
  },
  refresh: true,
});

export const submitForReviewAction = defineAction({
  permissions: ["content.edit"],
  input: sectionInput,
  handler: async ({ key, data }) => {
    const user = await assertSection(key);
    await saveDraft(key, data, user.id, true);
  },
  refresh: true,
});

export const publishSectionAction = defineAction({
  permissions: ["content.edit"],
  input: sectionInput,
  handler: async ({ key, data }) => {
    const user = await assertPublish(key);
    const saved = await saveSection(key, data, user.id);
    await deleteDraft(key);
    if (key === "hero") after(() => warmImage((saved as { image: ImageAsset }).image.src));
  },
  refresh: true,
});

export const discardDraftAction = defineAction({
  permissions: ["content.edit"],
  input: z.object({ key: sectionKey }),
  handler: async ({ key }) => {
    await assertSection(key);
    await deleteDraft(key);
  },
  refresh: true,
});

export const returnDraftAction = defineAction({
  permissions: ["content.edit"],
  input: z.object({ key: sectionKey, note: reviewNoteSchema }),
  handler: async ({ key, note }) => {
    const user = await assertPublish(key);
    await returnDraft(key, note, user.id);
  },
  refresh: true,
});

/** Back to the website's original content. Goes live, so publishers only. */
export const resetSectionAction = defineAction({
  permissions: ["content.edit"],
  input: z.object({ key: sectionKey }),
  handler: async ({ key }) => {
    await assertPublish(key);
    await resetSection(key);
  },
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
