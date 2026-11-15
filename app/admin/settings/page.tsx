import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { SmtpForm } from "@/features/settings/components/smtp-form";
import { getSmtpView } from "@/features/settings/server/smtp";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Email settings" };

export default async function SettingsPage() {
  const user = await requirePermission("settings.manage");
  const settings = await getSmtpView();
  return (
    <>
      <PageHeader
        icon={Mail}
        title="Email settings"
        description="The email account the website uses to send invitation codes and password resets."
      />
      <SmtpForm key={settings.updatedAt ?? "new"} settings={settings} myEmail={user.email} />
    </>
  );
}
