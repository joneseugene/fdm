import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { db } from "@/server/db";
import { AppError } from "./errors";
import { logger } from "./logger";

/**
 * Per-IP limits for public, abuse-prone actions. Fixed windows, counted in
 * Postgres so every app instance sees the same numbers. Accounts also lock
 * after repeated wrong passwords.
 */
export const RATE_LIMITS = {
  signIn: { limit: 20, windowSeconds: 15 * 60 },
  passwordReset: { limit: 5, windowSeconds: 15 * 60 },
  contact: { limit: 5, windowSeconds: 60 * 60 },
  /** Setting a password from an invitation link. */
  acceptInvite: { limit: 20, windowSeconds: 15 * 60 },
} as const;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}

/** Throws RATE_LIMITED when this IP is over the limit for `name`. */
export async function enforceRateLimit(name: keyof typeof RATE_LIMITS) {
  const { limit, windowSeconds } = RATE_LIMITS[name];
  // Only a hash of the IP is stored.
  const ipHash = createHash("sha256").update(await clientIp()).digest("hex").slice(0, 32);

  const { data, error } = await db()
    .rpc("hit_rate_limit", { p_key: `${name}:${ipHash}`, p_limit: limit, p_window_seconds: windowSeconds })
    .single<{ allowed: boolean; retry_after_seconds: number }>();

  if (error || !data) {
    // Fail open: a storage hiccup shouldn't stop people signing in.
    logger.error("Rate limit check failed", { name, message: error?.message });
    return;
  }

  if (!data.allowed) {
    const minutes = Math.max(1, Math.ceil(data.retry_after_seconds / 60));
    throw new AppError(
      "RATE_LIMITED",
      `Too many attempts from your network. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }
}
