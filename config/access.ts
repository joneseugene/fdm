/**
 * Roles and what they may do. Client-safe (used by the sidebar too).
 * Add a permission here, then check it with `assertPermission` /
 * `requirePermission` on the server.
 */
export const PERMISSIONS = ["content.edit", "messages.view", "users.manage", "settings.manage"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["super_admin", "church_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  church_admin: "Church Admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Manages the website, messages, admin users and email settings.",
  church_admin: "Manages the website content and reads messages.",
};

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  church_admin: ["content.edit", "messages.view"],
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
};

export const can = (user: Pick<CurrentUser, "permissions">, permission: Permission) =>
  user.permissions.includes(permission);
