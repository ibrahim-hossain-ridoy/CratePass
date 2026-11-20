import { createHash, randomBytes } from "node:crypto";
import {
  BATTERY_FIELD_MAP,
  STATIC_BATTERY_FIELDS,
} from "../../config/battery-fields.ts";
import { sanitizeFieldValue } from "../passport-projection.ts";

export const SUPPLIER_TOKEN_TTL_DAYS = 14;

const STATIC_FIELD_KEY_SET = new Set(STATIC_BATTERY_FIELDS.map((f) => f.key));

/** Generate a cryptographically random URL-safe token and its SHA-256 hex digest. */
export function generateSupplierToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: hashSupplierToken(rawToken),
  };
}

/** Deterministic SHA-256 hex digest used for database lookup (raw tokens are never stored). */
export function hashSupplierToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim()).digest("hex");
}

/** Validate rough format of incoming URL token before hashing/querying. */
export function isValidSupplierTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(token.trim());
}

export function computeSupplierExpiryIso(
  nowMs: number = Date.now(),
  ttlDays: number = SUPPLIER_TOKEN_TTL_DAYS,
): string {
  return new Date(nowMs + ttlDays * 24 * 60 * 60 * 1000).toISOString();
}

export type SupplierRequestStatus = "open" | "submitted" | "merged" | "revoked";

export interface SupplierTokenCheckResult {
  actionable: boolean;
  reason?: "revoked" | "already_submitted" | "merged" | "expired";
}

export function checkSupplierRequestActionable({
  status,
  expiresAt,
  nowMs = Date.now(),
}: {
  status: SupplierRequestStatus;
  expiresAt: string;
  nowMs?: number;
}): SupplierTokenCheckResult {
  if (status === "revoked") {
    return { actionable: false, reason: "revoked" };
  }
  if (status === "merged") {
    return { actionable: false, reason: "merged" };
  }
  if (status === "submitted") {
    return { actionable: false, reason: "already_submitted" };
  }
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs <= nowMs) {
    return { actionable: false, reason: "expired" };
  }
  return { actionable: true };
}

/** Keep only valid static battery field keys (never dynamic BMS keys or arbitrary keys). */
export function filterValidStaticFieldKeys(keys: readonly string[]): string[] {
  const unique = new Set<string>();
  for (const key of keys) {
    if (STATIC_FIELD_KEY_SET.has(key)) {
      unique.add(key);
    }
  }
  return [...unique];
}

/** Sanitize a supplier submission strictly against the requested static keys. */
export function sanitizeSupplierSubmission(
  requestedFieldKeys: readonly string[],
  rawPayload: Record<string, unknown>,
): Record<string, string> {
  const allowed = new Set(filterValidStaticFieldKeys(requestedFieldKeys));
  const clean: Record<string, string> = {};

  for (const key of allowed) {
    const def = BATTERY_FIELD_MAP[key];
    if (!def) continue;
    const maxChars = def.maxChars ?? 4000;
    const sanitized = sanitizeFieldValue(rawPayload[key], maxChars);
    if (sanitized) {
      clean[key] = sanitized;
    }
  }

  return clean;
}

export interface SupplierDiffRow {
  key: string;
  pointNumber?: number;
  label: string;
  unit?: string;
  currentValue: string;
  submittedValue: string;
  changed: boolean;
}

export function computeSupplierDiff(
  currentWorkingFields: Record<string, string>,
  submittedPayload: Record<string, string>,
): SupplierDiffRow[] {
  const rows: SupplierDiffRow[] = [];
  for (const [key, submittedValue] of Object.entries(submittedPayload)) {
    const def = BATTERY_FIELD_MAP[key];
    if (!def || def.source !== "static") continue;
    const currentValue = (currentWorkingFields[key] ?? "").trim();
    const cleanSub = submittedValue.trim();
    if (!cleanSub) continue;
    rows.push({
      key,
      pointNumber: def.pointNumber,
      label: def.label,
      unit: def.unit,
      currentValue,
      submittedValue: cleanSub,
      changed: currentValue !== cleanSub,
    });
  }
  return rows.sort((a, b) => (a.pointNumber ?? 999) - (b.pointNumber ?? 999));
}
