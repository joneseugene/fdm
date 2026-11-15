"use client";

import { Mail, MailOpen, Phone, Reply, Trash2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/utils/twMerge";
import { deleteMessageAction, setMessageReadAction } from "../actions";
import type { ContactMessage } from "../schemas";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function MessageList({ messages }: { messages: ContactMessage[] }) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="grid justify-items-center gap-2 py-16 text-center">
          <MailOpen className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No messages here</p>
          <p className="text-sm text-muted-foreground">Messages sent through the website&apos;s contact form appear here.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-3">
      {messages.map((m) => (
        <MessageCard key={m.id} message={m} />
      ))}
    </div>
  );
}

function MessageCard({ message: m }: { message: ContactMessage }) {
  const setRead = useAction(setMessageReadAction);
  const remove = useAction(deleteMessageAction, { successMessage: "Message deleted" });
  const unread = !m.readAt;

  return (
    <Card className={cn(unread && "border-primary/60 bg-accent/40")}>
      <CardContent className="grid gap-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{m.name}</span>
              {unread && <Badge>New</Badge>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Mail className="size-3.5" /> {m.email}
              </a>
              {m.phone && (
                <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Phone className="size-3.5" /> {m.phone}
                </a>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a
              href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`}
              onClick={() => unread && setRead.run({ id: m.id, read: true })}
            >
              <Reply /> Reply
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={setRead.pending}
            onClick={() => setRead.run({ id: m.id, read: unread })}
          >
            {unread ? <MailOpen /> : <Mail />} {unread ? "Mark as read" : "Mark as unread"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={remove.pending}>
                <Trash2 /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                <AlertDialogDescription>The message from {m.name} will be removed for good.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => remove.run({ id: m.id })}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
