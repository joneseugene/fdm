"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { can, ROLE_LABELS } from "@/config/access";
import { navigationFor } from "@/config/navigation";
import { routes } from "@/config/routes";
import { signOutAction } from "@/features/auth/actions";
import { ADMIN_SECTION_ORDER, SECTION_META } from "@/features/content/schemas";
import logo from "@/public/logo.png";
import { cn } from "@/utils/twMerge";
import { useCurrentUser } from "./session-provider";

function isActive(pathname: string, href: string) {
  return href === routes.admin ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Menu row: roomier, rounded, with a brand-coloured bar on the active page. */
const itemClass = cn(
  "relative h-9 rounded-lg px-2.5 text-sidebar-foreground/75 transition-colors",
  "[&>svg]:text-sidebar-foreground/55 hover:[&>svg]:text-sidebar-foreground",
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground",
  "data-[active=true]:[&>svg]:text-sidebar-accent-foreground",
  "before:absolute before:inset-y-2 before:-left-2 before:w-1 before:rounded-r-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity",
  "data-[active=true]:before:opacity-100 group-data-[collapsible=icon]:before:hidden",
);

/** Permission-filtered navigation. Page sections are listed under "Page content". */
export function AppSidebar({ unreadMessages }: { unreadMessages: number }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const groups = navigationFor(user);
  const onNavigate = () => isMobile && setOpenMobile(false);

  return (
    <Sidebar collapsible="icon" className="border-r-sidebar-border/70">
      <SidebarHeader className="h-16 justify-center px-3 group-data-[collapsible=icon]:px-2">
        <Link
          href={routes.admin}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl p-1 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 group-data-[collapsible=icon]:justify-center"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-sidebar-border group-data-[collapsible=icon]:size-8">
            <Image src={logo} alt="" width={28} height={28} className="size-7 rounded-lg group-data-[collapsible=icon]:size-6" />
          </span>
          <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight">FDMG</span>
            <span className="truncate text-xs text-sidebar-foreground/60">Website admin</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin gap-0 px-1 py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            <SidebarGroupLabel className="h-7 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.href)}
                      tooltip={item.title}
                      className={itemClass}
                    >
                      <Link href={item.href} onClick={onNavigate}>
                        <item.icon aria-hidden />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === routes.messages && unreadMessages > 0 && (
                      <SidebarMenuBadge className="top-2 h-5 min-w-5 rounded-full bg-sidebar-primary px-1.5 text-[11px] font-bold text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-[active=true]/menu-button:text-sidebar-primary-foreground">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </SidebarMenuBadge>
                    )}
                    {item.href === routes.content && can(user, "content.edit") && (
                      <SidebarMenuSub className="mx-4 mt-1 gap-0.5 border-sidebar-border/80 px-2 py-0.5">
                        {ADMIN_SECTION_ORDER.map((key) => (
                          <SidebarMenuSubItem key={key}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === routes.section(key)}
                              className="h-7 rounded-md text-[13px] text-sidebar-foreground/65 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent/70 data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
                            >
                              <Link href={routes.section(key)} onClick={onNavigate}>
                                {SECTION_META[key].label}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 p-2">
        <UserCard />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Who's signed in, with a quick sign-out. Collapses to the avatar. */
function UserCard() {
  const user = useCurrentUser();
  const [pending, startTransition] = useTransition();
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="flex items-center gap-2.5 rounded-xl p-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground"
        title={user.fullName}
        aria-hidden
      >
        {initials}
      </span>
      <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-semibold">{user.fullName || user.email}</span>
        <span className="truncate text-xs text-sidebar-foreground/60">{ROLE_LABELS[user.role]}</span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await signOutAction()))}
        aria-label="Sign out"
        title="Sign out"
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-sidebar-foreground/60 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:opacity-50 group-data-[collapsible=icon]:hidden"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
