"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { completeInvitation, verifyInviteCode } from "@/server/auth/invitations";
import { auth } from "@/server/auth/native-auth";
import { defineAction } from "@/server/core/action";
import { AppError } from "@/server/core/errors";
import { enforceRateLimit } from "@/server/core/rate-limit";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  inviteCodeSchema,
  joinProfileSchema,
  loginSchema,
  resetPasswordSchema,
} from "./schemas";

/** Holds the "code confirmed" ticket between the two join steps. */
const JOIN_COOKIE = "fdm_join";

/** Only allow admin paths as redirect targets (blocks open redirects). */
function safeNext(next: string | undefined) {
  return next && next.startsWith(`${routes.admin}`) && !next.startsWith("//") ? next : routes.admin;
}

export const signInAction = defineAction({
  public: true,
  input: loginSchema,
  handler: async ({ email, password, remember, next }) => {
    await enforceRateLimit("signIn");
    await auth.signIn({ email, password, remember });
    redirect(safeNext(next));
  },
});

export const signOutAction = defineAction({
  public: true,
  handler: async () => {
    await auth.signOut();
    redirect(routes.login);
  },
});

/** Same response whether or not the account exists (no user enumeration). */
export const requestPasswordResetAction = defineAction({
  public: true,
  input: forgotPasswordSchema,
  handler: async ({ email }) => {
    await enforceRateLimit("passwordReset");
    await auth.requestPasswordReset(email);
  },
});

export const resetPasswordAction = defineAction({
  public: true,
  input: resetPasswordSchema,
  handler: ({ token, password }) => auth.resetPassword(token, password),
});

export const changePasswordAction = defineAction({
  input: changePasswordSchema,
  handler: ({ currentPassword, newPassword }) => auth.changePassword(currentPassword, newPassword),
});

// ---------- Accepting an invitation (/join) ----------

/** Step 1: the emailed code confirms the address. */
export const verifyInviteCodeAction = defineAction({
  public: true,
  input: inviteCodeSchema,
  handler: async ({ email, code }) => {
    await enforceRateLimit("inviteCode");
    const ticket = await verifyInviteCode(email, code);
    (await cookies()).set(JOIN_COOKIE, ticket, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: routes.join,
      maxAge: 30 * 60,
    });
  },
});

/** Step 2: name, church role and password; then they're signed in. */
export const completeJoinAction = defineAction({
  public: true,
  input: joinProfileSchema,
  handler: async ({ firstName, lastName, otherName, churchRole, password }) => {
    const jar = await cookies();
    const ticket = jar.get(JOIN_COOKIE)?.value;
    if (!ticket) throw AppError.validation("This step has expired. Enter your code again.");
    await completeInvitation(ticket, { firstName, lastName, otherName, churchRole, password });
    jar.delete({ name: JOIN_COOKIE, path: routes.join });
    redirect(routes.admin);
  },
});
