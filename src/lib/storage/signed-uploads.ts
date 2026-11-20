import { randomUUID } from "node:crypto";
import { siteConfig } from "../../config/site.ts";
import { validatePdfUpload } from "../pdf.ts";

export const SPEC_PDFS_BUCKET = "spec-pdfs";
export const MAX_PDF_UPLOAD_BYTES = siteConfig.maxUploadBytes;

export type PdfUploadPurpose = "spec" | "doc" | "supplier";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_CAPTURE =
  "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";

export class SignedUploadValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SignedUploadValidationError";
    this.status = status;
  }
}

export function sanitizePdfFileName(
  rawName: unknown,
  fallback = "document.pdf",
): string {
  const str = typeof rawName === "string" ? rawName.trim() : "";
  const cleaned = str.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
  if (!cleaned || !cleaned.toLowerCase().endsWith(".pdf")) {
    return fallback;
  }
  return cleaned;
}

/**
 * Validate metadata before minting a direct-to-Supabase signed upload URL.
 * Strictly requires `.pdf` filename, `application/pdf` MIME type, and `1..maxBytes`.
 */
export function validateSignedUploadRequest({
  fileName,
  fileSize,
  mimeType,
  maxBytes = MAX_PDF_UPLOAD_BYTES,
}: {
  fileName: unknown;
  fileSize: unknown;
  mimeType: unknown;
  maxBytes?: number;
}): { safeFileName: string; fileSize: number; mimeType: "application/pdf" } {
  const limitMb = Math.round(maxBytes / (1024 * 1024));

  if (typeof fileName !== "string" || !fileName.trim()) {
    throw new SignedUploadValidationError("A PDF file name is required.", 400);
  }
  if (!fileName.trim().toLowerCase().endsWith(".pdf")) {
    throw new SignedUploadValidationError("Only .pdf files are allowed.", 400);
  }

  const parsedSize =
    typeof fileSize === "number" ? fileSize : Number.NaN;
  if (!Number.isFinite(parsedSize) || parsedSize <= 0) {
    throw new SignedUploadValidationError(
      "Uploaded PDF file size must be greater than 0 bytes.",
      400,
    );
  }
  if (parsedSize > maxBytes) {
    throw new SignedUploadValidationError(
      `PDF file exceeds the ${limitMb} MB upload limit.`,
      413,
    );
  }

  const normalizedMime =
    typeof mimeType === "string" ? mimeType.trim().toLowerCase() : "";
  if (normalizedMime !== "application/pdf") {
    throw new SignedUploadValidationError(
      "Invalid file MIME type; expected application/pdf.",
      400,
    );
  }

  return {
    safeFileName: sanitizePdfFileName(fileName, "document.pdf"),
    fileSize: Math.floor(parsedSize),
    mimeType: "application/pdf",
  };
}

/**
 * Generate a strictly UUID-scoped object path inside the private `spec-pdfs` bucket.
 */
export function buildScopedPdfStoragePath({
  purpose,
  orgId,
  requestId,
  fileId,
}: {
  purpose: PdfUploadPurpose;
  orgId: string;
  requestId?: string;
  fileId?: string;
}): string {
  if (!UUID_REGEX.test(orgId)) {
    throw new SignedUploadValidationError("Invalid workspace identifier.", 400);
  }

  const id = fileId ?? randomUUID();
  if (!UUID_REGEX.test(id)) {
    throw new SignedUploadValidationError("Invalid file identifier.", 400);
  }

  if (purpose === "spec") {
    return `${orgId}/${id}.pdf`;
  }
  if (purpose === "doc") {
    return `${orgId}/doc/${id}.pdf`;
  }
  if (!requestId || !UUID_REGEX.test(requestId)) {
    throw new SignedUploadValidationError("Invalid supplier request identifier.", 400);
  }
  return `${orgId}/supplier/${requestId}/${id}.pdf`;
}

