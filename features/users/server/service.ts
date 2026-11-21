import "server-only";

import { canManageRole, MANAGEABLE_ROLES, ROLE_LABELS, type CurrentUser, type Role, type UserStatus } from "@/config/access";
import { sendInvitation } from "@/server/auth/invitations";
import { normalizeEmail } from "@/server/auth/native-auth";
import { authStore } from "@/server/auth/store";
import { AppError } from "@/server/core/errors";
import { logger } from "@/server/core/logger";
import { check, db, one, rows } from "@/server/db";
import { storedCanPublish, storedSections, type AdminUser } from "../schemas";

type Row = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  church_role: string | null;
  role: Role;
  content_sections: string[] | null;
  can_publish: boolean;
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
};

const COLUMNS =
  "id, email, first_name, last_name, other_name, church_role, role, content_sections, can_publish, status, last_login_at, created_at";

const toUser = (r: Row): AdminUser => ({
  id: r.id,
  email: r.email,
  firstName: r.first_name,
  lastName: r.last_name,
  otherName: r.other_name,
  churchRole: r.church_role,
  role: r.role,
  contentSections: r.role === "content_manager" ? r.content_sections : null,
  canPublish: r.role !== "content_manager" || r.can_publish,
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

/** Church Admins may only manage Content Managers; Super Admins manage everyone. */
function assertCanManage(actor: CurrentUser, role: Role) {
  if (!canManageRole(actor, role)) {
    throw AppError.forbidden(`You can't manage ${ROLE_LABELS[role]} accounts`);
  }
}

type ProfileInput = {
  firstName: string;
  lastName: string;
  otherName: string;
  churchRole: string;
  role: Role;
  contentAccess: "all" | "some";
  contentSections: string[];
  canPublish: boolean;
};

export const usersService = {
  /** The accounts `actor` manages — never themselves (their own account is under Change password). */
  async list(actor: CurrentUser): Promise<AdminUser[]> {
    const roles = MANAGEABLE_ROLES[actor.role];
    if (!roles.length) return [];
    return rows(
      await db()
        .from("users")
        .select(COLUMNS)
        .is("deleted_at", null)
        .in("role", [...roles])
        .neq("id", actor.id)
        .order("created_at", { ascending: false })
        .returns<Row[]>(),
    ).map(toUser);
  },

  /** Add someone; they get an emailed link to choose a password and activate their account. */
  async invite(actor: CurrentUser, input: ProfileInput & { email: string }) {
    assertCanManage(actor, input.role);
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
          content_sections: storedSections(input),
          can_publish: storedCanPublish(input),
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

  async resendInvite(actor: CurrentUser, id: string) {
    const user = await find(id);
    assertCanManage(actor, user.role);
    const record = await authStore.findUserById(id);
    if (!record) throw AppError.notFound("User not found");
    await sendInvitation(record);
  },

  async update(actor: CurrentUser, input: ProfileInput & { id: string }) {
    const user = await find(input.id);
    assertCanManage(actor, user.role); // who they are now…
    assertCanManage(actor, input.role); // …and what they'd become
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
          content_sections: storedSections(input),
          can_publish: storedCanPublish(input),
        })
        .eq("id", input.id),
    );
  },

  async setBlocked(actor: CurrentUser, id: string, blocked: boolean) {
    assertNotSelf(actor, id, "block");
    const user = await find(id);
    assertCanManage(actor, user.role);
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
    assertCanManage(actor, user.role);
    if (user.role === "super_admin") await assertOtherSuperAdmin(id);
    check(await db().from("users").update({ deleted_at: new Date().toISOString() }).eq("id", id));
    await authStore.revokeUserSessions(id);
  },
};
