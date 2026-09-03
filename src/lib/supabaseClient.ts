import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Attach the client to globalThis to prevent duplicate instances during HMR
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient>;
};

export const supabase =
  globalForSupabase.supabase || createClient(supabaseUrl, supabaseAnonKey);

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}