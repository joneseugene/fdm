import type { Metadata } from "next";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { UsersView } from "@/features/users/components/users-view";
import { usersService } from "@/features/users/server/service";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admin users" };

export default async function UsersPage() {
  await requirePermission("users.manage");
  const users = await usersService.list();
  return (
    <>
      <PageHeader
        icon={Users}
        title="Admin users"
        description="People who can sign in to this admin. Church Admins manage the website; Super Admins also manage users and email settings."
      />
      <UsersView users={users} />
    </>
  );
}
