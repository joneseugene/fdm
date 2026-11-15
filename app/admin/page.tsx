import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, FileText, Image as ImageIcon, Inbox, LayoutDashboard, Users } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/config/access";
import { routes } from "@/config/routes";
import { messagesService } from "@/features/messages/server/service";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [unread, recent] = can(user, "messages.view")
    ? await Promise.all([
        messagesService.unreadCount().catch(() => 0),
        messagesService.list("unread", 3).catch(() => []),
      ])
    : [0, []];

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome, ${user.firstName}`}
        description="Manage everything visitors see on the website."
        actions={
          <Button asChild variant="outline">
            <Link href={routes.site} target="_blank">
              <ExternalLink /> View site
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {can(user, "content.edit") && (
          <>
            <Shortcut
              href={routes.section("hero")}
              icon={ImageIcon}
              title="Hero"
              description="Headline, background image and buttons."
            />
            <Shortcut
              href={routes.content}
              icon={FileText}
              title="Page content"
              description="Services, activities, branches, scriptures and more."
            />
          </>
        )}
        {can(user, "messages.view") && (
          <Shortcut
            href={routes.messages}
            icon={Inbox}
            title="Messages"
            description="What visitors sent through the contact form."
            badge={unread > 0 ? `${unread} new` : undefined}
          />
        )}
        {can(user, "users.manage") && (
          <Shortcut href={routes.users} icon={Users} title="Admin users" description="Invite people and set their role." />
        )}
      </div>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New messages</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recent.map((m) => (
              <Link
                key={m.id}
                href={routes.messages}
                className="grid gap-0.5 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm font-medium">{m.name}</span>
                <span className="line-clamp-1 text-sm text-muted-foreground">{m.message}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Shortcut({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: typeof Inbox;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15">
              <Icon className="size-5" aria-hidden />
            </span>
            {badge && <Badge>{badge}</Badge>}
          </div>
          <CardTitle className="flex items-center gap-1 pt-2 text-base">
            {title} <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
