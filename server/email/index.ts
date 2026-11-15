import "server-only";
import type { Transporter } from "nodemailer";

import { getActiveSmtpConfig, type SmtpConfig } from "@/features/settings/server/smtp";
import { logger } from "@/server/core/logger";
import { serverEnv } from "@/server/env";

export type SendEmailInput = { to: string; subject: string; text: string; html?: string };

/**
 * Sends email with nodemailer. Which account:
 *  1. the SMTP account a Super Admin set up in Admin > Email settings, else
 *  2. SMTP_* from the environment (EMAIL_PROVIDER=smtp), else
 *  3. EMAIL_PROVIDER=console: printed to the server log (development).
 */

let cached: { version: string; transport: Promise<Transporter> } | undefined;

function transportFor(config: SmtpConfig): Promise<Transporter> {
  if (cached?.version !== config.version) {
    cached = {
      version: config.version,
      transport: import("nodemailer").then(({ default: nodemailer }) =>
        nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.port === 465, // 465 = TLS; 587 upgrades with STARTTLS
          auth: { user: config.user, pass: config.pass },
          connectionTimeout: 15_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
        }),
      ),
    };
  }
  return cached.transport;
}

function envSmtpConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_PORT, EMAIL_FROM } = serverEnv;
  if (serverEnv.EMAIL_PROVIDER !== "smtp" || !SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  return {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
    from: EMAIL_FROM ?? SMTP_USER,
    version: "env",
  };
}

async function activeConfig(): Promise<SmtpConfig | null> {
  try {
    const fromApp = await getActiveSmtpConfig();
    if (fromApp) return fromApp;
  } catch (error) {
    logger.error("Could not read email settings", { message: (error as Error)?.message });
  }
  return envSmtpConfig();
}

/** Send through a specific account (used by "Send test email" before saving). */
export async function sendWith(config: SmtpConfig, input: SendEmailInput) {
  const info = await (await transportFor(config)).sendMail({ from: config.from, ...input });
  logger.info("Email sent", { subject: input.subject.replace(/\b\d{6}\b/g, "******"), messageId: info.messageId });
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const config = await activeConfig();
  if (config) {
    try {
      await sendWith(config, input);
      return;
    } catch (error) {
      logger.error("Email failed", { message: (error as Error)?.message?.slice(0, 200) });
      throw new Error("Email could not be sent");
    }
  }
  if (serverEnv.EMAIL_PROVIDER === "console") {
    logger.info("EMAIL (console — not sent; set up SMTP in Admin > Email settings)", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return;
  }
  throw new Error("No email account is set up. A Super Admin can add one in Email settings.");
}
