import "server-only";
import { cacheLife, cacheTag, updateTag } from "next/cache";

import { AppError } from "@/server/core/errors";
import { logger } from "@/server/core/logger";
import { check, db, rows } from "@/server/db";
import { hasDatabase, serverEnv } from "@/server/env";
import { DEFAULT_CONTENT } from "../defaults";
import {
  SECTION_KEYS,
  SECTION_SCHEMAS,
  type ImageAsset,
  type SectionData,
  type SectionKey,
  type SiteContent,
} from "../schemas";

/** Cache tag for everything the public page shows. Saving any section expires it. */
export const SITE_CONTENT_TAG = "site-content";

type SectionRow = { key: string; data: unknown; updated_at: string };

/** Parse a stored section; anything invalid falls back to the default. */
function parseSection<K extends SectionKey>(key: K, data: unknown): SectionData<K> {
  const parsed = SECTION_SCHEMAS[key].safeParse(data);
  if (parsed.success) return parsed.data as SectionData<K>;
  logger.warn("Stored section is invalid; using defaults", { key, issues: parsed.error.issues.length });
  return DEFAULT_CONTENT[key];
}

/**
 * All landing-page content, cached until an admin saves (then `updateTag`
 * expires it). The page is prerendered with this, so visitors get static
 * HTML straight from the cache: no database call per visit.
 */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(SITE_CONTENT_TAG);

  if (!hasDatabase()) {
    cacheLife("max");
    return DEFAULT_CONTENT;
  }

  try {
    const stored = rows(await db().from("site_sections").select("key, data").returns<SectionRow[]>());
    const byKey = new Map(stored.map((r) => [r.key, r.data]));
    const content = { ...DEFAULT_CONTENT };
    for (const key of SECTION_KEYS) {
      if (byKey.has(key)) (content as Record<SectionKey, unknown>)[key] = parseSection(key, byKey.get(key));
    }
    cacheLife("max");
    return content;
  } catch (error) {
    // Show the defaults for now, but try the database again soon.
    logger.error("Could not load site content; showing defaults", { message: (error as Error)?.message });
    cacheLife("minutes");
    return DEFAULT_CONTENT;
  }
}

/** One section for the admin editor (fresh, not cached), plus when it was last saved. */
export async function getSectionForEdit<K extends SectionKey>(
  key: K,
): Promise<{ data: SectionData<K>; updatedAt: string | null }> {
  const row = check(
    await db()
      .from("site_sections")
      .select("key, data, updated_at")
      .eq("key", key)
      .maybeSingle<SectionRow>(),
  );
  return row
    ? { data: parseSection(key, row.data), updatedAt: row.updated_at }
    : { data: DEFAULT_CONTENT[key], updatedAt: null };
}

/** When each section was last saved (for the admin overview). */
export async function listSectionUpdates(): Promise<Partial<Record<SectionKey, string>>> {
  const stored = rows(await db().from("site_sections").select("key, updated_at").returns<SectionRow[]>());
  return Object.fromEntries(stored.map((r) => [r.key, r.updated_at]));
}

// ---------- Saving ----------

const STORAGE_PREFIX = () =>
  serverEnv.SUPABASE_URL ? `${serverEnv.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/media/` : null;

/** Every image in a section value (they can be nested in lists). */
function collectImages(value: unknown, out: ImageAsset[] = []): ImageAsset[] {
  if (Array.isArray(value)) value.forEach((v) => collectImages(v, out));
  else if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.src === "string" && typeof v.width === "number") out.push(v as ImageAsset);
    else Object.values(v).forEach((child) => collectImages(child, out));
  }
  return out;
}

/** Images must be our own: a bundled /public file or one uploaded to our bucket. */
export function assertOwnImages(data: unknown) {
  const prefix = STORAGE_PREFIX();
  for (const image of collectImages(data)) {
    const local = image.src.startsWith("/") && !image.src.startsWith("//");
    const uploaded = prefix !== null && image.src.startsWith(prefix);
    if (!local && !uploaded) throw AppError.validation("One of the images isn't from this site. Upload it again.");
  }
}

export async function saveSection(key: SectionKey, raw: unknown, userId: string) {
  const parsed = SECTION_SCHEMAS[key].safeParse(raw);
  if (!parsed.success) throw parsed.error;
  assertOwnImages(parsed.data);

  check(
    await db()
      .from("site_sections")
      .upsert({ key, data: parsed.data, updated_by: userId }, { onConflict: "key" }),
  );

  // The next visitor gets the new content (and the admin sees it immediately).
  updateTag(SITE_CONTENT_TAG);
  return parsed.data;
}

/** Put a section back to its original content (and drop any draft). */
export async function resetSection(key: SectionKey) {
  check(await db().from("site_sections").delete().eq("key", key));
  check(await db().from("section_drafts").delete().eq("key", key));
  updateTag(SITE_CONTENT_TAG);
}
