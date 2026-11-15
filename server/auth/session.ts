import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { can, type CurrentUser, type Permission } from "@/config/access";
import { routes } from "@/config/routes";
import { AppError } from "@/server/core/errors";
import { auth } from "./native-auth";

/**
 * Data Access Layer for identity. Every authorization decision goes through
 * here. Memoized per request, so calling it from many components is free.
 * Reads cookies, so callers must render inside <Suspense> (Cache Components).
 */
export const getCurrentUser = cache((): Promise<CurrentUser | null> => auth.getCurrentUser());

// ---------- For server actions: throw AppError ----------

export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw AppError.unauthenticated();
  return user;
}

export async function assertPermission(...permissions: Permission[]): Promise<CurrentUser> {
  const user = await assertUser();
  if (!permissions.every((p) => can(user, p))) throw AppError.forbidden();
  return user;
}

// ---------- For pages and layouts: redirect ----------

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(routes.login);
  return user;
}

export async function requirePermission(...permissions: Permission[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!permissions.every((p) => can(user, p))) redirect(routes.forbidden);
  return user;
}
