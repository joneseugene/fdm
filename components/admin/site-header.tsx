"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ExternalLink, KeyRound, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ROLE_LABELS } from "@/config/access";
import { routes } from "@/config/routes";
import { signOutAction } from "@/features/auth/actions";
import { useCurrentUser } from "./session-provider";

/** Sticky top bar: sidebar toggle, "View site" and the account menu. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 pt-[env(safe-area-inset-top)] backdrop-blur sm:px-4">
      <SidebarTrigger className="-ml-1 size-9 [&_svg]:size-5" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <div className="flex-1" />
      <Button asChild variant="outline" size="sm">
        <Link href={routes.site} target="_blank">
          <ExternalLink /> <span className="hidden sm:inline">View site</span>
        </Link>
      </Button>
      <UserMenu />
    </header>
  );
}

function UserMenu() {
  const user = useCurrentUser();
  const [pending, startTransition] = useTransition();
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full font-semibold" aria-label="Account menu">
          {initials || "?"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate">{user.fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={routes.changePassword}>
            <KeyRound /> Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await signOutAction();
            });
          }}
        >
          <LogOut /> {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
