"use client";

import { useState } from "react";
import { Mail, MailOpen, MoreHorizontal, Phone, Reply, Trash2 } from "lucide-react";

import { DataView, type DataColumn } from "@/components/admin/data-view";
import { fullDate, TimeAgo } from "@/components/admin/time-ago";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/utils/twMerge";
import { deleteMessageAction, setMessageReadAction } from "../actions";
import type { ContactMessage } from "../schemas";

const replyHref = (m: ContactMessage) => `mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`;

/** Contact form messages: searchable, filterable; click one to read it in full. */
export function MessageList({ messages, loadedAt }: { messages: ContactMessage[]; loadedAt: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);
  const setRead = useAction(setMessageReadAction);
  // Read from the (refreshed) list so the dialog reflects read/unread changes.
  const open = messages.find((m) => m.id === openId) ?? null;

  const view = (m: ContactMessage) => {
    setOpenId(m.id);
    if (!m.readAt) setRead.run({ id: m.id, read: true });
  };

  const columns: DataColumn<ContactMessage>[] = [
    {
      id: "from",
      header: "From",
      className: "w-56",
      cell: (m) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!m.readAt && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
            <span className={cn("truncate", !m.readAt && "font-semibold")}>{m.name}</span>
          </div>
          <div className="truncate text-sm text-muted-foreground">{m.email}</div>
        </div>
      ),
    },
    {
      id: "message",
      header: "Message",
      cell: (m) => <p className={cn("line-clamp-2 max-w-md text-sm", m.readAt ? "text-muted-foreground" : "text-foreground")}>{m.message}</p>,
    },
    {
      id: "received",
      header: "Received",
      className: "whitespace-nowrap text-sm text-muted-foreground",
      cell: (m) => <TimeAgo date={m.createdAt} />,
    },
    {
      id: "status",
      header: "Status",
      className: "hidden lg:table-cell",
      cell: (m) => (m.readAt ? <Badge variant="outline">Read</Badge> : <Badge>New</Badge>),
    },
  ];

  return (
    <>
      <DataView
        rows={messages}
        rowKey={(m) => m.id}
        noun={["message", "messages"]}
        loadedAt={loadedAt}
        columns={columns}
        searchText={(m) => [m.name, m.email, m.phone ?? "", m.message].join(" ")}
        searchPlaceholder="Search name, email or message"
        filters={[
          {
            id: "status",
            label: "messages",
            options: [
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ],
            match: (m, v) => (v === "unread" ? !m.readAt : Boolean(m.readAt)),
          },
        ]}
        onRowClick={view}
        rowClassName={(m) => (m.readAt ? undefined : "bg-accent/30")}
        actions={(m) => <MessageActions message={m} onOpen={() => view(m)} onDelete={() => setDeleting(m)} />}
        empty={
          <Card className="grid justify-items-center gap-2 px-6 py-16 text-center">
            <MailOpen className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm text-muted-foreground">Messages sent through the website&apos;s contact form appear here.</p>
          </Card>
        }
        card={(m) => (
          <div className="grid min-w-0 grid-cols-1 gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("font-medium", !m.readAt && "font-semibold")}>{m.name}</span>
              {!m.readAt && <Badge>New</Badge>}
            </div>
            <div className="truncate text-sm text-muted-foreground">{m.email}</div>
            <p className="line-clamp-3 text-sm">{m.message}</p>
            <TimeAgo date={m.createdAt} className="text-xs text-muted-foreground" />
          </div>
        )}
      />

      <MessageDialog message={open} onClose={() => setOpenId(null)} onDelete={(m) => setDeleting(m)} />
      {deleting && (
        <DeleteDialog
          message={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            if (openId === deleting.id) setOpenId(null);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function MessageActions({ message: m, onOpen, onDelete }: { message: ContactMessage; onOpen: () => void; onDelete: () => void }) {
  const setRead = useAction(setMessageReadAction);
  const unread = !m.readAt;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" loading={setRead.pending} aria-label={`Actions for message from ${m.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpen}>
          <MailOpen /> Open
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={replyHref(m)} onClick={() => unread && setRead.run({ id: m.id, read: true })}>
            <Reply /> Reply by email
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setRead.run({ id: m.id, read: unread })}>
          {unread ? <MailOpen /> : <Mail />} {unread ? "Mark as read" : "Mark as unread"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MessageDialog({
  message: m,
  onClose,
  onDelete,
}: {
  message: ContactMessage | null;
  onClose: () => void;
  onDelete: (m: ContactMessage) => void;
}) {
  const setRead = useAction(setMessageReadAction, { successMessage: "Marked as unread", onSuccess: onClose });
  return (
    <Dialog open={Boolean(m)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="scrollbar-thin max-h-[90svh] overflow-y-auto sm:max-w-xl">
        {m && (
          <>
            <DialogHeader>
              <DialogTitle>{m.name}</DialogTitle>
              <DialogDescription className="grid gap-1">
                <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                  <Mail className="size-3.5" /> {m.email}
                </a>
                {m.phone && (
                  <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="size-3.5" /> {m.phone}
                  </a>
                )}
                <span>
                  {fullDate(m.createdAt)} · <TimeAgo date={m.createdAt} />
                </span>
              </DialogDescription>
            </DialogHeader>
            <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">{m.message}</p>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(m)}>
                <Trash2 /> Delete
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" loading={setRead.pending} onClick={() => setRead.run({ id: m.id, read: false })}>
                  <Mail /> Mark as unread
                </Button>
                <Button asChild>
                  <a href={replyHref(m)}>
                    <Reply /> Reply
                  </a>
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ message, onClose, onDeleted }: { message: ContactMessage; onClose: () => void; onDeleted: () => void }) {
  const remove = useAction(deleteMessageAction, { successMessage: "Message deleted", onSuccess: onDeleted });
  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this message?</AlertDialogTitle>
          <AlertDialogDescription>The message from {message.name} will be removed for good.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={remove.pending}
            onClick={(e) => {
              e.preventDefault();
              remove.run({ id: message.id });
            }}
          >
            {remove.pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
