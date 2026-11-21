import type { Metadata } from "next";
import { Inbox } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { AlertRecipients } from "@/features/messages/components/alert-recipients";
import { MessageList } from "@/features/messages/components/message-list";
import { getAlertRecipients } from "@/features/messages/server/alerts";
import { messagesService } from "@/features/messages/server/service";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requirePermission("messages.view");
  const [messages, alertEmails] = await Promise.all([messagesService.list("all", 1000), getAlertRecipients()]);

  return (
    <>
      <PageHeader icon={Inbox} title="Messages" description="Sent by visitors through the contact form." />
      <MessageList messages={messages} loadedAt={new Date().toISOString()} />
      <AlertRecipients emails={alertEmails} />
    </>
  );
}
