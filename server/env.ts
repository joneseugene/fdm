import "server-only";
import { z } from "zod";

/**
 * Server-only environment. Nothing here is ever sent to the browser.
 * Optional values are validated by the code that needs them (`requireEnv`),
 * so the public site still builds and renders (with default content) before
 * the backend is configured.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /** Public base URL of this site, used in emailed links. */
  APP_URL: z.url().default("http://localhost:3000"),

  /** Signs access tokens. ≥ 32 random chars. Changing it signs everyone out. */
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters").optional(),

  // Supabase (data store + image storage; auth is native)
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  /**
   * Encrypts secrets saved in the admin (the SMTP password). 32 random bytes,
   * base64url. Changing it means re-entering them.
   */
  CONFIG_ENCRYPTION_KEY: z.string().min(32).optional(),

  // Email fallback, used until SMTP is set up in Admin > Email settings.
  EMAIL_PROVIDER: z.enum(["smtp", "console", "none"]).default("console"),
  EMAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  /** Optional: who gets an email when someone sends the contact form. Comma-separated. */
  CONTACT_NOTIFY_EMAIL: z.string().min(3).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Empty strings in .env mean "not set".
const raw = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== ""),
);

export const serverEnv: ServerEnv = serverEnvSchema.parse(raw);

/** Read a variable that is optional globally but required by the caller. */
export function requireEnv<K extends keyof ServerEnv>(
  key: K,
  context: string,
): NonNullable<ServerEnv[K]> {
  const value = serverEnv[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing env ${String(key)} (required by ${context})`);
  }
  return value as NonNullable<ServerEnv[K]>;
}

/** True once Supabase is configured; until then the site shows its default content. */
export const hasDatabase = () =>
  Boolean(serverEnv.SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY);
