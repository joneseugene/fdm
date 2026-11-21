import type { Metadata } from "next";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { UsersView } from "@/features/users/components/users-view";
import { usersService } from "@/features/users/server/service";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admin users" };

export default async function UsersPage() {
  const user = await requirePermission("users.manage");
  const users = await usersService.list(user);
  return (
    <>
      <PageHeader
        icon={Users}
        title="Admin users"
        description={
          user.role === "super_admin"
            ? "Everyone you manage. Church Admins manage content, messages and Content Managers; Content Managers edit the sections you give them."
            : "The Content Managers you manage, and which sections each one can edit."
        }
      />
      <UsersView users={users} loadedAt={new Date().toISOString()} />
    </>
  );
}
