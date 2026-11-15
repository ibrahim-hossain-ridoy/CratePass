import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env.ts";

export async function createServerSupabaseClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot mutate response cookies directly during render; middleware/route handlers handle refresh.
        }
      },
    },
  });
}

/**
 * Anonymous cookie-free Supabase client for public RPC queries (e.g. /p/[slug]).
 * Uses anon key only and respects strict RLS / SECURITY DEFINER RPC permissions.
 */
export function createPublicSupabaseClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
