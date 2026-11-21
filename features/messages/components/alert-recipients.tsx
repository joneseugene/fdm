"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { addAlertRecipientAction, removeAlertRecipientAction } from "../actions";
import { alertRecipientSchema, type AlertRecipientValues } from "../schemas";

/** Manage who gets an email for each contact form message. */
export function AlertRecipients({ emails }: { emails: string[] }) {
  const form = useForm<AlertRecipientValues>({
    resolver: zodResolver(alertRecipientSchema),
    defaultValues: { email: "" },
  });
  const add = useAction(addAlertRecipientAction, {
    form,
    successMessage: "Address added",
    onSuccess: () => form.reset({ email: "" }),
  });
  const remove = useAction(removeAlertRecipientAction, { successMessage: "Address removed" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="size-4" aria-hidden /> Email alerts
        </CardTitle>
        <CardDescription>
          These addresses get an email whenever someone sends a message through the contact form.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {emails.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one gets alerts yet. Messages still appear below.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <li
                key={email}
                className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 py-1 pl-3 pr-1 text-sm"
              >
                <span className="truncate">{email}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-6 rounded-full"
                  disabled={remove.pending}
                  onClick={() => remove.run({ email })}
                  aria-label={`Stop sending alerts to ${email}`}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Form {...form}>
          <form
            noValidate
            className="flex flex-wrap items-start gap-2"
            onSubmit={form.handleSubmit((values) => add.run(values))}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="min-w-60 flex-1">
                  <FormLabel className="sr-only">Email address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="outline" disabled={add.pending}>
              <Plus /> {add.pending ? "Adding…" : "Add address"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
