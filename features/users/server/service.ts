import "server-only";

import type { CurrentUser, Role, UserStatus } from "@/config/access";
import { sendInvitation } from "@/server/auth/invitations";
import { normalizeEmail } from "@/server/auth/native-auth";
import { authStore } from "@/server/auth/store";
import { AppError } from "@/server/core/errors";
import { logger } from "@/server/core/logger";
import { check, db, one, rows } from "@/server/db";
import type { AdminUser } from "../schemas";

type Row = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  church_role: string | null;
  role: Role;
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
};

const COLUMNS = "id, email, first_name, last_name, other_name, church_role, role, status, last_login_at, created_at";

const toUser = (r: Row): AdminUser => ({
  id: r.id,
  email: r.email,
  firstName: r.first_name,
  lastName: r.last_name,
  otherName: r.other_name,
  churchRole: r.church_role,
  role: r.role,
  status: r.status,
  lastLoginAt: r.last_login_at,
  createdAt: r.created_at,
});

async function find(id: string) {
  const row = check(
    await db().from("users").select(COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle<Row>(),
  );
  if (!row) throw AppError.notFound("User not found");
  return toUser(row);
}

/** Never leave the site without a Super Admin. */
async function assertOtherSuperAdmin(exceptId: string) {
  const { count, error } = await db()
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("status", "active")
    .is("deleted_at", null)
    .neq("id", exceptId);
  if (error) throw AppError.internal("Could not check admins", error);
  if (!count) throw AppError.conflict("Keep at least one active Super Admin");
}

function assertNotSelf(actor: CurrentUser, id: string, what: string) {
  if (actor.id === id) throw AppError.forbidden(`You can't ${what} your own account`);
}

export const usersService = {
  async list(): Promise<AdminUser[]> {
    return rows(
      await db()
        .from("users")
        .select(COLUMNS)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .returns<Row[]>(),
    ).map(toUser);
  },

  /** Add someone; they get an emailed link to choose a password and activate their account. */
  async invite(input: {
    firstName: string;
    lastName: string;
    otherName: string;
    email: string;
    role: Role;
    churchRole: string;
  }) {
    const email = normalizeEmail(input.email);
    if (await authStore.findUserByEmail(email)) {
      throw AppError.validation("This email already has an account", { email: ["Already added"] });
    }
    const row = one(
      await db()
        .from("users")
        .insert({
          email,
          first_name: input.firstName,
          last_name: input.lastName,
          other_name: input.otherName || null,
          church_role: input.churchRole,
          role: input.role,
          status: "invited",
        })
        .select("id")
        .single<{ id: string }>(),
    );
    const record = await authStore.findUserById(row.id);
    // The person stays on the list even if the email fails; the link can be resent.
    let emailSent = false;
    if (record) {
      try {
        await sendInvitation(record);
        emailSent = true;
      } catch (error) {
        logger.error("Invitation email failed", { message: (error as Error)?.message });
      }
    }
    return { id: row.id, emailSent };
  },

  async resendInvite(id: string) {
    const record = await authStore.findUserById(id);
    if (!record) throw AppError.notFound("User not found");
    await sendInvitation(record);
  },

  async update(
    actor: CurrentUser,
    input: { id: string; firstName: string; lastName: string; otherName: string; churchRole: string; role: Role },
  ) {
    const user = await find(input.id);
    if (user.role === "super_admin" && input.role !== "super_admin") {
      assertNotSelf(actor, input.id, "remove Super Admin rights from");
      await assertOtherSuperAdmin(input.id);
    }
    check(
      await db()
        .from("users")
        .update({
          first_name: input.firstName,
          last_name: input.lastName,
          other_name: input.otherName || null,
          church_role: input.churchRole || null,
          role: input.role,
        })
        .eq("id", input.id),
    );
  },

  async setBlocked(actor: CurrentUser, id: string, blocked: boolean) {
    assertNotSelf(actor, id, "block");
    const user = await find(id);
    if (blocked && user.role === "super_admin") await assertOtherSuperAdmin(id);
    // Unblocking someone who never joined puts them back to "invited".
    const record = await authStore.findUserById(id);
    const status: UserStatus = blocked ? "blocked" : record?.passwordHash ? "active" : "invited";
    check(await db().from("users").update({ status }).eq("id", id));
    if (blocked) await authStore.revokeUserSessions(id);
  },

  async remove(actor: CurrentUser, id: string) {
    assertNotSelf(actor, id, "remove");
    const user = await find(id);
    if (user.role === "super_admin") await assertOtherSuperAdmin(id);
    check(await db().from("users").update({ deleted_at: new Date().toISOString() }).eq("id", id));
    await authStore.revokeUserSessions(id);
  },
};
