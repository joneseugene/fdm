import "server-only";

import type { Role, UserStatus } from "@/config/access";
import { check, db, one, rows } from "@/server/db";

/** Persistence for native auth (users, sessions, reset links) in Supabase. */

export type AuthUserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Their duty in the church (Pastor, Secretary, …). */
  churchRole: string | null;
  role: Role;
  status: UserStatus;
  passwordHash: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

export type AuthUserPatch = Partial<{
  passwordHash: string;
  status: UserStatus;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date;
  passwordChangedAt: Date;
}>;

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  /** Set when the lookup matched the previous (just-rotated) token. */
  matchedPrevious: boolean;
  rotatedAt: Date | null;
  persistent: boolean;
};

const USER_COLUMNS =
  "id, email, first_name, last_name, church_role, role, status, password_hash, failed_login_attempts, locked_until";
const SESSION_COLUMNS = "id, user_id, token_hash, expires_at, revoked_at, rotated_at, persistent";

type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  church_role: string | null;
  role: Role;
  status: UserStatus;
  password_hash: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  rotated_at: string | null;
  persistent: boolean;
};

const date = (v: string | null) => (v ? new Date(v) : null);
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : d);

const toUser = (r: UserRow): AuthUserRecord => ({
  id: r.id,
  email: r.email,
  firstName: r.first_name,
  lastName: r.last_name,
  churchRole: r.church_role,
  role: r.role,
  status: r.status,
  passwordHash: r.password_hash,
  failedLoginAttempts: r.failed_login_attempts,
  lockedUntil: date(r.locked_until),
});

const toSession = (r: SessionRow, matchedHash: string): SessionRecord => ({
  id: r.id,
  userId: r.user_id,
  expiresAt: new Date(r.expires_at),
  revokedAt: date(r.revoked_at),
  rotatedAt: date(r.rotated_at),
  persistent: r.persistent,
  matchedPrevious: r.token_hash !== matchedHash,
});

export const authStore = {
  async findUserByEmail(email: string) {
    const row = check(
      await db()
        .from("users")
        .select(USER_COLUMNS)
        .ilike("email", email.replace(/[%_\\]/g, "\\$&"))
        .is("deleted_at", null)
        .maybeSingle<UserRow>(),
    );
    return row ? toUser(row) : null;
  },

  async findUserById(id: string) {
    const row = check(
      await db()
        .from("users")
        .select(USER_COLUMNS)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle<UserRow>(),
    );
    return row ? toUser(row) : null;
  },

  async updateUser(id: string, patch: AuthUserPatch) {
    const row: Record<string, unknown> = {};
    if (patch.passwordHash !== undefined) row.password_hash = patch.passwordHash;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.failedLoginAttempts !== undefined) row.failed_login_attempts = patch.failedLoginAttempts;
    if (patch.lockedUntil !== undefined) row.locked_until = iso(patch.lockedUntil);
    if (patch.lastLoginAt !== undefined) row.last_login_at = iso(patch.lastLoginAt);
    if (patch.passwordChangedAt !== undefined) row.password_changed_at = iso(patch.passwordChangedAt);
    check(await db().from("users").update(row).eq("id", id));
  },

  async createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    persistent: boolean;
    userAgent?: string | null;
    ip?: string | null;
  }) {
    return one(
      await db()
        .from("auth_sessions")
        .insert({
          user_id: input.userId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt.toISOString(),
          persistent: input.persistent,
          user_agent: input.userAgent ?? null,
          ip: input.ip ?? null,
        })
        .select("id")
        .single<{ id: string }>(),
    );
  },

  async getSession(id: string) {
    const row = check(
      await db().from("auth_sessions").select(SESSION_COLUMNS).eq("id", id).maybeSingle<SessionRow>(),
    );
    return row ? toSession(row, row.token_hash) : null;
  },

  /** Matches the current OR previous token hash (for rotation grace). */
  async findSessionByTokenHash(tokenHash: string) {
    // Hex-only hash, safe to interpolate into the filter.
    if (!/^[a-f0-9]+$/.test(tokenHash)) return null;
    const row = check(
      await db()
        .from("auth_sessions")
        .select(SESSION_COLUMNS)
        .or(`token_hash.eq.${tokenHash},previous_token_hash.eq.${tokenHash}`)
        .maybeSingle<SessionRow>(),
    );
    return row ? toSession(row, tokenHash) : null;
  },

  /** Atomic compare-and-swap; false if the token was already rotated. */
  async rotateSession(
    id: string,
    { currentHash, newHash, expiresAt }: { currentHash: string; newHash: string; expiresAt: Date },
  ) {
    const now = new Date().toISOString();
    const updated = rows(
      await db()
        .from("auth_sessions")
        .update({
          token_hash: newHash,
          previous_token_hash: currentHash,
          rotated_at: now,
          last_used_at: now,
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", id)
        .eq("token_hash", currentHash)
        .select("id"),
    );
    return updated.length > 0;
  },

  async revokeSession(id: string) {
    check(
      await db()
        .from("auth_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id)
        .is("revoked_at", null),
    );
  },

  async revokeUserSessions(userId: string, options?: { exceptSessionId?: string }) {
    let query = db()
      .from("auth_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("revoked_at", null);
    if (options?.exceptSessionId) query = query.neq("id", options.exceptSessionId);
    check(await query);
  },

  async createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    check(
      await db().from("password_reset_tokens").insert({
        user_id: input.userId,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt.toISOString(),
      }),
    );
  },

  /** Atomically marks the token used; returns its user id if it was valid. */
  async consumePasswordResetToken(tokenHash: string) {
    const now = new Date().toISOString();
    const consumed = rows(
      await db()
        .from("password_reset_tokens")
        .update({ used_at: now })
        .eq("token_hash", tokenHash)
        .is("used_at", null)
        .gt("expires_at", now)
        .select("user_id")
        .returns<Array<{ user_id: string }>>(),
    );
    return consumed[0]?.user_id ?? null;
  },
};
