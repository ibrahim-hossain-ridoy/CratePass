"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env.ts";

export function createBrowserSupabaseClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase environment variables are not configured. Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient(env.url, env.anonKey);
}
