import "server-only";
import { randomInt } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

import { ROLE_LABELS } from "@/config/access";
import { routes } from "@/config/routes";
import { AppError } from "@/server/core/errors";
import { check, db, rows } from "@/server/db";
import { sendEmail } from "@/server/email";
import { inviteCodeEmail } from "@/server/email/templates";
import { requireEnv, serverEnv } from "@/server/env";
import { signInAs, normalizeEmail } from "./native-auth";
import { hashPassword } from "./password";
import { authStore, type AuthUserRecord } from "./store";
import { hashToken } from "./tokens";

/**
 * Invitations: a Super Admin adds someone by email; they get a 6-digit code,
 * confirm it on /join, then set their name, church role and password.
 */

const CODE_TTL_MS = 48 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Time to fill in the profile after confirming the code. */
const TICKET_TTL_S = 30 * 60;

const codeHash = (userId: string, code: string) => hashToken(`invite:${userId}:${code}`);

/** Email a new code (any earlier code stops working). */
export async function sendInviteCode(user: AuthUserRecord) {
  if (user.status !== "invited") throw AppError.conflict("This person has already joined");

  // Retire earlier codes, so only the newest email works.
  check(
    await db()
      .from("invite_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("used_at", null),
  );

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  check(
    await db().from("invite_codes").insert({
      user_id: user.id,
      code_hash: codeHash(user.id, code),
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    }),
  );

  const url = new URL(routes.join, serverEnv.APP_URL);
  url.searchParams.set("email", user.email);
  try {
    await sendEmail({
      to: user.email,
      ...inviteCodeEmail({
        code,
        email: user.email,
        url: url.toString(),
        roleLabel: ROLE_LABELS[user.role],
        hoursValid: CODE_TTL_MS / 3_600_000,
      }),
    });
  } catch (error) {
    throw new AppError(
      "INTEGRATION",
      "The invitation email couldn't be sent. Check Email settings, then use “Resend code”.",
      { cause: error },
    );
  }
}

const WRONG_CODE = () =>
  AppError.validation("That code isn't right. Check the email and try again.", { code: ["Incorrect code"] });

/** Check the code; returns a short-lived ticket for the profile step. */
export async function verifyInviteCode(email: string, code: string): Promise<string> {
  const user = await authStore.findUserByEmail(normalizeEmail(email));
  // Same answer for unknown emails and wrong codes.
  if (!user || user.status !== "invited") throw WRONG_CODE();

  type CodeRow = { id: string; code_hash: string; expires_at: string; attempts: number };
  const [latest] = rows(
    await db()
      .from("invite_codes")
      .select("id, code_hash, expires_at, attempts")
      .eq("user_id", user.id)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<CodeRow[]>(),
  );
  if (!latest) throw WRONG_CODE();
  if (new Date(latest.expires_at).getTime() <= Date.now()) {
    throw AppError.validation("This code has expired. Ask your Super Admin to resend it.", { code: ["Expired"] });
  }
  if (latest.attempts >= MAX_ATTEMPTS) {
    throw AppError.validation("Too many wrong tries. Ask your Super Admin to resend the code.", {
      code: ["Too many tries"],
    });
  }
  if (latest.code_hash !== codeHash(user.id, code)) {
    check(await db().from("invite_codes").update({ attempts: latest.attempts + 1 }).eq("id", latest.id));
    throw WRONG_CODE();
  }

  return new SignJWT({ purpose: "invite" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setAudience("invite")
    .setIssuedAt()
    .setExpirationTime(`${TICKET_TTL_S}s`)
    .sign(ticketKey());
}

const ticketKey = () => new TextEncoder().encode(requireEnv("AUTH_SECRET", "invitations"));

async function readTicket(ticket: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(ticket, ticketKey(), { algorithms: ["HS256"], audience: "invite" });
    if (payload.purpose !== "invite" || typeof payload.sub !== "string") throw new Error("bad ticket");
    return payload.sub;
  } catch {
    throw AppError.validation("This step has expired. Enter your code again.");
  }
}

/** Who a ticket belongs to (to show their email on the profile step). */
export async function invitedUserFromTicket(ticket: string) {
  const user = await authStore.findUserById(await readTicket(ticket));
  return user?.status === "invited" ? user : null;
}

/** Final step: save their profile and password, activate, and sign them in. */
export async function completeInvitation(
  ticket: string,
  input: { firstName: string; lastName: string; otherName: string; churchRole: string; password: string },
) {
  const user = await invitedUserFromTicket(ticket);
  if (!user) throw AppError.validation("This invitation is no longer valid. Ask your Super Admin for a new one.");

  const now = new Date().toISOString();
  check(
    await db()
      .from("users")
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        other_name: input.otherName || null,
        church_role: input.churchRole,
        password_hash: await hashPassword(input.password),
        password_changed_at: now,
        last_login_at: now,
        status: "active",
      })
      .eq("id", user.id)
      .eq("status", "invited"), // can't be completed twice
  );
  // The code is used up.
  check(await db().from("invite_codes").update({ used_at: now }).eq("user_id", user.id).is("used_at", null));

  await signInAs({ ...user, status: "active" }, true);
}
