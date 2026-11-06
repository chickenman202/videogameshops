import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

/** Public read client. Uses the full Database type, not the public slice. */
export function createReadClient(): SupabaseClient<Database> | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Server-only client for saving contact and store submissions.
 * The secret key never belongs in a NEXT_PUBLIC variable.
 */
export function createServiceClient(): SupabaseClient<Database> | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
