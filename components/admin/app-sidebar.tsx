"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
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
import { can } from "@/config/access";
import { navigationFor } from "@/config/navigation";
import { routes } from "@/config/routes";
import { ADMIN_SECTION_ORDER, SECTION_META } from "@/features/content/schemas";
import logo from "@/public/logo.png";
import { useCurrentUser } from "./session-provider";

function isActive(pathname: string, href: string) {
  return href === routes.admin ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Permission-filtered navigation. Page sections are listed under "Page content". */
export function AppSidebar({ unreadMessages }: { unreadMessages: number }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const groups = navigationFor(user);
  const onNavigate = () => isMobile && setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <Link
          href={routes.admin}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-1 font-semibold group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Image src={logo} alt="" width={28} height={28} className="size-7 shrink-0 rounded-md" />
          <span className="truncate text-sm group-data-[collapsible=icon]:hidden">Website admin</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.title}>
                      <Link href={item.href} onClick={onNavigate}>
                        <item.icon aria-hidden />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === routes.messages && unreadMessages > 0 && (
                      <SidebarMenuBadge>{unreadMessages}</SidebarMenuBadge>
                    )}
                    {item.href === routes.content && can(user, "content.edit") && (
                      <SidebarMenuSub>
                        {ADMIN_SECTION_ORDER.map((key) => (
                          <SidebarMenuSubItem key={key}>
                            <SidebarMenuSubButton asChild isActive={pathname === routes.section(key)}>
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
      <SidebarRail />
    </Sidebar>
  );
}
