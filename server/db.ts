import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { fromDbError } from "@/server/core/errors";
import { requireEnv } from "@/server/env";

let client: SupabaseClient | undefined;

/**
 * Server-side Supabase client using the secret (service-role) key.
 *
 * Auth is native (not Supabase Auth), so RLS cannot identify the caller.
 * Every table has RLS enabled with no policies (the public key can read
 * nothing) and all access goes through this server-only client after the
 * app's own permission checks. Never import this into client code.
 */
export function db(): SupabaseClient {
  client ??= createClient(
    requireEnv("SUPABASE_URL", "database"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", "database"),
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  return client;
}

type DbResult<T> = { data: T | null; error: { code?: string; message: string } | null };

/** Unwrap a Supabase response, translating errors into AppError. */
export function check<T>(result: DbResult<T>): T | null {
  if (result.error) throw fromDbError(result.error);
  return result.data;
}

/** For `.single()` calls: a successful response always carries a row. */
export function one<T>(result: DbResult<T>): T {
  const data = check(result);
  if (data === null) throw new Error("Expected a row but got none");
  return data;
}

/** For list calls: treat a null payload as no rows. */
export const rows = <T>(result: DbResult<T[]>): T[] => check(result) ?? [];
