import "server-only";
import { z } from "zod";

import { AppError } from "@/server/core/errors";
import { check, db } from "@/server/db";
import { hasDatabase, serverEnv } from "@/server/env";

/**
 * Who gets an email when someone sends the contact form. Admins manage the
 * list on the Messages page; until it's first saved, CONTACT_NOTIFY_EMAIL
 * (comma-separated) is the starting list.
 */
const KEY = "contact_alerts";
const MAX_RECIPIENTS = 20;

const storedSchema = z.object({ emails: z.array(z.string()) });

const fromEnv = () =>
  (serverEnv.CONTACT_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function getAlertRecipients(): Promise<string[]> {
  if (!hasDatabase()) return fromEnv();
  const row = check(
    await db().from("app_settings").select("value").eq("key", KEY).maybeSingle<{ value: unknown }>(),
  );
  if (!row) return fromEnv();
  const parsed = storedSchema.safeParse(row.value);
  return parsed.success ? parsed.data.emails : fromEnv();
}

async function save(emails: string[], userId: string) {
  check(
    await db()
      .from("app_settings")
      .upsert({ key: KEY, value: { emails }, updated_by: userId }, { onConflict: "key" }),
  );
}

export async function addAlertRecipient(email: string, userId: string) {
  const current = await getAlertRecipients();
  if (current.includes(email)) {
    throw AppError.validation("That address already gets alerts", { email: ["Already on the list"] });
  }
  if (current.length >= MAX_RECIPIENTS) {
    throw AppError.validation(`Up to ${MAX_RECIPIENTS} addresses can get alerts`);
  }
  await save([...current, email], userId);
}

export async function removeAlertRecipient(email: string, userId: string) {
  const current = await getAlertRecipients();
  await save(
    current.filter((e) => e !== email),
    userId,
  );
}
