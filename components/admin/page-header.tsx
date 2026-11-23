import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

/** Standard admin page heading: back link, icon, title, description and actions. */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="grid gap-3">
      {back && (
        <Link
          href={back.href}
          className="-my-1 inline-flex w-fit items-center gap-1.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-foreground sm:size-10">
              <Icon className="size-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
