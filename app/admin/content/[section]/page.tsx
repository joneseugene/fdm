import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { SectionEditor } from "@/features/content/components/section-editor";
import type { FieldValues } from "react-hook-form";

import { isSectionKey, SECTION_META, SECTION_SCHEMAS } from "@/features/content/schemas";
import { getDraft } from "@/features/content/server/drafts";
import { getSectionForEdit } from "@/features/content/server/service";
import { requirePermission, requireSection } from "@/server/auth/session";

export async function generateMetadata({ params }: PageProps<"/admin/content/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isSectionKey(section) ? SECTION_META[section].label : "Content" };
}

export default async function SectionPage({ params }: PageProps<"/admin/content/[section]">) {
  await requirePermission("content.edit");
  const { section } = await params;
  if (!isSectionKey(section)) notFound();
  await requireSection(section);

  const meta = SECTION_META[section];
  const [{ data, updatedAt }, draft] = await Promise.all([getSectionForEdit(section), getDraft(section)]);
  // A draft that no longer fits the form (e.g. after an update) is shown as the live version instead.
  const draftData = draft && SECTION_SCHEMAS[section].safeParse(draft.data).success ? draft.data : null;

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
      {/* Keyed so a save/publish/restore (or switching sections) starts from what's stored. */}
      <SectionEditor
        key={`${section}:${updatedAt}:${draft?.info.updatedAt ?? "live"}:${draft?.info.status ?? ""}`}
        sectionKey={section}
        initial={(draftData ?? data) as FieldValues}
        isCustomised={updatedAt !== null}
        draft={draftData ? draft!.info : null}
      />
    </>
  );
}
