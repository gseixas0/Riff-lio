import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Storage bucket holding the Guitar Pro / MusicXML files. */
export const TAB_BUCKET = "tabs";

/**
 * Single-user app: the anon key is enough for both server and browser, so one
 * client is shared instead of the server/client split @supabase/ssr would need.
 * Returns null when env vars are missing so the UI can show setup instructions
 * instead of crashing on a fresh clone.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;

/** Public URL for a file stored in the tabs bucket. */
export function getTabFileUrl(path: string): string | null {
  if (!supabase) return null;
  // Absolute URLs let us keep tabs outside Storage during local experiments.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return supabase.storage.from(TAB_BUCKET).getPublicUrl(path).data.publicUrl;
}
