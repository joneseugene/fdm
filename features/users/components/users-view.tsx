"use client";

import { useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageRole, MANAGEABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/config/access";
import { ADMIN_SECTION_ORDER, SECTION_META } from "@/features/content/schemas";
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
  DUTY_SUGGESTIONS,
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
  invited: { label: "Invite sent", variant: "secondary" },
  blocked: { label: "Blocked", variant: "destructive" },
};

/** "All sections · Can publish", "Hero · Needs review", … for a Content Manager. */
function accessSummary(u: Pick<AdminUser, "role" | "contentSections" | "canPublish">) {
  if (u.role !== "content_manager") return null;
  const s = u.contentSections;
  const scope =
    s === null
      ? "All sections"
      : s.length === 1
        ? (SECTION_META[s[0] as keyof typeof SECTION_META]?.label ?? "1 section")
        : `${s.length} sections`;
  return `${scope} · ${u.canPublish ? "Can publish" : "Needs review"}`;
}

export function UsersView({ users }: { users: AdminUser[] }) {
  const me = useCurrentUser();
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState<AdminUser | null>(null);
  const canAdd = MANAGEABLE_ROLES[me.role].length > 0;

  return (
    <>
      {canAdd && (
        <div className="flex justify-end">
          <Button onClick={() => setInviting(true)}>
            <UserPlus /> {me.role === "super_admin" ? "Add user" : "Add content manager"}
          </Button>
        </div>
      )}

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

      {canAdd && <InviteDialog open={inviting} onOpenChange={setInviting} />}
      {editing && <EditDialog user={editing} onClose={() => setEditing(null)} />}
      {removing && <RemoveDialog user={removing} onClose={() => setRemoving(null)} />}
    </>
  );
}

function UserRow({ user: u, onEdit, onRemove }: { user: AdminUser; onEdit: () => void; onRemove: () => void }) {
  const me = useCurrentUser();
  const isMe = me.id === u.id;
  const manageable = canManageRole(me, u.role);
  const access = accessSummary(u);
  const resend = useAction(resendInviteAction, { successMessage: `New invite link sent to ${u.email}` });
  const block = useAction(setUserBlockedAction, {
    successMessage: u.status === "blocked" ? "User unblocked" : "User blocked and signed out",
  });

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {displayName(u)} {isMe && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
        </div>
        <div className="text-sm text-muted-foreground">
          {u.email}
          {u.churchRole && <> · {u.churchRole}</>}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <div>{ROLE_LABELS[u.role]}</div>
        {access && <div className="text-xs text-muted-foreground">{access}</div>}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS[u.status].variant}>{STATUS[u.status].label}</Badge>
      </TableCell>
      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{formatDate(u.lastLoginAt)}</TableCell>
      <TableCell>
        {manageable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${u.email}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {u.status === "invited" && (
                <DropdownMenuItem disabled={resend.pending} onSelect={() => resend.run({ id: u.id })}>
                  <Send /> Resend invite link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
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
        )}
      </TableCell>
    </TableRow>
  );
}

// ---------- Shared fields ----------

type AccessFields = { role: Role; contentAccess: "all" | "some"; contentSections: string[]; canPublish: boolean };

