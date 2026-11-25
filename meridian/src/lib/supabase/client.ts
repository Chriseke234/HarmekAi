import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns a browser-side Supabase client when environment variables are present,
 * or null in zero-config local preview mode.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createBrowserClient(url, key);
}
