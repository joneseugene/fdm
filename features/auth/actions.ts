"use server";

import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { acceptInvitation } from "@/server/auth/invitations";
import { auth } from "@/server/auth/native-auth";
import { defineAction } from "@/server/core/action";
import { enforceRateLimit } from "@/server/core/rate-limit";
import {
  acceptInviteSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./schemas";

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

// ---------- Accepting an invitation (/join?token=…) ----------

/** Set a password from the emailed link; activates the account and signs them in. */
export const acceptInvitationAction = defineAction({
  public: true,
  input: acceptInviteSchema,
  handler: async ({ token, password }) => {
    await enforceRateLimit("acceptInvite");
    await acceptInvitation(token, password);
    redirect(routes.admin);
  },
});
