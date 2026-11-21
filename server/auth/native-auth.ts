import "server-only";
import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { ROLE_PERMISSIONS, type CurrentUser } from "@/config/access";
import { AppError } from "@/server/core/errors";
import { logger } from "@/server/core/logger";
import { sendEmail } from "@/server/email";
import { resetPasswordEmail } from "@/server/email/templates";
import { serverEnv } from "@/server/env";
import {
  ACCESS_COOKIE,
  PERSISTENT_SESSION_SECONDS,
  REFRESH_COOKIE,
  clearSessionCookies,
  writeSessionCookies,
  type IssuedTokens,
} from "./cookies";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./password";
import { authStore as store, type AuthUserRecord } from "./store";
import { generateOpaqueToken, hashToken, signAccessToken, verifyAccessToken } from "./tokens";

/**
 * The site's own authentication (same design as TrustPin admin):
 * password login, 15-minute JWT access tokens, rotating opaque refresh tokens
 * (hashed at rest, reuse detection), lockout after repeated failures,
 * password reset/change and invitations.
 */

const TRANSIENT_SESSION_MS = 12 * 60 * 60 * 1000;
const PERSISTENT_SESSION_MS = PERSISTENT_SESSION_SECONDS * 1000;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
/** Parallel requests may present a just-rotated refresh token; tolerate briefly. */
const ROTATION_GRACE_MS = 30 * 1000;

const INVALID_CREDENTIALS = () => new AppError("UNAUTHENTICATED", "Invalid email or password");
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

function toCurrentUser(user: AuthUserRecord): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    permissions: ROLE_PERMISSIONS[user.role] ?? [],
  };
}

/** Start a session for `user` and set the session cookies. */
export async function signInAs(user: AuthUserRecord, persistent: boolean) {
  writeSessionCookies(await cookies(), await issueSession(user, persistent));
}

async function issueSession(user: AuthUserRecord, persistent: boolean): Promise<IssuedTokens> {
  const h = await headers();
  const refreshToken = generateOpaqueToken();
  const session = await store.createSession({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    persistent,
    expiresAt: new Date(Date.now() + (persistent ? PERSISTENT_SESSION_MS : TRANSIENT_SESSION_MS)),
    userAgent: h.get("user-agent"),
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });
  const accessToken = await signAccessToken({ userId: user.id, sessionId: session.id });
  return { accessToken, refreshToken, persistent };
}

/** Exchange a refresh token for new tokens. Null means "sign in again". */
async function refresh(refreshToken: string): Promise<IssuedTokens | null> {
  const currentHash = hashToken(refreshToken);
  const session = await store.findSessionByTokenHash(currentHash);
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return null;

  const user = await store.findUserById(session.userId);
  if (!user || user.status !== "active") {
    await store.revokeSession(session.id);
    return null;
  }

  if (session.matchedPrevious) {
    const sinceRotation = Date.now() - (session.rotatedAt?.getTime() ?? 0);
    if (sinceRotation > ROTATION_GRACE_MS) {
      // An old refresh token came back long after rotation: likely stolen.
      logger.warn("Refresh token reuse detected; revoking session", { sessionId: session.id });
      await store.revokeSession(session.id);
      return null;
    }
    const accessToken = await signAccessToken({ userId: user.id, sessionId: session.id });
    return { accessToken, persistent: session.persistent };
  }

  const newRefresh = generateOpaqueToken();
  const rotated = await store.rotateSession(session.id, {
    currentHash,
    newHash: hashToken(newRefresh),
    // Persistent sessions slide; browser sessions keep their absolute expiry.
    expiresAt: session.persistent ? new Date(Date.now() + PERSISTENT_SESSION_MS) : session.expiresAt,
  });
  const accessToken = await signAccessToken({ userId: user.id, sessionId: session.id });
  return rotated
    ? { accessToken, refreshToken: newRefresh, persistent: session.persistent }
    : { accessToken, persistent: session.persistent };
}

/** Email a single-use link to /reset-password. */
async function sendResetEmail(user: AuthUserRecord) {
  const token = generateOpaqueToken();
  await store.createPasswordResetToken({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });
  const link = new URL("/reset-password", serverEnv.APP_URL);
  link.searchParams.set("token", token);
  const email = resetPasswordEmail({
    firstName: user.firstName || "there",
    url: link.toString(),
    minutesValid: RESET_TOKEN_TTL_MS / 60_000,
  });

  try {
    await sendEmail({ to: user.email, ...email });
  } catch (error) {
    throw new AppError(
      "INTEGRATION",
      "The email couldn't be sent right now. Check the email settings or try again shortly.",
      { cause: error },
    );
  }
}

