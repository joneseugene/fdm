import "server-only";

import { ACCESS_TOKEN_TTL_SECONDS } from "./tokens";

export const ACCESS_COOKIE = "fdm_at";
export const REFRESH_COOKIE = "fdm_rt";

export const PERSISTENT_SESSION_SECONDS = 60 * 60 * 24 * 30;

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Shape shared by `cookies()` and `NextResponse.cookies`. */
type CookieWriter = {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
  delete(name: string): unknown;
};

export type IssuedTokens = {
  accessToken: string;
  /** Present only when a new refresh token was minted (login / rotation). */
  refreshToken?: string;
  /** Persistent sessions survive a browser restart; others end with it. */
  persistent: boolean;
};

export function writeSessionCookies(store: CookieWriter, tokens: IssuedTokens) {
  store.set(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: ACCESS_TOKEN_TTL_SECONDS });
  if (tokens.refreshToken) {
    store.set(REFRESH_COOKIE, tokens.refreshToken, {
      ...base,
      ...(tokens.persistent ? { maxAge: PERSISTENT_SESSION_SECONDS } : {}),
    });
  }
}

export function clearSessionCookies(store: CookieWriter) {
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
