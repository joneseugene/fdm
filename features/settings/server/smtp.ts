import "server-only";
import { z } from "zod";

import { decryptSecret, encryptSecret } from "@/server/core/crypto";
import { AppError } from "@/server/core/errors";
import { check, db } from "@/server/db";
import { hasDatabase } from "@/server/env";
import type { SmtpSettingsView } from "../schemas";

const KEY = "smtp";

/** Stored shape (the password is encrypted). */
const storedSchema = z.object({
  enabled: z.boolean(),
  host: z.string(),
  port: z.number(),
  user: z.string(),
  passwordEnc: z.string().nullable(),
  fromName: z.string(),
  fromEmail: z.string(),
});
type Stored = z.infer<typeof storedSchema>;

async function readStored(): Promise<{ value: Stored; updatedAt: string } | null> {
  const row = check(
    await db()
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", KEY)
      .maybeSingle<{ value: unknown; updated_at: string }>(),
  );
  if (!row) return null;
  const parsed = storedSchema.safeParse(row.value);
  return parsed.success ? { value: parsed.data, updatedAt: row.updated_at } : null;
}

export async function getSmtpView(): Promise<SmtpSettingsView> {
  const stored = await readStored();
  const v = stored?.value;
  return {
    enabled: v?.enabled ?? false,
    host: v?.host ?? "smtp.gmail.com",
    port: v?.port ?? 465,
    user: v?.user ?? "",
    hasPassword: Boolean(v?.passwordEnc),
    fromName: v?.fromName ?? "Faith and Deliverance Ministries Global",
    fromEmail: v?.fromEmail ?? "",
    updatedAt: stored?.updatedAt ?? null,
  };
}

export async function saveSmtpSettings(
  input: { enabled: boolean; host: string; port: number; user: string; password: string; fromName: string; fromEmail: string },
  userId: string,
) {
  const current = await readStored();
  const passwordEnc = input.password ? encryptSecret(input.password) : (current?.value.passwordEnc ?? null);
  if (input.enabled && !passwordEnc) {
    throw AppError.validation("Enter the SMTP password", { password: ["Required"] });
  }
  const value: Stored = {
    enabled: input.enabled,
    host: input.host,
    port: input.port,
    user: input.user,
    passwordEnc,
    fromName: input.fromName,
    fromEmail: input.fromEmail,
  };
  check(await db().from("app_settings").upsert({ key: KEY, value, updated_by: userId }, { onConflict: "key" }));
}

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  /** Changes whenever the settings are saved (to rebuild the connection). */
  version: string;
};

/** The SMTP account set up in the admin, if it's switched on. */
export async function getActiveSmtpConfig(): Promise<SmtpConfig | null> {
  if (!hasDatabase()) return null;
  const stored = await readStored();
  const v = stored?.value;
  if (!stored || !v?.enabled || !v.passwordEnc || !v.host || !v.user) return null;
  const address = v.fromEmail || v.user;
  return {
    host: v.host,
    port: v.port,
    user: v.user,
    pass: decryptSecret(v.passwordEnc),
    from: v.fromName ? `"${v.fromName.replace(/"/g, "")}" <${address}>` : address,
    version: stored.updatedAt,
  };
}
