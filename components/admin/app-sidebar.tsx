"use client";

import { useCallback, useMemo, useSyncExternalStore, useTransition } from "react";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { canEditSection, ROLE_LABELS } from "@/config/access";
import { navigationFor, type NavItem } from "@/config/navigation";
import { routes } from "@/config/routes";
import { signOutAction } from "@/features/auth/actions";
import { ADMIN_SECTION_ORDER, SECTION_META, type SectionKey } from "@/features/content/schemas";
import { SECTION_ICONS } from "@/features/content/section-icons";
import logo from "@/public/logo-mark.png";
import { cn } from "@/utils/twMerge";
import { useCurrentUser } from "./session-provider";

function isActive(pathname: string, href: string) {
  return href === routes.admin ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Menu row: roomy, rounded, with a brand-coloured bar on the active page. */
const itemClass = cn(
  "relative h-9 rounded-lg px-2.5 text-sidebar-foreground/75 transition-colors",
  "[&>svg]:text-sidebar-foreground/55 hover:[&>svg]:text-sidebar-foreground",
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground",
  "data-[active=true]:[&>svg]:text-sidebar-accent-foreground",
  "before:absolute before:inset-y-2 before:-left-2 before:w-1 before:rounded-r-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity",
  "data-[active=true]:before:opacity-100 group-data-[collapsible=icon]:before:hidden",
);

const badgeClass =
  "top-2 h-5 min-w-5 rounded-full px-1.5 text-[11px] font-bold peer-hover/menu-button:text-current peer-data-[active=true]/menu-button:text-current";

// ---------- Remember which groups are folded (per browser) ----------

const FOLD_KEY = "fdm.sidebar.folded";
const foldListeners = new Set<() => void>();
const readFolded = () => {
  try {
    return localStorage.getItem(FOLD_KEY) ?? "";
  } catch {
    return "";
  }
};
const subscribeFolded = (cb: () => void) => {
  foldListeners.add(cb);
  return () => void foldListeners.delete(cb);
};

function useFoldedGroups() {
  const raw = useSyncExternalStore(subscribeFolded, readFolded, () => "");
  const folded = useMemo(() => new Set(raw ? raw.split("|") : []), [raw]);
  const setOpen = useCallback(
    (label: string, open: boolean) => {
      const next = new Set(folded);
      if (open) next.delete(label);
      else next.add(label);
      try {
        localStorage.setItem(FOLD_KEY, [...next].join("|"));
      } catch {
        /* private mode: just don't remember */
      }
      foldListeners.forEach((l) => l());
    },
    [folded],
  );
  return { folded, setOpen };
}

// ---------- Sidebar ----------

/** Permission-filtered navigation with collapsible groups. Page sections sit under "Page Content". */
export function AppSidebar({ unreadMessages, inReview }: { unreadMessages: number; inReview: SectionKey[] }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const { folded, setOpen } = useFoldedGroups();
  const groups = navigationFor(user);
  const onNavigate = () => isMobile && setOpenMobile(false);
  // Icon-only sidebar has no labels to unfold, so show every icon.
  const iconOnly = state === "collapsed" && !isMobile;
  const reviewSet = new Set(user.canPublish ? inReview : []);

  const sectionItems: (NavItem & { key: SectionKey })[] = ADMIN_SECTION_ORDER.filter((key) => canEditSection(user, key)).map(
    (key) => ({ key, title: SECTION_META[key].label, href: routes.section(key), icon: SECTION_ICONS[key] }),
  );

  return (
    <Sidebar collapsible="icon" className="border-r-sidebar-border/70">
      <SidebarHeader className="h-16 justify-center px-3 group-data-[collapsible=icon]:px-2">
        <Link
          href={routes.admin}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl p-1 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 group-data-[collapsible=icon]:justify-center"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-sidebar-border group-data-[collapsible=icon]:size-8">
            <Image src={logo} alt="" className="h-7 w-auto group-data-[collapsible=icon]:h-6" priority />
          </span>
          <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight">FDMG</span>
            <span className="truncate text-xs text-sidebar-foreground/60">{ROLE_LABELS[user.role]}</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin gap-0 px-1 py-2">
        {groups.map((group) => {
          const items = group.sections ? sectionItems : group.items;
          if (items.length === 0) return null;
          const open = iconOnly || !folded.has(group.label);
          const waiting = group.sections ? reviewSet.size : 0;

          return (
            <Collapsible key={group.label} open={open} onOpenChange={(o) => setOpen(group.label, o)} className="group/collapsible">
              <SidebarGroup className="py-1">
                <SidebarGroupLabel asChild className="h-8 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                  <CollapsibleTrigger className="w-full cursor-pointer gap-1.5 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80">
                    <span className="truncate">{group.label}</span>
                    {waiting > 0 && !open && (
                      <span className="rounded-full bg-sky-600 px-1.5 text-[10px] font-bold leading-4 tracking-normal text-white">
                        {waiting}
                      </span>
                    )}
                    <ChevronDown
                      className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=closed]/collapsible:-rotate-90"
                      aria-hidden
                    />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <SidebarGroupContent className="pt-0.5">
                    <SidebarMenu className="gap-0.5">
                      {items.map((item) => {
                        const key = "key" in item ? (item.key as SectionKey) : null;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.title} className={itemClass}>
                              <Link href={item.href} onClick={onNavigate}>
                                <NavIcon icon={item.icon} />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                            {item.href === routes.messages && unreadMessages > 0 && (
                              <SidebarMenuBadge className={cn(badgeClass, "bg-sidebar-primary text-sidebar-primary-foreground")}>
                                {unreadMessages > 99 ? "99+" : unreadMessages}
                              </SidebarMenuBadge>
                            )}
                            {key && reviewSet.has(key) && (
                              <SidebarMenuBadge className={cn(badgeClass, "bg-sky-600 text-white")} title="Waiting for review">
                                Review
                              </SidebarMenuBadge>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 p-2">
        <UserCard />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** The item's icon, swapped for a spinner while its page is loading. */
function NavIcon({ icon: Icon }: { icon: NavItem["icon"] }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner label="Opening page" /> : <Icon aria-hidden />;
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
        <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
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