async function currentClaims() {
  return verifyAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);
}

export const auth = {
  async signIn({ email, password, remember }: { email: string; password: string; remember: boolean }) {
    const user = await store.findUserByEmail(normalizeEmail(email));

    if (!user || !user.passwordHash || user.status !== "active") {
      await burnPasswordCheck(password);
      throw INVALID_CREDENTIALS();
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new AppError(
        "RATE_LIMITED",
        `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      );
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const attempts = user.failedLoginAttempts + 1;
      const locked = attempts >= MAX_FAILED_LOGINS;
      await store.updateUser(user.id, {
        failedLoginAttempts: locked ? 0 : attempts,
        lockedUntil: locked ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil,
      });
      if (locked) logger.warn("Account locked after failed logins", { userId: user.id });
      throw INVALID_CREDENTIALS();
    }

    await store.updateUser(user.id, { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });
    await signInAs(user, remember);
  },

  async signOut() {
    const jar = await cookies();
    const refreshToken = jar.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      const session = await store.findSessionByTokenHash(hashToken(refreshToken)).catch(() => null);
      if (session) await store.revokeSession(session.id).catch(() => undefined);
    }
    clearSessionCookies(jar);
  },

  async getCurrentUser(): Promise<CurrentUser | null> {
    const claims = await currentClaims();
    if (!claims) return null;

    const [session, user] = await Promise.all([
      store.getSession(claims.sessionId),
      store.findUserById(claims.userId),
    ]);

    // Revocation and blocking take effect immediately, not at token expiry.
    if (!session || session.revokedAt || session.userId !== claims.userId) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;
    if (!user || user.status !== "active") return null;

    return toCurrentUser(user);
  },

  async requestPasswordReset(email: string) {
    const user = await store.findUserByEmail(normalizeEmail(email));
    if (!user || user.status === "blocked") return; // same response either way
    // Failures are logged, not reported: an error would reveal the account exists.
    // Someone who never accepted their invitation gets a fresh invitation link instead.
    const send =
      user.status === "invited"
        ? import("./invitations").then(({ sendInvitation }) => sendInvitation(user))
        : sendResetEmail(user);
    await send.catch((error) => logger.error("Reset email failed", { message: (error as Error)?.message }));
  },

  async resetPassword(token: string, newPassword: string) {
    const userId = await store.consumePasswordResetToken(hashToken(token));
    const user = userId ? await store.findUserById(userId) : null;
    if (!user || user.status !== "active") {
      throw AppError.validation("This link is invalid or has expired. Request a new one.");
    }

    await store.updateUser(user.id, {
      passwordHash: await hashPassword(newPassword),
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    await store.revokeUserSessions(user.id);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const claims = await currentClaims();
    const user = claims ? await store.findUserById(claims.userId) : null;
    if (!claims || !user || !user.passwordHash) throw AppError.unauthenticated();

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw AppError.validation("Current password is incorrect", {
        currentPassword: ["Current password is incorrect"],
      });
    }

    await store.updateUser(user.id, {
      passwordHash: await hashPassword(newPassword),
      passwordChangedAt: new Date(),
    });
    // Sign out everywhere else.
    await store.revokeUserSessions(user.id, { exceptSessionId: claims.sessionId });
  },
};

/**
 * Called from proxy.ts: refreshes an expired access token using the refresh
 * cookie, so server components see a valid session.
 */
export async function proxySession(request: NextRequest) {
  if (await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value)) {
    return { response: NextResponse.next({ request }), hasSession: true };
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const tokens = refreshToken ? await refresh(refreshToken).catch(() => null) : null;

  if (!tokens) {
    const response = NextResponse.next({ request });
    if (refreshToken || request.cookies.has(ACCESS_COOKIE)) clearSessionCookies(response.cookies);
    return { response, hasSession: false };
  }

  // Make the fresh tokens visible to this request's server code…
  request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  if (tokens.refreshToken) request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
  const response = NextResponse.next({ request });
  // …and persist them in the browser.
  writeSessionCookies(response.cookies, tokens);
  return { response, hasSession: true };
}
