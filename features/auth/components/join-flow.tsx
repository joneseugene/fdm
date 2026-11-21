"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle } from "lucide-react";

import { PasswordInput } from "@/components/admin/password-input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/utils/twMerge";
import { acceptInvitationAction } from "../actions";
import { acceptInviteSchema, type AcceptInviteValues } from "../schemas";

export type InvitationSummary = {
  name: string;
  email: string;
  roleLabel: string;
  duty: string | null;
};

/** Reached from the invitation email: choose a password to activate the account. */
export function JoinFlow({ token, invitation }: { token: string; invitation: InvitationSummary }) {
  const form = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const accept = useAction(acceptInvitationAction, { form });
  const [password, confirm] = useWatch({ control: form.control, name: ["password", "confirmPassword"] });

  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "A letter", ok: /[A-Za-z]/.test(password) },
    { label: "A number", ok: /\d/.test(password) },
    { label: "Passwords match", ok: password.length > 0 && password === confirm },
  ];

  return (
    <div className="grid gap-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl border bg-muted/40 p-4 text-sm">
        <dt className="text-muted-foreground">Name</dt>
        <dd className="truncate font-medium">{invitation.name}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="truncate font-medium">{invitation.email}</dd>
        <dt className="text-muted-foreground">Access</dt>
        <dd className="truncate font-medium">{invitation.roleLabel}</dd>
        {invitation.duty && (
          <>
            <dt className="text-muted-foreground">Duty</dt>
            <dd className="truncate font-medium">{invitation.duty}</dd>
          </>
        )}
      </dl>

      <Form {...form}>
        <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => accept.run(v))}>
          {/* Lets password managers save the login under the right email. */}
          <input type="email" name="username" autoComplete="username" value={invitation.email} readOnly hidden />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs" aria-label="Password requirements">
            {checks.map((c) => (
              <li
                key={c.label}
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  c.ok ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {c.ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}
                {c.label}
                <span className="sr-only">{c.ok ? "(done)" : "(not yet)"}</span>
              </li>
            ))}
          </ul>

          <Button type="submit" loading={accept.pending}>
            {accept.pending ? "Activating…" : "Activate my account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
