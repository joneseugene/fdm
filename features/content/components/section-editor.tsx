"use client";

import { useEffect } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Save } from "lucide-react";

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
import { Form } from "@/components/ui/form";
import { useAction } from "@/hooks/use-action";
import { resetSectionAction, saveSectionAction } from "../actions";
import { SECTION_META, SECTION_SCHEMAS, type SectionKey } from "../schemas";
import { SECTION_FORMS } from "./section-forms";

/**
 * Edits one page section. Saving publishes immediately: the cached page is
 * expired and the next visitor gets the new version.
 */
export function SectionEditor({
  sectionKey,
  initial,
  isCustomised,
}: {
  sectionKey: SectionKey;
  initial: FieldValues;
  isCustomised: boolean;
}) {
  const form = useForm<FieldValues>({
    // Each section has its own schema; the form is addressed by field path.
    resolver: zodResolver(SECTION_SCHEMAS[sectionKey] as never),
    defaultValues: initial,
    mode: "onTouched",
  });
  const { isDirty } = form.formState;

  const save = useAction(saveSectionAction, {
    successMessage: "Published — the website is updated.",
    onSuccess: (_, input) => form.reset(input.data as FieldValues),
    onError: (error) => {
      // Server field paths are relative to the section ("items.0.title").
      for (const [path, messages] of Object.entries(error.fieldErrors ?? {})) {
        form.setError(path.replace(/^data\./, ""), { type: "server", message: messages[0] });
      }
    },
  });
  const reset = useAction(resetSectionAction, { successMessage: "Restored the original content." });

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const Fields = SECTION_FORMS[sectionKey];

  return (
    <Form {...form}>
      <form
        noValidate
        className="grid gap-6"
        onSubmit={form.handleSubmit(
          (data) => save.run({ key: sectionKey, data }),
          () => {
            // Open the first problem so it's visible.
            requestAnimationFrame(() =>
              document.querySelector<HTMLElement>("[aria-invalid=true]")?.scrollIntoView({ block: "center" }),
            );
          },
        )}
      >
        <Fields />

        <div className="sticky bottom-0 z-20 -mx-4 -mb-4 border-t bg-background/95 backdrop-blur sm:-mx-6 sm:-mb-6">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              {isCustomised && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" disabled={reset.pending || save.pending}>
                      <RotateCcw /> <span className="hidden sm:inline">Restore original</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restore the original {SECTION_META[sectionKey].label.toLowerCase()}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your changes to this section are replaced by the website&apos;s original content. This
                        can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => reset.run({ key: sectionKey })}>Restore</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline" aria-live="polite">
                {isDirty ? "Unsaved changes" : "All changes published"}
              </span>
              {isDirty && (
                <Button type="button" variant="outline" onClick={() => form.reset()} disabled={save.pending}>
                  Discard
                </Button>
              )}
              <Button type="submit" disabled={!isDirty || save.pending}>
                <Save /> {save.pending ? "Publishing…" : "Save & publish"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
