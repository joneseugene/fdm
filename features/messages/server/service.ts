import "server-only";

import { logger } from "@/server/core/logger";
import { check, db, rows } from "@/server/db";
import { sendEmail } from "@/server/email";
import { newMessageEmail } from "@/server/email/templates";
import { serverEnv } from "@/server/env";
import type { ContactMessage } from "../schemas";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

const toMessage = (r: Row): ContactMessage => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  message: r.message,
  readAt: r.read_at,
  createdAt: r.created_at,
});

export const messagesService = {
  async create(input: { name: string; email: string; phone: string; message: string }) {
    check(
      await db()
        .from("contact_messages")
        .insert({ name: input.name, email: input.email, phone: input.phone || null, message: input.message }),
    );
    const to = serverEnv.CONTACT_NOTIFY_EMAIL;
    if (to) {
      // The message is saved either way; the email is only a heads-up.
      await sendEmail({ to, ...newMessageEmail(input) }).catch((error) =>
        logger.error("Contact notification failed", { message: (error as Error)?.message }),
      );
    }
  },

  async list(filter: "all" | "unread" = "all", limit = 200): Promise<ContactMessage[]> {
    let query = db()
      .from("contact_messages")
      .select("id, name, email, phone, message, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filter === "unread") query = query.is("read_at", null);
    return rows(await query.returns<Row[]>()).map(toMessage);
  },

  async unreadCount(): Promise<number> {
    const { count, error } = await db()
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    if (error) return 0;
    return count ?? 0;
  },

  async setRead(id: string, read: boolean) {
    check(
      await db()
        .from("contact_messages")
        .update({ read_at: read ? new Date().toISOString() : null })
        .eq("id", id),
    );
  },

  async remove(id: string) {
    check(await db().from("contact_messages").delete().eq("id", id));
  },
};
