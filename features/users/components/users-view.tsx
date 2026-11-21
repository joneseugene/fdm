"use client";

import { useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, MailPlus, MoreHorizontal, Pencil, Send, Trash2, UserCheck, UserPlus, Users as UsersIcon } from "lucide-react";

import { DataView, type DataColumn } from "@/components/admin/data-view";
import { useCurrentUser } from "@/components/admin/session-provider";
import { TimeAgo } from "@/components/admin/time-ago";
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
  inviteUserSchema,
  updateUserSchema,
  type AdminUser,
  type InviteUserValues,
  type UpdateUserValues,
} from "../schemas";

const STATUS: Record<AdminUser["status"], { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
  invited: { label: "Invite sent", className: "bg-sky-600 text-white hover:bg-sky-600" },
  blocked: { label: "Blocked", className: "bg-destructive text-destructive-foreground hover:bg-destructive" },
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

const initials = (u: AdminUser) =>
  `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase() || u.email[0]?.toUpperCase() || "?";

function Avatar({ user }: { user: AdminUser }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-foreground" aria-hidden>
      {initials(user)}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminUser["status"] }) {
  return <Badge className={STATUS[status].className}>{STATUS[status].label}</Badge>;
}

export function UsersView({ users, loadedAt }: { users: AdminUser[]; loadedAt: string }) {
  const me = useCurrentUser();
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState<AdminUser | null>(null);
  const roles = MANAGEABLE_ROLES[me.role];
  const canAdd = roles.length > 0;

  const columns: DataColumn<AdminUser>[] = [
    {
      id: "name",
      header: "Name",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar user={u} />
          <div className="min-w-0">
            <div className="truncate font-medium">{displayName(u)}</div>
            <div className="truncate text-sm text-muted-foreground">{u.email}</div>
          </div>
        </div>
      ),
    },
    { id: "duty", header: "Duty", className: "hidden lg:table-cell", cell: (u) => u.churchRole || <span className="text-muted-foreground">—</span> },
    {
      id: "access",
      header: "Access",
      cell: (u) => (
        <>
          <div>{ROLE_LABELS[u.role]}</div>
          {accessSummary(u) && <div className="text-xs text-muted-foreground">{accessSummary(u)}</div>}
        </>
      ),
    },
    { id: "status", header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
    {
      id: "seen",
      header: "Last sign-in",
      className: "hidden lg:table-cell whitespace-nowrap text-sm text-muted-foreground",
      cell: (u) => <TimeAgo date={u.lastLoginAt} />,
    },
    {
      id: "added",
      header: "Added",
      className: "hidden xl:table-cell whitespace-nowrap text-sm text-muted-foreground",
      cell: (u) => <TimeAgo date={u.createdAt} />,
    },
  ];

  return (
    <>
      <DataView
        rows={users}
        rowKey={(u) => u.id}
        noun={["user", "users"]}
        loadedAt={loadedAt}
        columns={columns}
        searchText={(u) => [displayName(u), u.email, u.churchRole ?? "", ROLE_LABELS[u.role]].join(" ")}
        searchPlaceholder="Search name, email or duty"
        filters={[
          ...(roles.length > 1
            ? [{ id: "role", label: "access levels", options: roles.map((r) => ({ value: r, label: ROLE_LABELS[r] })), match: (u: AdminUser, v: string) => u.role === v }]
            : []),
          {
            id: "status",
            label: "statuses",
            options: (Object.keys(STATUS) as AdminUser["status"][]).map((s) => ({ value: s, label: STATUS[s].label })),
            match: (u, v) => u.status === v,
          },
        ]}
        toolbar={
          canAdd && (
            <Button onClick={() => setInviting(true)}>
              <UserPlus /> <span className="hidden sm:inline">{me.role === "super_admin" ? "Add user" : "Add content manager"}</span>
            </Button>
          )
        }
        empty={
          <Card className="grid justify-items-center gap-2 px-6 py-14 text-center">
            <UsersIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">No one here yet</p>
            <p className="text-sm text-muted-foreground">
              {canAdd ? "Add someone and they'll get an email to set up their account." : "There are no accounts you manage."}
            </p>
          </Card>
        }
        actions={(u) => <UserActions user={u} onEdit={() => setEditing(u)} onRemove={() => setRemoving(u)} />}
        card={(u) => (
          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <Avatar user={u} />
              <div className="min-w-0">
                <div className="truncate font-medium">{displayName(u)}</div>
                <div className="truncate text-sm text-muted-foreground">{u.email}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={u.status} />
              <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
              {u.churchRole && <Badge variant="secondary">{u.churchRole}</Badge>}
            </div>
            {accessSummary(u) && <p className="text-xs text-muted-foreground">{accessSummary(u)}</p>}
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Last sign-in</dt>
                <dd className="font-medium">
                  <TimeAgo date={u.lastLoginAt} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Added</dt>
                <dd className="font-medium">
                  <TimeAgo date={u.createdAt} />
                </dd>
              </div>
            </dl>
          </div>
        )}
      />

      {canAdd && <InviteDialog open={inviting} onOpenChange={setInviting} />}
      {editing && <EditDialog user={editing} onClose={() => setEditing(null)} />}
      {removing && <RemoveDialog user={removing} onClose={() => setRemoving(null)} />}
    </>
  );
}

function UserActions({ user: u, onEdit, onRemove }: { user: AdminUser; onEdit: () => void; onRemove: () => void }) {
  const me = useCurrentUser();
  const resend = useAction(resendInviteAction, { successMessage: `New invite link sent to ${u.email}` });
  const block = useAction(setUserBlockedAction, {
    successMessage: u.status === "blocked" ? "User unblocked" : "User blocked and signed out",
  });
  if (!canManageRole(me, u.role) || u.id === me.id) return null;
  const busy = resend.pending || block.pending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" loading={busy} aria-label={`Actions for ${u.email}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {u.status === "invited" && (
          <DropdownMenuItem disabled={busy} onSelect={() => resend.run({ id: u.id })}>
            <Send /> Resend invite link
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={() => block.run({ id: u.id, blocked: u.status !== "blocked" })}>
          {u.status === "blocked" ? <UserCheck /> : <Ban />} {u.status === "blocked" ? "Unblock" : "Block"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onRemove}>
          <Trash2 /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
            <Input type="text" placeholder="e.g. Pastor, Secretary, Media Lead" autoComplete="off" {...field} />
          </FormControl>
          <FormDescription>Their duty in the church.</FormDescription>
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
              <Button type="submit" loading={invite.pending}>
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
              <Button type="submit" loading={update.pending}>
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
