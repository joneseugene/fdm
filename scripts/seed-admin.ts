/**
 * Create the first Super Admin (or make an existing user one).
 *
 *   SEED_EMAIL=you@example.com SEED_PASSWORD='…' [SEED_FIRST_NAME=… SEED_LAST_NAME=…] pnpm seed:admin
 *
 * Reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env / .env.local.
 * Idempotent: an existing user keeps their password; only the role is ensured.
 * Church Admins are added from Admin users in the app.
 */
import { createClient } from "@supabase/supabase-js";

import { hashPassword } from "../server/auth/password.ts";

async function main() {
  const env = process.env;
  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SEED_EMAIL", "SEED_PASSWORD"].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(", ")}`);
  const password = env.SEED_PASSWORD!;
  if (password.length < 8) throw new Error("SEED_PASSWORD must be at least 8 characters");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.warn("Warning: this password is weak. Change it after signing in (Admin > Change password).");
  }

  const db = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = env.SEED_EMAIL!.trim().toLowerCase();

  // Resolve the super_admin role id (seeded by the create_roles migration).
  const role = await db.from("roles").select("id").eq("key", "super_admin").maybeSingle();
  if (role.error) throw new Error(`Looking up role (did you run the roles migration?): ${role.error.message}`);
  if (!role.data) throw new Error('Role "super_admin" not found in public.roles');
  const roleId = role.data.id;

  const existing = await db.from("users").select("id").eq("email", email).is("deleted_at", null).maybeSingle();
  if (existing.error) throw new Error(`Looking up user (did you run the migration?): ${existing.error.message}`);

  if (existing.data) {
    const updated = await db.from("users").update({ role_id: roleId }).eq("id", existing.data.id);
    if (updated.error) throw new Error(`Updating user: ${updated.error.message}`);
    console.log(`${email} already exists — made Super Admin, password left unchanged.`);
    return;
  }

  const created = await db.from("users").insert({
    email,
    first_name: env.SEED_FIRST_NAME || "Eugene",
    last_name: env.SEED_LAST_NAME || "Jones",
    role_id: roleId,
    status: "active",
    password_hash: await hashPassword(password),
    password_changed_at: new Date().toISOString(),
  });
  if (created.error) throw new Error(`Creating user: ${created.error.message}`);
  console.log(`Created Super Admin ${email}. Sign in at /login.`);
}

// Let the process exit naturally (process.exit with open sockets trips a libuv assert on Windows).
main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});