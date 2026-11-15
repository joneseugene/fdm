import { z } from "zod";

/** SMTP form. A blank password keeps the saved one. */
export const smtpSettingsSchema = z.object({
  enabled: z.boolean(),
  host: z.string().trim().max(200),
  port: z.coerce.number().int().min(1, "Invalid port").max(65535, "Invalid port"),
  user: z.string().trim().max(200),
  password: z.string().max(500),
  fromName: z.string().trim().max(100),
  fromEmail: z.union([z.email("Enter a valid email"), z.literal("")]),
}).superRefine((v, ctx) => {
  if (!v.enabled) return;
  if (!v.host) ctx.addIssue({ code: "custom", path: ["host"], message: "Required" });
  if (!v.user) ctx.addIssue({ code: "custom", path: ["user"], message: "Required" });
});
export type SmtpSettingsValues = z.input<typeof smtpSettingsSchema>;

/** What the form shows (never the password itself). */
export type SmtpSettingsView = {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  hasPassword: boolean;
  fromName: string;
  fromEmail: string;
  updatedAt: string | null;
};

export const testEmailSchema = z.object({ to: z.email("Enter a valid email") });
