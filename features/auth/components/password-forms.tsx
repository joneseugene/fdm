"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { PasswordInput } from "@/components/admin/password-input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { routes } from "@/config/routes";
import { useAction } from "@/hooks/use-action";
import { changePasswordAction, requestPasswordResetAction, resetPasswordAction } from "../actions";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type ChangePasswordValues,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "../schemas";

const PASSWORD_HINT = "At least 8 characters, with a letter and a number.";

function Done({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <CheckCircle2 className="size-10 text-primary" aria-hidden />
      <p className="font-medium">{title}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const request = useAction(requestPasswordResetAction, { form, onSuccess: () => setSent(true) });

  if (sent) {
    return (
      <Done title="Check your email">
        If an account exists for {form.getValues("email")}, we&apos;ve sent a link to reset the password. It
        expires in 30 minutes.{" "}
        <Link href={routes.login} className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </Done>
    );
  }

  return (
    <Form {...form}>
      <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => request.run(v))}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="username" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={request.pending}>
          {request.pending ? "Sending…" : "Send reset link"}
        </Button>
        <Link href={routes.login} className="text-center text-sm text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </form>
    </Form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const reset = useAction(resetPasswordAction, { form, onSuccess: () => setDone(true) });

  if (done) {
    return (
      <Done title="Your password is set">
        <Button asChild className="mt-2">
          <Link href={routes.login}>Sign in</Link>
        </Button>
      </Done>
    );
  }

  return (
    <Form {...form}>
      <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => reset.run(v))}>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" autoFocus {...field} />
              </FormControl>
              <FormDescription>{PASSWORD_HINT}</FormDescription>
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
        <Button type="submit" disabled={reset.pending}>
          {reset.pending ? "Saving…" : "Set password"}
        </Button>
      </form>
    </Form>
  );
}

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const change = useAction(changePasswordAction, {
    form,
    successMessage: "Password changed. Other devices have been signed out.",
    onSuccess: () => form.reset(),
  });

  return (
    <Form {...form}>
      <form noValidate className="grid max-w-md gap-4" onSubmit={form.handleSubmit((v) => change.run(v))}>
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>{PASSWORD_HINT}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={change.pending} className="w-fit">
          {change.pending ? "Saving…" : "Change password"}
        </Button>
      </form>
    </Form>
  );
}
