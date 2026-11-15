import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { SectionEditor } from "@/features/content/components/section-editor";
import { isSectionKey, SECTION_META } from "@/features/content/schemas";
import { getSectionForEdit } from "@/features/content/server/service";
import { requirePermission } from "@/server/auth/session";

export async function generateMetadata({ params }: PageProps<"/admin/content/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isSectionKey(section) ? SECTION_META[section].label : "Content" };
}

export default async function SectionPage({ params }: PageProps<"/admin/content/[section]">) {
  await requirePermission("content.edit");
  const { section } = await params;
  if (!isSectionKey(section)) notFound();

  const meta = SECTION_META[section];
  const { data, updatedAt } = await getSectionForEdit(section);

  return (
    <>
      <PageHeader
        back={{ href: routes.content, label: "page content" }}
        icon={FileText}
        title={meta.label}
        description={meta.description}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={meta.anchor ? `/#${meta.anchor}` : "/"} target="_blank">
              <ExternalLink /> View on site
            </Link>
          </Button>
        }
      />
      {/* Keyed so a save/restore (or switching sections) starts from what's stored. */}
      <SectionEditor
        key={`${section}:${updatedAt}`}
        sectionKey={section}
        initial={data}
        isCustomised={updatedAt !== null}
      />
    </>
  );
}
