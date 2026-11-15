import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env.ts";

/**
 * Server-only Supabase admin client using SUPABASE_SERVICE_ROLE_KEY.
 * MUST NEVER be imported or executed inside client components.
 */
export function createAdminSupabaseClient() {
  if (typeof window !== "undefined") {
    throw new Error("Admin Supabase client cannot run in a browser context.");
  }

  const env = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (
    !env ||
    !serviceRoleKey ||
    serviceRoleKey.includes("your-supabase-service-role-key")
  ) {
    return null;
  }

  return createClient(env.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
