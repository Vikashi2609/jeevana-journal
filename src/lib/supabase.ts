/**
 * Client for the EXISTING Jeevana Journal Supabase project.
 *
 * Read-only usage in this phase: see `legacyJournal.ts` for the only query
 * that currently runs against it (journal_entries). No writes, no schema
 * changes, no service-role key here or anywhere in frontend code.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once both env vars are present. Callers should check this before querying. */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  // Non-fatal: the rest of the app (local IndexedDB journals) works fine
  // without Supabase. Only the legacy Supabase view needs this.
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — " +
      "the Supabase-backed legacy journal view will be unavailable.",
  );
}

// Preserve a single instance across Vite HMR reloads in development
const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};

export const supabase =
  globalForSupabase.supabase ??
  (supabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null);

if (import.meta.env.DEV && supabase) {
  globalForSupabase.supabase = supabase;
}