import "server-only";

import { logger } from "@/server/core/logger";
import { check, db, rows } from "@/server/db";
import { sendEmail } from "@/server/email";
import { changesRequestedEmail, reviewRequestEmail } from "@/server/email/templates";
import { SECTION_META, SECTION_SCHEMAS, type DraftStatus, type SectionDraftInfo, type SectionKey } from "../schemas";
import { assertOwnImages } from "./service";

/**
 * Unpublished work on page sections (table section_drafts). The public site
 * never reads drafts; publishing copies a draft into site_sections.
 */

type DraftRow = {
  key: string;
  data: unknown;
  status: DraftStatus;
  updated_at: string;
  updated_by: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  review_note: string | null;
};

type Person = { id: string; email: string; first_name: string; last_name: string };

async function people(ids: (string | null)[]): Promise<Map<string, Person>> {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!wanted.length) return new Map();
  const found = rows(
    await db().from("users").select("id, email, first_name, last_name").in("id", wanted).returns<Person[]>(),
  );
  return new Map(found.map((p) => [p.id, p]));
}

const nameOf = (p: Person | undefined) => (p ? `${p.first_name} ${p.last_name}`.trim() || p.email : null);

/** The section's draft (data + who/when), or null if there is none. */
export async function getDraft(key: SectionKey): Promise<{ data: unknown; info: SectionDraftInfo } | null> {
  const row = check(
    await db()
      .from("section_drafts")
      .select("key, data, status, updated_at, updated_by, submitted_at, submitted_by, review_note")
      .eq("key", key)
      .maybeSingle<DraftRow>(),
  );
  if (!row) return null;
  const who = await people([row.updated_by, row.submitted_by]);
  return {
    data: row.data,
    info: {
      status: row.status,
      updatedAt: row.updated_at,
      updatedByName: nameOf(who.get(row.updated_by ?? "")),
      submittedAt: row.submitted_at,
      submittedByName: nameOf(who.get(row.submitted_by ?? "")),
      reviewNote: row.review_note,
    },
  };
}

/** Draft status of every section that has one (for lists and badges). */
export async function listDraftStatuses(): Promise<Partial<Record<SectionKey, DraftStatus>>> {
  const found = rows(await db().from("section_drafts").select("key, status").returns<Array<{ key: SectionKey; status: DraftStatus }>>());
  return Object.fromEntries(found.map((r) => [r.key, r.status]));
}

/** Validate and store a draft. `forReview` also sends it to the publishers. */
export async function saveDraft(key: SectionKey, raw: unknown, userId: string, forReview: boolean) {
  const parsed = SECTION_SCHEMAS[key].safeParse(raw);
  if (!parsed.success) throw parsed.error;
  assertOwnImages(parsed.data);

  const now = new Date().toISOString();
  check(
    await db()
      .from("section_drafts")
      .upsert(
        {
          key,
          data: parsed.data,
          status: forReview ? "in_review" : "draft",
          updated_by: userId,
          submitted_at: forReview ? now : null,
          submitted_by: forReview ? userId : null,
          review_note: null,
        },
        { onConflict: "key" },
      ),
  );

  if (forReview) await notifyReviewers(key, userId);
}

export async function deleteDraft(key: SectionKey) {
  check(await db().from("section_drafts").delete().eq("key", key));
}

/** A reviewer sends an in-review draft back with a note; the author is told by email. */
export async function returnDraft(key: SectionKey, note: string, reviewerId: string) {
  const [row] = rows(
    await db()
      .from("section_drafts")
      .update({ status: "draft", review_note: note, updated_by: reviewerId })
      .eq("key", key)
      .eq("status", "in_review")
      .select("submitted_by")
      .returns<Array<{ submitted_by: string | null }>>(),
  );
  if (row?.submitted_by && row.submitted_by !== reviewerId) {
    const who = await people([row.submitted_by, reviewerId]);
    const author = who.get(row.submitted_by);
    if (author) {
      await sendEmail({
        to: author.email,
        ...changesRequestedEmail({
          firstName: author.first_name || "there",
          section: SECTION_META[key].label,
          reviewer: nameOf(who.get(reviewerId)) ?? "A reviewer",
          note,
          key,
        }),
      }).catch((error) => logger.error("Changes-requested email failed", { message: (error as Error)?.message }));
    }
  }
}

/** Email every active Super Admin and Church Admin that something awaits review. Best effort. */
async function notifyReviewers(key: SectionKey, authorId: string) {
  try {
    const reviewers = rows(
      await db()
        .from("users")
        .select("id, email, first_name, last_name")
        .in("role", ["super_admin", "church_admin"])
        .eq("status", "active")
        .is("deleted_at", null)
        .neq("id", authorId)
        .returns<Person[]>(),
    );
    if (!reviewers.length) return;
    const author = nameOf((await people([authorId])).get(authorId)) ?? "A content manager";
    await sendEmail({
      to: reviewers.map((r) => r.email).join(", "),
      ...reviewRequestEmail({ section: SECTION_META[key].label, author, key }),
    });
  } catch (error) {
    logger.error("Review request email failed", { message: (error as Error)?.message });
  }
}
