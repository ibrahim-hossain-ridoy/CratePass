export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

/**
 * Return public Supabase URL and anon key when configured in env.
 * Intentionally ignores SUPABASE_SERVICE_ROLE_KEY so it is safe anywhere.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  if (url.includes("your-project-ref") || anonKey.includes("your-supabase-anon-key")) {
    return null;
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}
