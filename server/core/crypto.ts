import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { requireEnv } from "@/server/env";
import { AppError } from "./errors";

/**
 * AES-256-GCM for secrets stored in the database (e.g. the SMTP password).
 * Format: v1.<iv>.<tag>.<ciphertext>, all base64url.
 */
const key = () => createHash("sha256").update(requireEnv("CONFIG_ENCRYPTION_KEY", "saving secrets")).digest();

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, data] = stored.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw AppError.internal("Unreadable secret");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch (error) {
    // Usually: CONFIG_ENCRYPTION_KEY changed since it was saved.
    throw AppError.internal("The saved secret can't be decrypted. Enter it again.", error);
  }
}
