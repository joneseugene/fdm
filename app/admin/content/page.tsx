import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { ADMIN_SECTION_ORDER, SECTION_META } from "@/features/content/schemas";
import { listSectionUpdates } from "@/features/content/server/service";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Page content" };

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export default async function ContentPage() {
  await requirePermission("content.edit");
  const updates = await listSectionUpdates();

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Page content"
        description="Every part of the website, top to bottom. Changes go live as soon as you save."
      />
      <Card className="divide-y overflow-hidden p-0">
        {ADMIN_SECTION_ORDER.map((key) => {
          const meta = SECTION_META[key];
          const updated = updates[key];
          return (
            <Link
              key={key}
              href={routes.section(key)}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{meta.label}</span>
                  {!updated && <Badge variant="secondary">Original</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{meta.description}</p>
              </div>
              {updated && (
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  Edited {formatDate(updated)}
                </span>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          );
        })}
      </Card>
    </>
  );
}
