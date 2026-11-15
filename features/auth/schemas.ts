import { z } from "zod";

/** Policy for NEW passwords (reset/change). Existing passwords are not re-validated. */
export const newPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(128),
  /** Keep the session across browser restarts (30-day sliding refresh). */
  remember: z.boolean(),
  /** Where to go after login; validated as a same-site path in the action. */
  next: z.string().optional(),
});
export type LoginValues = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: z.email("Enter a valid email address") });
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Missing reset token"),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;

export const INVITE_CODE_LENGTH = 6;

/** Join step 1: the code from the invitation email. */
export const inviteCodeSchema = z.object({
  email: z.email("Enter the email the invitation was sent to"),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** Join step 2: their profile and password. */
export const joinProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, "Required").max(100),
    lastName: z.string().trim().min(1, "Required").max(100),
    otherName: z.string().trim().max(100),
    churchRole: z.string().trim().min(2, "Required, e.g. Pastor or Secretary").max(100),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type JoinProfileValues = z.input<typeof joinProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Choose a password different from your current one",
    path: ["newPassword"],
  });
export type ChangePasswordValues = z.input<typeof changePasswordSchema>;
