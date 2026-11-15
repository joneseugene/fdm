import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { SessionProvider } from "@/components/admin/session-provider";
import { SiteHeader } from "@/components/admin/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { can } from "@/config/access";
import { messagesService } from "@/features/messages/server/service";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Authenticated shell. The session and sidebar cookie are read inside
 * <Suspense>, as Cache Components requires.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-ui flex min-h-svh flex-1">
      <Suspense fallback={<ShellSkeleton />}>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </Suspense>
      <Toaster position="top-center" />
    </div>
  );
}

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const [user, cookieStore] = await Promise.all([requireUser(), cookies()]);
  // A badge must never break the page: on failure it just shows nothing.
  const unread = can(user, "messages.view") ? await messagesService.unreadCount().catch(() => 0) : 0;
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SessionProvider user={user}>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar unreadMessages={unread} />
        <SidebarInset>
          <SiteHeader />
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar md:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-14 border-b" />
        <div className="mx-auto grid w-full max-w-5xl gap-4 p-4 sm:p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
