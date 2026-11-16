export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

/**
 * Normalize Supabase URL to its origin so copying the REST/Data API endpoint
 * (e.g. https://<ref>.supabase.co/rest/v1/) still resolves Auth and Storage routes cleanly.
 */
export function normalizeSupabaseUrl(rawUrl: string | undefined): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed || trimmed.includes("your-project-ref")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Return public Supabase URL and anon key when configured in env.
 * Intentionally ignores SUPABASE_SERVICE_ROLE_KEY so it is safe anywhere.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  if (anonKey.includes("your-supabase-anon-key")) {
    return null;
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}
