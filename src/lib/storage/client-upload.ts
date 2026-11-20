"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const SPEC_PDFS_BUCKET = "spec-pdfs";
const DEFAULT_MAX_PDF_BYTES = 10 * 1024 * 1024;

export type ClientUploadStage = "signing" | "uploading";

/**
 * Safely read an API response body as JSON, falling back to clear status-based
 * error text when a proxy or runtime returns plain text (e.g., HTTP 413/502/504).
 */
export async function readApiJson<T extends { error?: string }>(
  res: Response,
): Promise<{ data: T | null; errorMessage: string | null }> {
  let rawText = "";
  try {
    rawText = await res.text();
  } catch {
    return {
      data: null,
      errorMessage: res.ok
        ? null
        : `Request failed (HTTP ${res.status}). Please retry.`,
    };
  }

  if (rawText.trim()) {
    try {
      const parsed = JSON.parse(rawText) as T;
      const errMsg =
        parsed && typeof parsed.error === "string" && parsed.error.trim()
          ? parsed.error.trim()
          : null;
      return {
        data: parsed,
        errorMessage: res.ok
          ? null
          : errMsg || `Request failed (HTTP ${res.status}).`,
      };
    } catch {
      // Non-JSON error body from CDN/serverless gateway
    }
  }

  if (res.ok) {
    return { data: null, errorMessage: null };
  }
  if (res.status === 413) {
    return {
      data: null,
      errorMessage:
        "Upload exceeded the server payload limit (HTTP 413). Keep PDFs at or below 10 MB.",
    };
  }
  const snippet = rawText.replace(/\s+/g, " ").trim().slice(0, 180);
  return {
    data: null,
    errorMessage: snippet || `Request failed (HTTP ${res.status}).`,
  };
}

/**
 * Immediate browser-side validation for PDF selection before requesting a signed URL.
 */
export function validateClientPdfFile(
  file: File,
  maxBytes = DEFAULT_MAX_PDF_BYTES,
): string | null {
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  if (file.size <= 0) {
    return "Selected PDF file is empty.";
  }
  if (file.size > maxBytes) {
    return `PDF file exceeds the ${maxMb} MB upload limit.`;
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF files (.pdf) are supported.";
  }
  const mime = (file.type || "").trim().toLowerCase();
  if (
    mime &&
    mime !== "application/pdf" &&
    mime !== "application/x-pdf" &&
    mime !== "application/octet-stream"
  ) {
    return "Invalid file type. Please choose a PDF (.pdf) document.";
  }
  return null;
}

interface SignedUploadResponse {
  signedUrl?: string;
  token?: string;
  path?: string;
  error?: string;
}

/**
 * Request a server-scoped signed upload URL and upload the PDF directly from
 * the browser to Supabase Storage (`spec-pdfs`), bypassing serverless body caps.
 */
export async function uploadPdfViaSignedUrl({
  file,
  signedUrlEndpoint,
  purpose,
  maxBytes = DEFAULT_MAX_PDF_BYTES,
  onStage,
}: {
  file: File;
  signedUrlEndpoint: string;
  purpose?: "spec" | "doc";
  maxBytes?: number;
  onStage?: (stage: ClientUploadStage) => void;
}): Promise<{ storagePath: string; fileName: string }> {
  const clientValidationErr = validateClientPdfFile(file, maxBytes);
  if (clientValidationErr) {
    throw new Error(clientValidationErr);
  }

  onStage?.("signing");
  const signRes = await fetch(signedUrlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: "application/pdf",
      ...(purpose ? { purpose } : {}),
    }),
  });

  const { data: signData, errorMessage: signError } =
    await readApiJson<SignedUploadResponse>(signRes);

  if (!signRes.ok || !signData?.signedUrl || !signData?.token || !signData?.path) {
    throw new Error(
      signError || "Could not initialize direct PDF upload. Please retry.",
    );
  }

  onStage?.("uploading");

  // Ensure the uploaded Blob always carries application/pdf even when OS reports empty file.type
  const pdfBlob =
    file.type === "application/pdf"
      ? file
      : new File([file], file.name, { type: "application/pdf" });

  const env = getSupabasePublicEnv();
  if (env) {
    // Stateless anon storage client avoids stale auth cookie interference on public supplier links
    const storageClient = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const { error: uploadErr } = await storageClient.storage
      .from(SPEC_PDFS_BUCKET)
      .uploadToSignedUrl(signData.path, signData.token, pdfBlob, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) {
      const msg = uploadErr.message || "Direct PDF upload to storage failed.";
      if (/maximum allowed size|payload too large|413/i.test(msg)) {
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        throw new Error(`PDF file exceeds the ${maxMb} MB storage limit.`);
      }
      throw new Error(msg);
    }
  } else {
    const formData = new FormData();
    formData.append("cacheControl", "3600");
    formData.append("", pdfBlob);

    const putRes = await fetch(signData.signedUrl, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body: formData,
    });
    if (!putRes.ok) {
      const { errorMessage } = await readApiJson<{ error?: string; message?: string }>(
        putRes,
      );
      throw new Error(
        errorMessage || `Direct PDF upload failed (HTTP ${putRes.status}).`,
      );
    }
  }

  return {
    storagePath: signData.path,
    fileName: file.name,
  };
}
