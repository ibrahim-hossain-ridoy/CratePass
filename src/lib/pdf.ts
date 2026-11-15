import { createHash } from "node:crypto";
import { extractText } from "unpdf";

export interface PdfValidationInput {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  maxBytes: number;
}

const MAX_EXTRACTED_CHARS = 48_000;

/**
 * Validate uploaded PDF server-side: non-empty, <= maxBytes, .pdf extension,
 * safe MIME type, and actual `%PDF-` header signature.
 */
export function validatePdfUpload({
  bytes,
  mimeType,
  fileName,
  maxBytes,
}: PdfValidationInput): void {
  if (!bytes || bytes.byteLength === 0) {
    throw new Error("Uploaded PDF file is empty.");
  }
  if (bytes.byteLength > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`PDF exceeds the ${limitMb} MB size limit.`);
  }

  const normalizedName = fileName.trim().toLowerCase();
  if (!normalizedName.endsWith(".pdf")) {
    throw new Error("Only .pdf files are allowed.");
  }

  const normalizedMime = mimeType.trim().toLowerCase();
  if (
    normalizedMime &&
    normalizedMime !== "application/pdf" &&
    normalizedMime !== "application/x-pdf" &&
    normalizedMime !== "application/octet-stream"
  ) {
    throw new Error("Invalid file MIME type; expected application/pdf.");
  }

  const headerSlice = Buffer.from(bytes.subarray(0, 64))
    .toString("latin1")
    .replace(/^\uFEFF/, "")
    .trimStart();
  if (!headerSlice.startsWith("%PDF-")) {
    throw new Error("Invalid PDF signature; uploaded bytes do not start with %PDF-.");
  }
}

export function computeSha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export interface ExtractedPdfText {
  text: string;
  totalPages: number;
  characterCount: number;
  truncated: boolean;
}

export async function extractPdfText(bytes: Uint8Array): Promise<ExtractedPdfText> {
  const result = await extractText(new Uint8Array(bytes), { mergePages: true });
  const rawText = Array.isArray(result.text)
    ? result.text.join("\n")
    : String(result.text ?? "");

  // Strip ASCII control bytes other than newline and tab
  const cleaned = rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\r\n?/g, "\n")
    .trim();

  const truncated = cleaned.length > MAX_EXTRACTED_CHARS;
  const bounded = truncated ? cleaned.slice(0, MAX_EXTRACTED_CHARS) : cleaned;

  return {
    text: bounded,
    totalPages: typeof result.totalPages === "number" ? result.totalPages : 1,
    characterCount: cleaned.length,
    truncated,
  };
}
