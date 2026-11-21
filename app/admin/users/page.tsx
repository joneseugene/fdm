import type { Metadata } from "next";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { UsersView } from "@/features/users/components/users-view";
import { usersService } from "@/features/users/server/service";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admin users" };

export default async function UsersPage() {
  const user = await requirePermission("users.manage");
  const users = await usersService.list();
  return (
    <>
      <PageHeader
        icon={Users}
        title="Admin users"
        description={
          user.role === "super_admin"
            ? "Everyone who can sign in to this admin. Super Admins manage everything; Church Admins manage content, messages and Content Managers; Content Managers edit the sections you give them."
            : "Everyone who can sign in to this admin. You can add and manage Content Managers and choose which sections each one can edit."
        }
      />
      <UsersView users={users} />
    </>
  );
}
