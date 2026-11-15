"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import { PasswordInput } from "@/components/admin/password-input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/ui/pin-input";
import { useAction } from "@/hooks/use-action";
import { completeJoinAction, verifyInviteCodeAction } from "../actions";
import { INVITE_CODE_LENGTH, joinProfileSchema, type JoinProfileValues } from "../schemas";

/**
 * Accepting an invitation:
 *   1. enter the 6-digit code from the email (submits when the last digit is typed)
 *   2. name, other name, role in church and password — then straight into the admin
 */
export function JoinFlow({ initialEmail, confirmedEmail }: { initialEmail: string; confirmedEmail: string | null }) {
  const [step, setStep] = useState<"code" | "profile">(confirmedEmail ? "profile" : "code");
  const [email, setEmail] = useState(confirmedEmail ?? initialEmail);

  return step === "code" ? (
    <CodeStep
      email={email}
      onEmailChange={setEmail}
      emailLocked={Boolean(initialEmail)}
      onConfirmed={() => setStep("profile")}
    />
  ) : (
    <ProfileStep email={email} />
  );
}

function CodeStep({
  email,
  onEmailChange,
  emailLocked,
  onConfirmed,
}: {
  email: string;
  onEmailChange: (email: string) => void;
  emailLocked: boolean;
  onConfirmed: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verify = useAction(verifyInviteCodeAction, {
    toastErrors: false,
    onSuccess: onConfirmed,
    onError: (e) => {
      setCode("");
      setError(e.fieldErrors?.code ? e.message : (e.fieldErrors?.email?.[0] ?? e.message));
    },
  });

  function submit(value = code) {
    if (verify.pending || value.length !== INVITE_CODE_LENGTH) return;
    setError(null);
    verify.run({ email: email.trim(), code: value });
  }

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm">
        <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          We emailed a 6-digit code to{" "}
          {emailLocked ? <span className="font-semibold">{email}</span> : "your address"}. Enter it below to confirm
          it&apos;s you.
        </p>
      </div>

      {!emailLocked && (
        <div className="grid gap-2">
          <Label htmlFor="join-email">Email</Label>
          <Input
            id="join-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label className="justify-self-center">Confirmation code</Label>
        <PinInput
          length={INVITE_CODE_LENGTH}
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(null);
          }}
          onComplete={submit}
          autoFocus={emailLocked}
          invalid={Boolean(error)}
          disabled={verify.pending || !email.trim()}
          aria-label="Confirmation code"
        />
        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <Button type="submit" disabled={verify.pending || code.length !== INVITE_CODE_LENGTH}>
        {verify.pending ? "Checking…" : "Confirm"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Didn&apos;t get it? Check spam, or ask your Super Admin to resend the code.
      </p>
    </form>
  );
}

function ProfileStep({ email }: { email: string }) {
  const form = useForm<JoinProfileValues>({
    resolver: zodResolver(joinProfileSchema),
    defaultValues: { firstName: "", lastName: "", otherName: "", churchRole: "", password: "", confirmPassword: "" },
  });
  const complete = useAction(completeJoinAction, { form });

  const text = (name: "firstName" | "lastName" | "otherName" | "churchRole", label: string, extra?: { description?: string; placeholder?: string; autoComplete?: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={extra?.placeholder} autoComplete={extra?.autoComplete} {...field} />
          </FormControl>
          {extra?.description && <FormDescription>{extra.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => complete.run(v))}>
        <p className="rounded-lg bg-muted/60 p-3 text-sm">
          Email confirmed{email ? <> — <span className="font-semibold">{email}</span></> : ""}. Now set up your account.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("firstName", "First name", { autoComplete: "given-name" })}
          {text("lastName", "Last name", { autoComplete: "family-name" })}
        </div>
        {text("otherName", "Other name (optional)", { autoComplete: "additional-name" })}
        {text("churchRole", "Role in church", { placeholder: "e.g. Pastor, Secretary, Media Lead" })}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>At least 8 characters, with a letter and a number.</FormDescription>
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
        <Button type="submit" disabled={complete.pending}>
          {complete.pending ? "Setting up…" : "Create my account"}
        </Button>
      </form>
    </Form>
  );
}
