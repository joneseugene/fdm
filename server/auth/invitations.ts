import "server-only";

import { ROLE_LABELS } from "@/config/access";
import { routes } from "@/config/routes";
import { AppError } from "@/server/core/errors";
import { check, db, rows } from "@/server/db";
import { sendEmail } from "@/server/email";
import { inviteEmail } from "@/server/email/templates";
import { serverEnv } from "@/server/env";
import { signInAs } from "./native-auth";
import { hashPassword } from "./password";
import { authStore, type AuthUserRecord } from "./store";
import { generateOpaqueToken, hashToken } from "./tokens";

/**
 * Invitations: a Super Admin adds someone (name, access, duty). They get an
 * emailed one-time link to /join, where they choose a password; that
 * activates the account and signs them in.
 *
 * Links are stored hashed in `invite_codes.code_hash`. Opening the link only
 * reads it; it is used up when the password is set, so email scanners that
 * pre-open links can't burn it.
 */

const LINK_TTL_MS = 72 * 60 * 60 * 1000;

const linkHash = (token: string) => hashToken(`invite-link:${token}`);

/** Email a new link (any earlier link stops working). */
export async function sendInvitation(user: AuthUserRecord) {
  if (user.status !== "invited") throw AppError.conflict("This person has already set up their account");

  const now = new Date().toISOString();
  check(await db().from("invite_codes").update({ used_at: now }).eq("user_id", user.id).is("used_at", null));

  const token = generateOpaqueToken();
  check(
    await db().from("invite_codes").insert({
      user_id: user.id,
      code_hash: linkHash(token),
      expires_at: new Date(Date.now() + LINK_TTL_MS).toISOString(),
    }),
  );

  const url = new URL(routes.join, serverEnv.APP_URL);
  url.searchParams.set("token", token);
  try {
    await sendEmail({
      to: user.email,
      ...inviteEmail({
        firstName: user.firstName || "there",
        url: url.toString(),
        roleLabel: ROLE_LABELS[user.role],
        duty: user.churchRole,
        hoursValid: LINK_TTL_MS / 3_600_000,
      }),
    });
  } catch (error) {
    throw new AppError(
      "INTEGRATION",
      "The invitation email couldn't be sent. Check Email settings, then use “Resend invite link”.",
      { cause: error },
    );
  }
}

type LinkRow = { id: string; user_id: string };

async function findLink(token: string): Promise<LinkRow | null> {
  if (!token) return null;
  const [row] = rows(
    await db()
      .from("invite_codes")
      .select("id, user_id")
      .eq("code_hash", linkHash(token))
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .returns<LinkRow[]>(),
  );
  return row ?? null;
}

/** The invited person a link belongs to, or null if it's invalid, used or expired. */
export async function invitationFromToken(token: string): Promise<AuthUserRecord | null> {
  const link = await findLink(token);
  if (!link) return null;
  const user = await authStore.findUserById(link.user_id);
  return user?.status === "invited" ? user : null;
}

const INVALID_LINK = () =>
  AppError.validation("This link is invalid or has expired. Ask your Super Admin to send a new one.");

/** Set their password, activate the account and sign them in. */
export async function acceptInvitation(token: string, password: string) {
  const user = await invitationFromToken(token);
  if (!user) throw INVALID_LINK();

  // Use the link up first (atomically), so it can't be accepted twice.
  const now = new Date().toISOString();
  const consumed = rows(
    await db()
      .from("invite_codes")
      .update({ used_at: now })
      .eq("code_hash", linkHash(token))
      .is("used_at", null)
      .gt("expires_at", now)
      .select("id")
      .returns<Array<{ id: string }>>(),
  );
  if (!consumed.length) throw INVALID_LINK();

  const activated = rows(
    await db()
      .from("users")
      .update({
        password_hash: await hashPassword(password),
        password_changed_at: now,
        last_login_at: now,
        failed_login_attempts: 0,
        locked_until: null,
        status: "active",
      })
      .eq("id", user.id)
      .eq("status", "invited")
      .select("id")
      .returns<Array<{ id: string }>>(),
  );
  if (!activated.length) throw INVALID_LINK();

  await signInAs({ ...user, status: "active" }, true);
}
