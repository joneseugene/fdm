"use client";

import { useCallback, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import type { ActionError, ActionResult } from "@/lib/result";

type Options<TInput, TOutput, TForm extends FieldValues> = {
  successMessage?: string | ((data: TOutput) => string);
  /** Map server field errors onto this form. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form?: UseFormReturn<TForm, any, any>;
  /** Toast errors that aren't shown on a field. Default true. */
  toastErrors?: boolean;
  onSuccess?: (data: TOutput, input: TInput) => void;
  onError?: (error: ActionError) => void;
};

/** Next's redirect() inside an action rejects with a NEXT_REDIRECT digest: that's success. */
function isRedirect(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * Call a server action from `defineAction` with pending state, toasts and
 * form field errors handled.
 *
 *   const save = useAction(saveAction, { form, successMessage: "Saved" });
 *   form.handleSubmit((values) => save.run(values))
 */
export function useAction<TInput, TOutput, TForm extends FieldValues = FieldValues>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options: Options<TInput, TOutput, TForm> = {},
) {
  const [pending, startTransition] = useTransition();
  const { successMessage, form, toastErrors = true, onSuccess, onError } = options;

  const run = useCallback(
    (input: TInput) =>
      new Promise<TOutput | undefined>((resolve) => {
        startTransition(async () => {
          let result: ActionResult<TOutput>;
          try {
            result = await action(input);
          } catch (error) {
            // The router is already navigating to the redirect target.
            if (!isRedirect(error)) toast.error("Something went wrong. Check your connection and try again.");
            resolve(undefined);
            return;
          }
          if (result === undefined) return resolve(undefined); // redirected

          if (result.ok) {
            if (successMessage) {
              toast.success(typeof successMessage === "function" ? successMessage(result.data) : successMessage);
            }
            onSuccess?.(result.data, input);
            resolve(result.data);
            return;
          }

          let mapped = false;
          if (form && result.error.fieldErrors) {
            for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
              if (field === "_root") continue;
              form.setError(field as Path<TForm>, { type: "server", message: messages[0] });
              mapped = true;
            }
          }
          if (toastErrors && !mapped) toast.error(result.error.message);
          else if (mapped) toast.error("Please fix the highlighted fields.");
          onError?.(result.error);
          resolve(undefined);
        });
      }),
    [action, successMessage, form, toastErrors, onSuccess, onError],
  );

  return { run, pending };
}
