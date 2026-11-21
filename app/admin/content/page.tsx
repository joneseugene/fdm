import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canEditSection } from "@/config/access";
import { routes } from "@/config/routes";
import { ADMIN_SECTION_ORDER, SECTION_META } from "@/features/content/schemas";
import { SECTION_ICONS } from "@/features/content/section-icons";
import { listDraftStatuses } from "@/features/content/server/drafts";
import { listSectionUpdates } from "@/features/content/server/service";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Page content" };

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export default async function ContentPage() {
  const user = await requirePermission("content.edit");
  const [updates, drafts] = await Promise.all([listSectionUpdates(), listDraftStatuses()]);
  const sections = ADMIN_SECTION_ORDER.filter((key) => canEditSection(user, key));
  // Publishers see what's waiting for them first.
  const ordered = user.canPublish
    ? [...sections].sort((a, b) => Number(drafts[b] === "in_review") - Number(drafts[a] === "in_review"))
    : sections;

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Page content"
        description={
          user.canPublish
            ? "Every part of the website. Save drafts as you work; publish when they're ready."
            : "Save drafts as you work, then send them for review. An admin publishes them."
        }
      />
      {sections.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No sections are assigned to you yet. Ask an admin to give you access.
        </Card>
      )}
      <Card className={sections.length ? "divide-y overflow-hidden p-0" : "hidden"}>
        {ordered.map((key) => {
          const meta = SECTION_META[key];
          const Icon = SECTION_ICONS[key];
          const updated = updates[key];
          const draft = drafts[key];
          return (
            <Link key={key} href={routes.section(key)} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{meta.label}</span>
                  {draft === "in_review" && <Badge className="bg-sky-600 text-white hover:bg-sky-600">In review</Badge>}
                  {draft === "draft" && <Badge className="bg-violet-600 text-white hover:bg-violet-600">Draft</Badge>}
                  {!updated && !draft && <Badge variant="secondary">Original</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{meta.description}</p>
              </div>
              {updated && (
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">Published {formatDate(updated)}</span>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          );
        })}
      </Card>
    </>
  );
}
