import {
  FileText,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  Users,
  type LucideIcon,
} from "lucide-react";

import { can, type CurrentUser, type Permission } from "./access";
import { routes } from "./routes";

export type NavItem = { title: string; href: string; icon: LucideIcon; permission?: Permission };
export type NavGroup = { label: string; items: NavItem[] };

const NAVIGATION: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: routes.admin, icon: LayoutDashboard }],
  },
  {
    label: "Website",
    items: [
      { title: "Page content", href: routes.content, icon: FileText, permission: "content.edit" },
      { title: "Messages", href: routes.messages, icon: Inbox, permission: "messages.view" },
    ],
  },
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
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || can(user, item.permission)),
  })).filter((group) => group.items.length > 0);
}
