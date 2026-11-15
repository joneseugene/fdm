"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CurrentUser } from "@/config/access";

const SessionContext = createContext<CurrentUser | null>(null);

/** Makes the signed-in user available to admin client components. */
export function SessionProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useCurrentUser must be used inside the admin layout");
  return user;
}
