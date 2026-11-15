"use server";

import { defineAction } from "@/server/core/action";
import { AppError } from "@/server/core/errors";
import { sendWith } from "@/server/email";
import { testEmail } from "@/server/email/templates";
import { smtpSettingsSchema, testEmailSchema } from "./schemas";
import { getActiveSmtpConfig, saveSmtpSettings } from "./server/smtp";

export const saveSmtpSettingsAction = defineAction({
  permissions: ["settings.manage"],
  input: smtpSettingsSchema,
  handler: (input, { user }) => saveSmtpSettings(input, user.id),
  refresh: true,
});

/** Sends a test through the SAVED settings, so it proves what invitations will use. */
export const sendTestEmailAction = defineAction({
  permissions: ["settings.manage"],
  input: testEmailSchema,
  handler: async ({ to }) => {
    const config = await getActiveSmtpConfig();
    if (!config) throw AppError.validation("Save and switch on the SMTP settings first.");
    try {
      await sendWith(config, { to, ...testEmail() });
    } catch (error) {
      // Show the SMTP server's reason (no credentials are in it) — it's what the admin needs to fix it.
      const reason = (error as Error)?.message?.replace(/\s+/g, " ").slice(0, 300) ?? "Unknown error";
      throw new AppError("INTEGRATION", `The email couldn't be sent: ${reason}`);
    }
  },
});
