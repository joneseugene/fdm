"use client";

import { useState } from "react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, MailPlus, MoreHorizontal, Pencil, Send, Trash2, UserCheck, UserPlus } from "lucide-react";

import { useCurrentUser } from "@/components/admin/session-provider";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from "@/config/access";
import { useAction } from "@/hooks/use-action";
import {
  inviteUserAction,
  removeUserAction,
  resendInviteAction,
  setUserBlockedAction,
  updateUserAction,
} from "../actions";
import {
  displayName,
  inviteUserSchema,
  updateUserSchema,
  type AdminUser,
  type InviteUserValues,
  type UpdateUserValues,
} from "../schemas";

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso)) : "Never";

const STATUS: Record<AdminUser["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  invited: { label: "Awaiting code", variant: "secondary" },
  blocked: { label: "Blocked", variant: "destructive" },
};

export function UsersView({ users }: { users: AdminUser[] }) {
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState<AdminUser | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setInviting(true)}>
          <UserPlus /> Add church admin
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Access</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} onEdit={() => setEditing(u)} onRemove={() => setRemoving(u)} />
            ))}
          </TableBody>
        </Table>
      </Card>

      <InviteDialog open={inviting} onOpenChange={setInviting} />
      {editing && <EditDialog user={editing} onClose={() => setEditing(null)} />}
      {removing && <RemoveDialog user={removing} onClose={() => setRemoving(null)} />}
    </>
  );
}

function UserRow({ user: u, onEdit, onRemove }: { user: AdminUser; onEdit: () => void; onRemove: () => void }) {
  const me = useCurrentUser();
  const isMe = me.id === u.id;
  const joined = u.status !== "invited" || Boolean(u.firstName);
  const resend = useAction(resendInviteAction, { successMessage: `New code sent to ${u.email}` });
  const block = useAction(setUserBlockedAction, {
    successMessage: u.status === "blocked" ? "User unblocked" : "User blocked and signed out",
  });

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {joined ? displayName(u) : <span className="text-muted-foreground">Not joined yet</span>}{" "}
          {isMe && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
        </div>
        <div className="text-sm text-muted-foreground">
          {u.email}
          {u.churchRole && <> · {u.churchRole}</>}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{ROLE_LABELS[u.role]}</TableCell>
      <TableCell>
        <Badge variant={STATUS[u.status].variant}>{STATUS[u.status].label}</Badge>
      </TableCell>
      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{formatDate(u.lastLoginAt)}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${u.email}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {u.status === "invited" && (
              <DropdownMenuItem disabled={resend.pending} onSelect={() => resend.run({ id: u.id })}>
                <Send /> Resend code
              </DropdownMenuItem>
            )}
            {u.status !== "invited" && (
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
            )}
            {!isMe && (
              <>
                <DropdownMenuItem
                  disabled={block.pending}
                  onSelect={() => block.run({ id: u.id, blocked: u.status !== "blocked" })}
                >
                  {u.status === "blocked" ? <UserCheck /> : <Ban />} {u.status === "blocked" ? "Unblock" : "Block"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onRemove}>
                  <Trash2 /> Remove
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function RoleField({ control }: { control: Control<{ role: Role }> }) {
  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Access</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>{ROLE_DESCRIPTIONS[field.value]}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const form = useForm<InviteUserValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", role: "church_admin" },
  });
  const invite = useAction(inviteUserAction, {
    form,
    successMessage: (r) =>
      r.emailSent
        ? "Added. A confirmation code has been emailed to them."
        : "Added, but the email couldn't be sent. Check Email settings, then use “Resend code”.",
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a church admin</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a 6-digit code. After confirming it, they set up their name, role in church
            and password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => invite.run(v))}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <RoleField control={form.control as unknown as Control<{ role: Role }>} />
            <DialogFooter>
              <Button type="submit" disabled={invite.pending}>
                <MailPlus /> {invite.pending ? "Sending…" : "Send code"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const form = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      otherName: user.otherName ?? "",
      churchRole: user.churchRole ?? "",
      role: user.role,
    },
  });
  const update = useAction(updateUserAction, { form, successMessage: "User updated", onSuccess: onClose });

  const text = (name: "firstName" | "lastName" | "otherName" | "churchRole", label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {displayName(user)}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => update.run(v))}>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("firstName", "First name")}
              {text("lastName", "Last name")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("otherName", "Other name")}
              {text("churchRole", "Role in church")}
            </div>
            <RoleField control={form.control as unknown as Control<{ role: Role }>} />
            <DialogFooter>
              <Button type="submit" disabled={update.pending}>
                {update.pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const remove = useAction(removeUserAction, { successMessage: "User removed", onSuccess: onClose });
  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {displayName(user)}?</AlertDialogTitle>
          <AlertDialogDescription>
            They&apos;ll be signed out and can no longer access the admin. You can add them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={remove.pending}
            onClick={(e) => {
              e.preventDefault();
              remove.run({ id: user.id });
            }}
          >
            {remove.pending ? "Removing…" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