/**
 * Strictly verify that a client-supplied `storagePath` belongs to the authorized
 * workspace (and supplier request, when applicable) and matches the strict UUID `.pdf` layout.
 */
export function isAuthorizedScopedPdfPath({
  storagePath,
  purpose,
  orgId,
  requestId,
}: {
  storagePath: unknown;
  purpose: PdfUploadPurpose;
  orgId: string;
  requestId?: string;
}): boolean {
  if (typeof storagePath !== "string" || !storagePath || !UUID_REGEX.test(orgId)) {
    return false;
  }
  if (
    storagePath.includes("..") ||
    storagePath.includes("\\") ||
    storagePath.includes("//") ||
    storagePath.includes("?") ||
    storagePath.includes("#") ||
    storagePath.startsWith("/") ||
    !storagePath.startsWith(`${orgId}/`)
  ) {
    return false;
  }

  const escapedOrg = orgId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (purpose === "spec") {
    return new RegExp(`^${escapedOrg}/${UUID_CAPTURE}\\.pdf$`, "i").test(
      storagePath,
    );
  }
  if (purpose === "doc") {
    return new RegExp(`^${escapedOrg}/doc/${UUID_CAPTURE}\\.pdf$`, "i").test(
      storagePath,
    );
  }
  if (!requestId || !UUID_REGEX.test(requestId)) {
    return false;
  }
  const escapedReq = requestId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^${escapedOrg}/supplier/${escapedReq}/${UUID_CAPTURE}\\.pdf$`,
    "i",
  ).test(storagePath);
}

/** Extract the final UUID segment from a validated scoped `.pdf` path. */
export function extractUuidFromScopedPdfPath(storagePath: string): string | null {
  const match = new RegExp(`/${UUID_CAPTURE}\\.pdf$`, "i").exec(storagePath);
  return match ? match[1] : null;
}

export interface PdfStorageBlobLike {
  size?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface PdfStorageBucketAdapter {
  download(
    path: string,
  ): Promise<{ data: PdfStorageBlobLike | null; error: { message?: string } | null }>;
  remove(paths: string[]): Promise<{ error?: { message?: string } | null }>;
}

async function safeRemoveStoredObject(
  storageBucket: PdfStorageBucketAdapter,
  storagePath: string,
): Promise<void> {
  try {
    await storageBucket.remove([storagePath]);
  } catch {
    // Best-effort cleanup on validation failure
  }
}

/**
 * Download an object uploaded via signed URL, verify its size ceiling BEFORE buffering
 * and verify its `%PDF-` magic-byte header, deleting the object immediately if invalid.
 */
export async function downloadAndValidateStoredPdf({
  storageBucket,
  storagePath,
  fileName,
  maxBytes = MAX_PDF_UPLOAD_BYTES,
}: {
  storageBucket: PdfStorageBucketAdapter;
  storagePath: string;
  fileName?: string;
  maxBytes?: number;
}): Promise<{ bytes: Uint8Array }> {
  const limitMb = Math.round(maxBytes / (1024 * 1024));
  const { data, error } = await storageBucket.download(storagePath);

  if (error || !data) {
    throw new SignedUploadValidationError(
      "Uploaded PDF was not found in private storage. Please upload again.",
      400,
    );
  }

  if (typeof data.size === "number" && data.size > maxBytes) {
    await safeRemoveStoredObject(storageBucket, storagePath);
    throw new SignedUploadValidationError(
      `PDF exceeds the ${limitMb} MB size limit.`,
      413,
    );
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  const safeName = sanitizePdfFileName(fileName, "document.pdf");

  try {
    validatePdfUpload({
      bytes,
      mimeType: "application/pdf",
      fileName: safeName,
      maxBytes,
    });
  } catch (err) {
    await safeRemoveStoredObject(storageBucket, storagePath);
    const msg = err instanceof Error ? err.message : "Invalid PDF upload.";
    const status = /exceeds the \d+ MB/i.test(msg) ? 413 : 400;
    throw new SignedUploadValidationError(msg, status);
  }

  return { bytes };
}
