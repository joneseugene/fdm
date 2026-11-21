import { z } from "zod";

import { ROLES, type Role, type UserStatus } from "@/config/access";
import { SECTION_KEYS } from "@/features/content/schemas";

/** Suggestions for the "Duty" field (free text, so any duty can be typed). */
export const DUTY_SUGGESTIONS = [
  "Pastor",
  "Assistant Pastor",
  "Elder",
  "Deacon",
  "Secretary",
  "Treasurer",
  "Media Lead",
  "Worship Leader",
  "Youth Leader",
  "Women's Ministry Lead",
  "Men's Ministry Lead",
  "Children's Ministry Lead",
  "Usher",
] as const;

const sectionKey = z.enum(SECTION_KEYS as [string, ...string[]]);

/** Who they are and what they may do. Shared by "Add user" and "Edit". */
const profileFields = {
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
  otherName: z.string().trim().max(100),
  role: z.enum(ROLES),
  /** Content Managers only: every section, or just `contentSections`. */
  contentAccess: z.enum(["all", "some"]),
  contentSections: z.array(sectionKey).max(SECTION_KEYS.length),
  /** Content Managers only: publish directly instead of sending for review. */
  canPublish: z.boolean(),
};

function requireSections(v: { role: Role; contentAccess: "all" | "some"; contentSections: string[] }, ctx: z.RefinementCtx) {
  if (v.role === "content_manager" && v.contentAccess === "some" && v.contentSections.length === 0) {
    ctx.addIssue({ code: "custom", path: ["contentSections"], message: "Choose at least one section" });
  }
}

/** The admin fills in who they are; the person only chooses a password when they join. */
export const inviteUserSchema = z
  .object({
    ...profileFields,
    email: z.email("Enter a valid email address").max(200),
    churchRole: z.string().trim().min(2, "Enter their duty, e.g. Pastor or Secretary").max(100),
  })
  .superRefine(requireSections);
export type InviteUserValues = z.input<typeof inviteUserSchema>;

export const updateUserSchema = z
  .object({
    ...profileFields,
    id: z.uuid(),
    churchRole: z.string().trim().max(100),
  })
  .superRefine(requireSections);
export type UpdateUserValues = z.input<typeof updateUserSchema>;

/** What's stored in users.content_sections: null = all sections. */
export const storedSections = (v: { role: Role; contentAccess: "all" | "some"; contentSections: string[] }) =>
  v.role === "content_manager" && v.contentAccess === "some" ? [...new Set(v.contentSections)] : null;

/** What's stored in users.can_publish (only Content Managers use it). */
export const storedCanPublish = (v: { role: Role; canPublish: boolean }) => v.role === "content_manager" && v.canPublish;

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  churchRole: string | null;
  role: Role;
  /** Content Managers: the sections they may edit; null = all. */
  contentSections: string[] | null;
  /** Content Managers: may publish without review. */
  canPublish: boolean;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
};

export const displayName = (u: Pick<AdminUser, "firstName" | "lastName" | "otherName" | "email">) =>
  [u.firstName, u.otherName, u.lastName].filter(Boolean).join(" ") || u.email;
