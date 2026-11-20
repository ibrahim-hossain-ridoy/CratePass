import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { sanitizeFieldValue } from "../passport-projection.ts";

export type ServiceRole = "repairer" | "recycler";
export type DynamicLifecycleStatus =
  | "original"
  | "repaired"
  | "repurposed"
  | "waste";

/**
 * Compute a workspace-salted SHA-256 hash of a dealer/repairer service PIN.
 * Raw PINs are never persisted in the database.
 */
export function hashServicePin(workspaceId: string, rawPin: string): string {
  return createHash("sha256")
    .update(`${workspaceId.trim().toLowerCase()}:${rawPin.trim()}`, "utf8")
    .digest("hex");
}

/** Constant-time verification of a submitted service PIN against a stored SHA-256 hash. */
export function verifyServicePin(
  workspaceId: string,
  submittedPin: string,
  storedPinHash: string,
): boolean {
  if (!submittedPin || !storedPinHash || storedPinHash.length !== 64) {
    return false;
  }
  const candidateHex = hashServicePin(workspaceId, submittedPin);
  const candidateBuf = Buffer.from(candidateHex, "hex");
  const expectedBuf = Buffer.from(storedPinHash, "hex");
  if (candidateBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(candidateBuf, expectedBuf);
}

/** Generate a new Pro workspace REST API key (`cp_live_...`), returning raw key once + SHA-256 hash. */
export function generateWorkspaceApiKey(): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const secret = randomBytes(24).toString("hex");
  const rawKey = `cp_live_${secret}`;
  return {
    rawKey,
    keyPrefix: rawKey.slice(0, 14),
    keyHash: hashWorkspaceApiKey(rawKey),
  };
}

export function hashWorkspaceApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey.trim(), "utf8").digest("hex");
}

export const DynamicBmsEntrySchema = z.object({
  stateOfHealthPct: z.number().min(0).max(100).optional().nullable(),
  cycleCount: z.number().int().min(0).max(1_000_000).optional().nullable(),
  internalResistanceMohm: z.number().min(0).max(1_000_000).optional().nullable(),
  lifecycleStatus: z
    .enum(["original", "repaired", "repurposed", "waste"])
    .default("original"),
  notes: z.string().max(2000).optional().default(""),
  serialNumber: z.string().trim().max(120).optional().nullable(),
});

export type DynamicBmsEntryInput = z.infer<typeof DynamicBmsEntrySchema>;

export function sanitizeDynamicBmsNotes(raw: string): string {
  return sanitizeFieldValue(raw, 2000);
}

/** Escape PostgreSQL LIKE/ILIKE wildcard characters (`\`, `%`, `_`) so lookups match literally. */
export function escapePostgresLikePattern(raw: string): string {
  return raw.replace(/[\\%_]/g, "\\$&");
}
