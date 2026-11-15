"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { sendContactMessageAction } from "@/features/messages/actions";

const field =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

export function ContactForm({ successMessage }: { successMessage: string }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit: NonNullable<React.ComponentProps<"form">["onSubmit"]> = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => String(data.get(k) ?? "");
    setErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await sendContactMessageAction({
        name: value("name"),
        email: value("email"),
        phone: value("phone"),
        message: value("message"),
        website: value("website"),
      });
      if (result.ok) {
        form.reset();
        setSent(true);
      } else if (result.error.fieldErrors) {
        setErrors(result.error.fieldErrors);
      } else {
        setFormError(result.error.message);
      }
    });
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden />
        <p className="text-base font-medium text-foreground" role="status">
          {successMessage}
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const error = (k: string) =>
    errors[k]?.[0] ? <p className="mt-1 text-xs text-destructive">{errors[k]?.[0]}</p> : null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <input name="name" required placeholder="Full name" aria-label="Full name" autoComplete="name" className={field} />
          {error("name")}
        </div>
        <div>
          <input
            name="email"
            required
            type="email"
            placeholder="Email address"
            aria-label="Email address"
            autoComplete="email"
            className={field}
          />
          {error("email")}
        </div>
      </div>
      <div>
        <input name="phone" type="tel" placeholder="Phone number" aria-label="Phone number" autoComplete="tel" className={field} />
        {error("phone")}
      </div>
      <div>
        <textarea name="message" required rows={5} placeholder="Your message" aria-label="Your message" className={field} />
        {error("message")}
      </div>
      {/* Honeypot: invisible to people, tempting to bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60 sm:w-auto"
      >
        <Send className="h-4 w-4" />
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
