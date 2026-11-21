"use client";

import { useEffect, useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, FilePen, MessageSquareWarning, RotateCcw, Save, Send, Trash2, Undo2, Upload } from "lucide-react";

import { useCurrentUser } from "@/components/admin/session-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import type { ActionError } from "@/lib/result";
import { cn } from "@/utils/twMerge";
import {
  discardDraftAction,
  publishSectionAction,
  resetSectionAction,
  returnDraftAction,
  saveDraftAction,
  submitForReviewAction,
} from "../actions";
import { SECTION_META, SECTION_SCHEMAS, type SectionDraftInfo, type SectionKey } from "../schemas";
import { SECTION_FORMS } from "./section-forms";

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

/**
 * Edits one page section. Changes are saved as a draft (not live). Publishers
 * put a draft live; everyone else sends it for review.
 */
export function SectionEditor({
  sectionKey,
  initial,
  isCustomised,
  draft,
}: {
  sectionKey: SectionKey;
  /** The draft if there is one, otherwise the published content. */
  initial: FieldValues;
  /** The live section differs from the original content. */
  isCustomised: boolean;
  draft: SectionDraftInfo | null;
}) {
  const me = useCurrentUser();
  const canPublish = me.canPublish;
  const form = useForm<FieldValues>({
    // Each section has its own schema; the form is addressed by field path.
    resolver: zodResolver(SECTION_SCHEMAS[sectionKey] as never),
    defaultValues: initial,
    mode: "onTouched",
  });
  const { isDirty } = form.formState;
  const label = SECTION_META[sectionKey].label;

  const fieldErrors = (error: ActionError) => {
    // Server field paths are relative to the section ("items.0.title").
    for (const [path, messages] of Object.entries(error.fieldErrors ?? {})) {
      form.setError(path.replace(/^data\./, ""), { type: "server", message: messages[0] });
    }
  };
  const done = (_: unknown, input: { data: unknown }) => form.reset(input.data as FieldValues);

  const saveDraft = useAction(saveDraftAction, { successMessage: "Draft saved. Nothing has changed on the website yet.", onSuccess: done, onError: fieldErrors });
  const submit = useAction(submitForReviewAction, { successMessage: "Sent for review. An admin will publish it.", onSuccess: done, onError: fieldErrors });
  const publish = useAction(publishSectionAction, { successMessage: "Published — the website is updated.", onSuccess: done, onError: fieldErrors });
  const discard = useAction(discardDraftAction, { successMessage: "Draft discarded." });
  const reset = useAction(resetSectionAction, { successMessage: "Restored the original content." });
  const busy = saveDraft.pending || submit.pending || publish.pending || discard.pending || reset.pending;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  /** Validate the form, then run the chosen action with its values. */
  const run = (action: (input: { key: SectionKey; data: FieldValues }) => unknown) =>
    form.handleSubmit(
      (data) => action({ key: sectionKey, data }),
      () =>
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>("[aria-invalid=true]")?.scrollIntoView({ block: "center" }),
        ),
    );

  const inReview = draft?.status === "in_review";
  const hasWork = isDirty || Boolean(draft);
  const status = isDirty
    ? "Unsaved changes"
    : inReview
      ? "Waiting for review"
      : draft
        ? "Draft saved — not live yet"
        : "Live on the website";

  const Fields = SECTION_FORMS[sectionKey];

  return (
    <Form {...form}>
      <form
        noValidate
        className="grid gap-6"
        // Enter in a field saves a draft — never publishes by accident.
        onSubmit={run(saveDraft.run)}
      >
        <DraftBanner draft={draft} sectionKey={sectionKey} canReview={canPublish && inReview} />

        <Fields />

        <div className="sticky bottom-0 z-20 -mx-4 -mb-4 border-t bg-background/95 backdrop-blur sm:-mx-6 sm:-mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-1">
              {canPublish && isCustomised && (
                <Confirm
                  trigger={
                    <Button type="button" variant="ghost" size="sm" disabled={busy}>
                      <RotateCcw /> <span className="hidden sm:inline">Restore original</span>
                    </Button>
                  }
                  title={`Restore the original ${label.toLowerCase()}?`}
                  description="The website goes back to its original content for this section, and any draft is discarded. This can't be undone."
                  confirm="Restore"
                  onConfirm={() => reset.run({ key: sectionKey })}
                />
              )}
              {draft && !isDirty && (
                <Confirm
                  trigger={
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy}>
                      <Trash2 /> <span className="hidden sm:inline">Discard draft</span>
                    </Button>
                  }
                  title="Discard this draft?"
                  description="The unpublished changes are deleted. The website stays as it is."
                  confirm="Discard"
                  onConfirm={() => discard.run({ key: sectionKey })}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="hidden text-sm text-muted-foreground md:inline" aria-live="polite">
                {status}
              </span>
              {isDirty && (
                <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={busy}>
                  Undo changes
                </Button>
              )}
              <Button type="submit" variant="outline" loading={saveDraft.pending} disabled={!isDirty || busy}>
                <Save /> {saveDraft.pending ? "Saving…" : "Save draft"}
              </Button>
              {canPublish ? (
                <Button type="button" onClick={run(publish.run)} loading={publish.pending} disabled={!hasWork || busy}>
                  <Upload /> {publish.pending ? "Publishing…" : "Publish"}
                </Button>
              ) : (
                <Button type="button" onClick={run(submit.run)} loading={submit.pending} disabled={(!isDirty && (!draft || inReview)) || busy}>
                  <Send /> {submit.pending ? "Sending…" : inReview && !isDirty ? "Sent for review" : "Send for review"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

/** What state the draft is in, and — for reviewers — a way to send it back. */
function DraftBanner({ draft, sectionKey, canReview }: { draft: SectionDraftInfo | null; sectionKey: SectionKey; canReview: boolean }) {
  if (!draft) {
    return (
      <Banner tone="ok" icon={CheckCircle2}>
        You&apos;re editing the live version. Save a draft to keep working without changing the website.
      </Banner>
    );
  }
  if (draft.status === "in_review") {
    return (
      <Banner tone="info" icon={Clock} action={canReview ? <SendBack sectionKey={sectionKey} /> : undefined}>
        <strong>Waiting for review.</strong> Sent by {draft.submittedByName ?? "someone"}
        {draft.submittedAt && <> on {when(draft.submittedAt)}</>}.
        {canReview ? " Check the changes below, then publish or send them back." : " An admin will publish it."}
      </Banner>
    );
  }
  if (draft.reviewNote) {
    return (
      <Banner tone="warn" icon={MessageSquareWarning}>
        <strong>Changes requested:</strong> <span className="whitespace-pre-wrap">{draft.reviewNote}</span>
      </Banner>
    );
  }
  return (
    <Banner tone="draft" icon={FilePen}>
      <strong>Draft — not live yet.</strong> Last saved by {draft.updatedByName ?? "someone"} on {when(draft.updatedAt)}.
    </Banner>
  );
}

const TONES = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  draft: "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
} as const;

function Banner({
  tone,
  icon: Icon,
  action,
  children,
}: {
  tone: keyof typeof TONES;
  icon: typeof Clock;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm", TONES[tone])} role="status">
      <Icon className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">{children}</p>
      {action}
    </div>
  );
}

function SendBack({ sectionKey }: { sectionKey: SectionKey }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = useAction(returnDraftAction, {
    successMessage: "Sent back with your note.",
    toastErrors: false,
    onSuccess: () => {
      setOpen(false);
      setNote("");
    },
    onError: (e) => setError(e.fieldErrors?.note?.[0] ?? e.message),
  });

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="bg-background" onClick={() => setOpen(true)}>
        <Undo2 /> Send back
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send back for changes</DialogTitle>
            <DialogDescription>The draft stays saved. Tell them what to change; they&apos;ll get an email.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="review-note">What should change?</Label>
            <Textarea
              id="review-note"
              rows={4}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              placeholder="e.g. Please use the new service times and a brighter photo."
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" loading={send.pending} onClick={() => send.run({ key: sectionKey, note })}>
              <Undo2 /> {send.pending ? "Sending…" : "Send back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Confirm({
  trigger,
  title,
  description,
  confirm,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirm: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
