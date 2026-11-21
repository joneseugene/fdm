"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PasswordInput } from "@/components/admin/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { routes } from "@/config/routes";
import { useAction } from "@/hooks/use-action";
import { signInAction } from "../actions";
import { loginSchema, type LoginValues } from "../schemas";

export function LoginForm({ next }: { next?: string }) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true, next },
  });
  const signIn = useAction(signInAction, {
    toastErrors: false,
    onError: (e) => {
      form.setValue("password", "");
      form.setError("root", { message: e.message });
    },
  });

  return (
    <Form {...form}>
      <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => signIn.run(v))}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="username" placeholder="you@example.com" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href={routes.forgotPassword}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
              Remember Me
            </label>
          )}
        />
        {form.formState.errors.root && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" loading={signIn.pending}>
          {signIn.pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
