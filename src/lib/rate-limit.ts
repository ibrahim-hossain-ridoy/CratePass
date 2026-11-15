import { createAdminSupabaseClient } from "./supabase/admin.ts";

interface BucketState {
  windowStartMs: number;
  count: number;
}

const memoryBuckets = new Map<string, BucketState>();

function checkMemoryRateLimit(
  key: string,
  maxHits: number,
  windowSeconds: number,
): boolean {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  const windowMs = windowSeconds * 1000;

  if (!existing || existing.windowStartMs + windowMs <= now) {
    memoryBuckets.set(key, { windowStartMs: now, count: 1 });
    return true;
  }

  existing.count += 1;
  return existing.count <= maxHits;
}

/**
 * Enforce distributed rate limit using Postgres check_rate_limit RPC when service key
 * is configured, falling back to process-local memory limit in local mock development.
 */
export async function enforceRateLimit(
  key: string,
  maxHits: number,
  windowSeconds: number,
): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return checkMemoryRateLimit(key, maxHits, windowSeconds);
  }

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    return checkMemoryRateLimit(key, maxHits, windowSeconds);
  }
  return Boolean(data);
}
