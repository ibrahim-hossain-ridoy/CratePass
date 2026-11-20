import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  SPEC_PDFS_BUCKET,
  SignedUploadValidationError,
  buildScopedPdfStoragePath,
  validateSignedUploadRequest,
} from "@/lib/storage/signed-uploads";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  checkSupplierRequestActionable,
  hashSupplierToken,
  isValidSupplierTokenFormat,
  type SupplierRequestStatus,
} from "@/lib/supplier/tokens";

/**
 * Token-gated direct-to-Supabase signed upload URL generator for supplier magic links.
 * Validates SHA-256 token_hash, status === 'open', expires_at > now, and 10 MB PDF cap.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token || !isValidSupplierTokenFormat(token)) {
    return NextResponse.json({ error: "Invalid supplier link." }, { status: 404 });
  }

  const tokenHash = hashSupplierToken(token);
  const allowed = await enforceRateLimit(
    `supplier-signed-url:${tokenHash.slice(0, 16)}`,
    15,
    60,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many upload attempts. Wait a minute and retry." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supplier portal service is not configured." },
      { status: 503 },
    );
  }

  const { data: reqRow, error: lookupErr } = await admin
    .from("supplier_requests")
    .select("id, workspace_id, status, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (lookupErr || !reqRow) {
    return NextResponse.json({ error: "Supplier request not found." }, { status: 404 });
  }

  const check = checkSupplierRequestActionable({
    status: reqRow.status as SupplierRequestStatus,
    expiresAt: String(reqRow.expires_at),
  });
  if (!check.actionable) {
    return NextResponse.json(
      {
        error:
          check.reason === "expired"
            ? "This supplier link has expired."
            : check.reason === "revoked"
              ? "This supplier link was revoked."
              : "This supplier request has already been submitted.",
        reason: check.reason,
      },
      { status: 410 },
    );
  }

  let body: {
    fileName?: unknown;
    fileSize?: unknown;
    mimeType?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    validateSignedUploadRequest({
      fileName: body.fileName,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      maxBytes: siteConfig.maxUploadBytes,
    });
  } catch (err) {
    if (err instanceof SignedUploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Invalid PDF attachment." }, { status: 400 });
  }

  const path = buildScopedPdfStoragePath({
    purpose: "supplier",
    orgId: String(reqRow.workspace_id),
    requestId: String(reqRow.id),
  });

  const { data, error } = await admin.storage
    .from(SPEC_PDFS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl || !data?.token) {
    return NextResponse.json(
      { error: "Failed to initialize direct supplier PDF upload." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path || path,
  });
}
