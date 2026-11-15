import { z } from "zod";

import { ROLES, type Role, type UserStatus } from "@/config/access";

/** The Super Admin only gives an email and a role; the person fills in the rest when they join. */
export const inviteUserSchema = z.object({
  email: z.email("Enter a valid email address").max(200),
  role: z.enum(ROLES),
});
export type InviteUserValues = z.input<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  id: z.uuid(),
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
  otherName: z.string().trim().max(100),
  churchRole: z.string().trim().max(100),
  role: z.enum(ROLES),
});
export type UpdateUserValues = z.input<typeof updateUserSchema>;

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  churchRole: string | null;
  role: Role;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
};

export const displayName = (u: Pick<AdminUser, "firstName" | "lastName" | "otherName" | "email">) =>
  [u.firstName, u.otherName, u.lastName].filter(Boolean).join(" ") || u.email;
