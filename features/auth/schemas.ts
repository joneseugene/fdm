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

/** Accepting an invitation: the link's token and their new password. */
export const acceptInviteSchema = z
  .object({
    token: z.string().min(1, "Missing invitation link").max(200),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type AcceptInviteValues = z.input<typeof acceptInviteSchema>;

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
