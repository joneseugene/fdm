import type { Metadata } from "next";
import { KeyRound } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = { title: "Change password" };

export default function ChangePasswordPage() {
  return (
    <>
      <PageHeader
        icon={KeyRound}
        title="Change password"
        description="Changing it signs you out on your other devices."
      />
      <Card>
        <CardContent className="pt-6">
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
