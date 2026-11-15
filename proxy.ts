import { NextResponse, type NextRequest } from "next/server";

import { GUEST_ONLY_PATHS, routes } from "@/config/routes";
import { proxySession } from "@/server/auth/native-auth";

/**
 * Runs only for /admin and the sign-in pages (see `matcher`), never for the
 * public site — so the landing page stays fully static and fast.
 *  1. refreshes an expired access token from the refresh cookie
 *  2. optimistic redirects: no session -> /login, session on /login -> /admin
 *
 * This is NOT authorization. Pages and actions still check via the DAL
 * (server/auth/session.ts), which validates the session properly.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, hasSession } = await proxySession(request);

  const isAdmin = pathname === routes.admin || pathname.startsWith(`${routes.admin}/`);

  if (!hasSession && isAdmin) {
    const url = new URL(routes.login, request.url);
    if (pathname !== routes.admin) url.searchParams.set("next", `${pathname}${search}`);
    return withCookies(NextResponse.redirect(url), response);
  }

  if (hasSession && (GUEST_ONLY_PATHS as readonly string[]).includes(pathname)) {
    return withCookies(NextResponse.redirect(new URL(routes.admin, request.url)), response);
  }

  return response;
}

/** Keep refreshed session cookies when we replace the response with a redirect. */
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/login", "/forgot-password"],
};
