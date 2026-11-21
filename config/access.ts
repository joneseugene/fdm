/**
 * Roles and what they may do. Client-safe (used by the sidebar too).
 * Add a permission here, then check it with `assertPermission` /
 * `requirePermission` on the server.
 */
export const PERMISSIONS = ["content.edit", "messages.view", "users.manage", "settings.manage"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["super_admin", "church_admin", "content_manager"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  church_admin: "Church Admin",
  content_manager: "Content Manager",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Everything: website, messages, all users and email settings.",
  church_admin: "Website content, messages, and Content Manager accounts.",
  content_manager: "Edits website content — all sections, or only the ones you choose.",
};

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  church_admin: ["content.edit", "messages.view", "users.manage"],
  content_manager: ["content.edit"],
};

/** Which accounts each role may add, edit, block and remove. */
export const MANAGEABLE_ROLES: Record<Role, readonly Role[]> = {
  super_admin: ROLES,
  church_admin: ["content_manager"],
  content_manager: [],
};

export const USER_STATUSES = ["active", "invited", "blocked"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  permissions: readonly Permission[];
  /** Page sections this user may edit; null = all. Only Content Managers are limited. */
  contentSections: readonly string[] | null;
  /** May put content live. Admins always; Content Managers only if allowed (otherwise they send for review). */
  canPublish: boolean;
};

export const can = (user: Pick<CurrentUser, "permissions">, permission: Permission) =>
  user.permissions.includes(permission);

/** May this user edit this page section? */
export const canEditSection = (user: Pick<CurrentUser, "permissions" | "contentSections">, section: string) =>
  can(user, "content.edit") && (user.contentSections === null || user.contentSections.includes(section));

/** May `actor` manage an account with this role? */
export const canManageRole = (actor: Pick<CurrentUser, "role">, role: Role) =>
  MANAGEABLE_ROLES[actor.role].includes(role);
