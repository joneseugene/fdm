import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

import { requireEnv } from "@/server/env";

/** Access tokens are short-lived; the refresh token keeps the session alive. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

const ISSUER = "fdmg-admin";
const AUDIENCE = "fdmg-admin";

let secretKey: Uint8Array | undefined;
const key = () => (secretKey ??= new TextEncoder().encode(requireEnv("AUTH_SECRET", "auth")));

export type AccessClaims = { userId: string; sessionId: string };

export async function signAccessToken({ userId, sessionId }: AccessClaims): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(key());
}

/** Returns claims for a valid, unexpired token; null otherwise. Never throws. */
export async function verifyAccessToken(token: string | undefined): Promise<AccessClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}

/** High-entropy opaque token (refresh / password reset). Only its hash is stored. */
export const generateOpaqueToken = () => randomBytes(32).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
