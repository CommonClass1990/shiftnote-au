// ============================================================================
// ShiftNote AU - Supabase Browser Client (@supabase/ssr)
// ============================================================================

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