/** Access level: only the roles the signed-in admin may hand out. */
function RoleField({ control }: { control: Control<AccessFields> }) {
  const me = useCurrentUser();
  const roles = MANAGEABLE_ROLES[me.role];
  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Access</FormLabel>
          <Select value={field.value} onValueChange={field.onChange} disabled={roles.length < 2}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {roles.map((r) => (
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

/** For Content Managers: all sections, or a chosen few. */
function ContentAccessField({ control }: { control: Control<AccessFields> }) {
  const [role, access] = useWatch({ control, name: ["role", "contentAccess"] });
  if (role !== "content_manager") return null;

  return (
    <div className="grid gap-3 rounded-xl border bg-muted/30 p-4">
      <FormField
        control={control}
        name="contentAccess"
        render={({ field }) => (
          <FormItem className="grid gap-2">
            <FormLabel>Content they can edit</FormLabel>
            <FormControl>
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["all", "All sections"],
                    ["some", "Only specific sections"],
                  ] as const
                ).map(([value, label]) => (
                  <Label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background p-3 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/40"
                  >
                    <RadioGroupItem value={value} /> {label}
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />
      {access === "some" && (
        <FormField
          control={control}
          name="contentSections"
          render={({ field }) => {
            const selected = new Set(field.value);
            const toggle = (key: string, on: boolean) =>
              field.onChange(ADMIN_SECTION_ORDER.filter((k) => (k === key ? on : selected.has(k))));
            return (
              <FormItem className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selected.size} of {ADMIN_SECTION_ORDER.length} selected
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => field.onChange(selected.size ? [] : [...ADMIN_SECTION_ORDER])}
                  >
                    {selected.size ? "Clear" : "Select all"}
                  </Button>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {ADMIN_SECTION_ORDER.map((key) => (
                    <Label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 font-normal hover:bg-background"
                    >
                      <Checkbox checked={selected.has(key)} onCheckedChange={(v) => toggle(key, v === true)} />
                      {SECTION_META[key].label}
                    </Label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}
      <FormField
        control={control}
        name="canPublish"
        render={({ field }) => (
          <FormItem className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3">
            <div className="grid gap-1">
              <FormLabel>Can publish without review</FormLabel>
              <FormDescription>
                Off: they save drafts and send them for review; an admin publishes. On: they can publish directly.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

/** Free-text duty with common suggestions. */
function DutyField({ control }: { control: Control<{ churchRole: string }> }) {
  return (
    <FormField
      control={control}
      name="churchRole"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Duty</FormLabel>
          <FormControl>
            <Input list="duty-suggestions" placeholder="e.g. Pastor, Secretary, Media Lead" autoComplete="off" {...field} />
          </FormControl>
          <datalist id="duty-suggestions">
            {DUTY_SUGGESTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          <FormDescription>Their duty in the church. Pick one or type your own.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------- Dialogs ----------

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const me = useCurrentUser();
  const roles = MANAGEABLE_ROLES[me.role];
  const defaults: InviteUserValues = {
    firstName: "",
    lastName: "",
    otherName: "",
    email: "",
    role: roles.includes("church_admin") ? "church_admin" : roles[0],
    churchRole: "",
    contentAccess: "all",
    contentSections: [],
    canPublish: false,
  };
  const form = useForm<InviteUserValues>({ resolver: zodResolver(inviteUserSchema), defaultValues: defaults });
  const invite = useAction(inviteUserAction, {
    form,
    successMessage: (r) =>
      r.emailSent
        ? "User added. An invite link has been emailed to them."
        : "User added, but the email couldn't be sent. Check Email settings, then use “Resend invite link”.",
    onSuccess: () => {
      form.reset(defaults);
      onOpenChange(false);
    },
  });

  const text = (name: "firstName" | "lastName" | "otherName", label: string, autoFocus?: boolean) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input autoFocus={autoFocus} autoComplete="off" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollbar-thin max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{me.role === "super_admin" ? "Add a user" : "Add a content manager"}</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link to choose their password and activate their account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => invite.run(v))}>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("firstName", "First name", true)}
              {text("lastName", "Last name")}
            </div>
            {text("otherName", "Other name (optional)")}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DutyField control={form.control as unknown as Control<{ churchRole: string }>} />
            <RoleField control={form.control as unknown as Control<AccessFields>} />
            <ContentAccessField control={form.control as unknown as Control<AccessFields>} />
            <DialogFooter>
              <Button type="submit" disabled={invite.pending}>
                <MailPlus /> {invite.pending ? "Sending…" : "Send invite link"}
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
      contentAccess: user.contentSections === null ? "all" : "some",
      contentSections: user.contentSections ?? [],
      canPublish: user.role === "content_manager" && user.canPublish,
    },
  });
  const update = useAction(updateUserAction, { form, successMessage: "User updated", onSuccess: onClose });

  const text = (name: "firstName" | "lastName" | "otherName", label: string) => (
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
      <DialogContent className="scrollbar-thin max-h-[90svh] overflow-y-auto sm:max-w-lg">
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
            {text("otherName", "Other name")}
            <DutyField control={form.control as unknown as Control<{ churchRole: string }>} />
            <RoleField control={form.control as unknown as Control<AccessFields>} />
            <ContentAccessField control={form.control as unknown as Control<AccessFields>} />
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
