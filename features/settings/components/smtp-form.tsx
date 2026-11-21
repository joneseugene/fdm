"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send } from "lucide-react";

import { PasswordInput } from "@/components/admin/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/hooks/use-action";
import { saveSmtpSettingsAction, sendTestEmailAction } from "../actions";
import { smtpSettingsSchema, type SmtpSettingsValues, type SmtpSettingsView } from "../schemas";

export function SmtpForm({ settings, myEmail }: { settings: SmtpSettingsView; myEmail: string }) {
  const form = useForm<SmtpSettingsValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      enabled: settings.enabled,
      host: settings.host,
      port: settings.port,
      user: settings.user,
      password: "",
      fromName: settings.fromName,
      fromEmail: settings.fromEmail,
    },
  });
  const enabled = useWatch({ control: form.control, name: "enabled" });
  const save = useAction(saveSmtpSettingsAction, { form, successMessage: "Email settings saved" });
  const [testTo, setTestTo] = useState(myEmail);
  const test = useAction(sendTestEmailAction, { successMessage: `Test email sent to ${testTo}. Check the inbox (and spam).` });

  const text = (
    name: "host" | "user" | "fromName" | "fromEmail",
    label: string,
    extra?: { description?: string; placeholder?: string; type?: string },
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={extra?.type} placeholder={extra?.placeholder} {...field} />
          </FormControl>
          {extra?.description && <FormDescription>{extra.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form noValidate className="grid gap-6" onSubmit={form.handleSubmit((v) => save.run(v))}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SMTP account</CardTitle>
              <CardDescription>
                Used for invitation codes and password resets. Gmail: host <code>smtp.gmail.com</code>, port 465, your
                Gmail address, and a 16-character App Password (Google Account → Security → 2-Step Verification → App
                passwords) — not your normal password.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="grid gap-1">
                      <FormLabel>Send email with this account</FormLabel>
                      <FormDescription>When off, emails are only written to the server log.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                {text("host", "SMTP host", { placeholder: "smtp.gmail.com" })}
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          {...field}
                          value={String(field.value ?? "")}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>465 or 587</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {text("user", "Username", { placeholder: "you@gmail.com", description: "Usually your full email address." })}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder={settings.hasPassword ? "•••••••• (saved — leave blank to keep)" : ""}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Stored encrypted. It is never shown again.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sender</CardTitle>
              <CardDescription>How emails appear in people&apos;s inboxes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {text("fromName", "Sender name")}
              {text("fromEmail", "Sender address", {
                type: "email",
                description: "Leave blank to use the username. Gmail only allows addresses your account owns.",
              })}
            </CardContent>
          </Card>

          <Button type="submit" className="w-fit" loading={save.pending}>
            <Save /> {save.pending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send a test email</CardTitle>
          <CardDescription>Uses the saved settings, exactly as invitations will.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-60 flex-1 gap-2">
            <Label htmlFor="test-to">Send to</Label>
            <Input id="test-to" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          </div>
          <Button
            type="button"
            variant="outline"
            loading={test.pending}
            disabled={!enabled || form.formState.isDirty}
            onClick={() => test.run({ to: testTo })}
          >
            <Send /> {test.pending ? "Sending…" : "Send test"}
          </Button>
          {form.formState.isDirty && <p className="w-full text-xs text-muted-foreground">Save your changes first.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
