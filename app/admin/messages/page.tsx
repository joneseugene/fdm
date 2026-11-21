import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { routes } from "@/config/routes";
import { AlertRecipients } from "@/features/messages/components/alert-recipients";
import { MessageList } from "@/features/messages/components/message-list";
import { getAlertRecipients } from "@/features/messages/server/alerts";
import { messagesService } from "@/features/messages/server/service";
import { requirePermission } from "@/server/auth/session";
import { cn } from "@/utils/twMerge";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requirePermission("messages.view");
  const filter = (await searchParams).filter === "unread" ? "unread" : "all";
  const [messages, unread, alertEmails] = await Promise.all([
    messagesService.list(filter),
    messagesService.unreadCount(),
    getAlertRecipients(),
  ]);

  return (
    <>
      <PageHeader icon={Inbox} title="Messages" description="Sent by visitors through the contact form." />
      <AlertRecipients emails={alertEmails} />
      <div className="flex w-fit gap-1 rounded-lg bg-muted p-1 text-sm">
        {(
          [
            ["all", "All"],
            ["unread", `Unread${unread ? ` (${unread})` : ""}`],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={value === "all" ? routes.messages : `${routes.messages}?filter=unread`}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors",
              filter === value && "bg-background text-foreground shadow-sm",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      <MessageList messages={messages} />
    </>
  );
}
