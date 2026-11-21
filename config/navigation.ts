import { Inbox, KeyRound, LayoutDashboard, Mail, Users, type LucideIcon } from "lucide-react";

import { can, type CurrentUser, type Permission } from "./access";
import { routes } from "./routes";

export type NavItem = { title: string; href: string; icon: LucideIcon; permission?: Permission };
/** `sections`: the group lists the page sections this user may edit (see AppSidebar). */
export type NavGroup = { label: string; items: NavItem[]; sections?: true; permission?: Permission };

const NAVIGATION: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: routes.admin, icon: LayoutDashboard },
      { title: "Messages", href: routes.messages, icon: Inbox, permission: "messages.view" },
    ],
  },
  { label: "Page Content", items: [], sections: true, permission: "content.edit" },
  {
    label: "Administration",
    items: [
      { title: "Admin users", href: routes.users, icon: Users, permission: "users.manage" },
      { title: "Email settings", href: routes.settings, icon: Mail, permission: "settings.manage" },
      { title: "Change password", href: routes.changePassword, icon: KeyRound },
    ],
  },
];

/** The sidebar for this user: items they lack permission for are hidden. */
export function navigationFor(user: Pick<CurrentUser, "permissions">): NavGroup[] {
  return NAVIGATION.filter((group) => !group.permission || can(user, group.permission))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(user, item.permission)),
    }))
    .filter((group) => group.sections || group.items.length > 0);
}
