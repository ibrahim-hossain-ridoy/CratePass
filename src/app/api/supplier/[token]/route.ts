import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { BATTERY_FIELD_MAP } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { validatePdfUpload } from "@/lib/pdf";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  SPEC_PDFS_BUCKET,
  SignedUploadValidationError,
  downloadAndValidateStoredPdf,
  isAuthorizedScopedPdfPath,
  sanitizePdfFileName,
} from "@/lib/storage/signed-uploads";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeSupplierLocale } from "@/lib/supplier/i18n-zh";
import {
  checkSupplierRequestActionable,
  hashSupplierToken,
  isValidSupplierTokenFormat,
  sanitizeSupplierSubmission,
  type SupplierRequestStatus,
} from "@/lib/supplier/tokens";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token || !isValidSupplierTokenFormat(token)) {
    return NextResponse.json({ error: "Invalid supplier link." }, { status: 404 });
  }

  const tokenHash = hashSupplierToken(token);
  const allowed = await enforceRateLimit(
    `supplier-get:${tokenHash.slice(0, 16)}`,
    60,
    60,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Wait a moment and retry." },
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

  const { data: reqRow, error } = await admin
    .from("supplier_requests")
    .select(
      "id, passport_id, supplier_name, requested_field_keys, default_locale, status, expires_at, submitted_at, passports ( slug, battery_category, products ( name, model_code ) )",
    )
    .eq("token_hash", tokenHash)
    .single();

  if (error || !reqRow) {
    return NextResponse.json({ error: "Supplier request not found." }, { status: 404 });
  }

  const check = checkSupplierRequestActionable({
    status: reqRow.status as SupplierRequestStatus,
    expiresAt: String(reqRow.expires_at),
  });

  const passportRel = Array.isArray(reqRow.passports)
    ? reqRow.passports[0]
    : reqRow.passports;
  const productRel = passportRel
    ? Array.isArray(passportRel.products)
      ? passportRel.products[0]
      : passportRel.products
    : null;

  const requestedKeys = Array.isArray(reqRow.requested_field_keys)
    ? (reqRow.requested_field_keys as string[])
    : [];

  const requestedFields = requestedKeys
    .map((key) => BATTERY_FIELD_MAP[key])
    .filter((f): f is NonNullable<typeof f> => Boolean(f && f.source === "static"))
    .map((f) => ({
      key: f.key,
      pointNumber: f.pointNumber,
      label: f.label,
      tier: f.tier,
      type: f.type,
      unit: f.unit,
      placeholder: f.placeholder,
    }));

  return NextResponse.json({
    actionable: check.actionable,
    reason: check.reason ?? null,
    status: reqRow.status,
    defaultLocale: normalizeSupplierLocale(reqRow.default_locale),
    supplierName: reqRow.supplier_name || "",
    productName: productRel?.name ? String(productRel.name) : "Battery Pack",
    modelCode: productRel?.model_code ? String(productRel.model_code) : "",
    expiresAt: reqRow.expires_at,
    requestedFields,
  });
}

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
    `supplier-post:${tokenHash.slice(0, 16)}`,
    15,
    60,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submission attempts. Wait a minute and retry." },
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
    .select(
      "id, workspace_id, passport_id, supplier_name, requested_field_keys, status, expires_at",
    )
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

  let rawFields: Record<string, unknown> = {};
  let attachedFile: File | null = null;
  let supplierContactNote = "";
  let requestedStoragePath = "";
  let requestedFileName = "";

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart form submission." },
        { status: 400 },
      );
    }

    const fieldsJson = String(formData.get("fields") ?? "{}");
    try {
      const parsed = JSON.parse(fieldsJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        rawFields = parsed as Record<string, unknown>;
      }
    } catch {
      return NextResponse.json(
        { error: "Malformed fields payload." },
        { status: 400 },
      );
    }

    supplierContactNote = String(formData.get("supplierName") ?? "")
      .trim()
      .slice(0, 160);

    const fileEntry = formData.get("document");
    if (fileEntry instanceof File && fileEntry.size > 0) {
      if (fileEntry.size > siteConfig.maxUploadBytes) {
        return NextResponse.json(
          { error: "Attached PDF exceeds the 10 MB file size limit." },
          { status: 413 },
        );
      }
      attachedFile = fileEntry;
    }
  } else {
    try {
      const json = (await request.json()) as {
        fields?: Record<string, unknown>;
        supplierName?: string;
        storagePath?: unknown;
        fileName?: unknown;
      };
      if (json.fields && typeof json.fields === "object") {
        rawFields = json.fields;
      }
      if (typeof json.supplierName === "string") {
        supplierContactNote = json.supplierName.trim().slice(0, 160);
      }
      if (typeof json.storagePath === "string") {
        requestedStoragePath = json.storagePath.trim();
      }
      if (typeof json.fileName === "string") {
        requestedFileName = json.fileName.trim();
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
  }

  const requestedKeys = Array.isArray(reqRow.requested_field_keys)
    ? (reqRow.requested_field_keys as string[])
    : [];
  const sanitizedPayload = sanitizeSupplierSubmission(requestedKeys, rawFields);

  if (
    Object.keys(sanitizedPayload).length === 0 &&
    !attachedFile &&
    !requestedStoragePath
  ) {
    return NextResponse.json(
      { error: "Provide at least one requested specification or upload a PDF document." },
      { status: 400 },
    );
  }

  let uploadedDocPath: string | null = null;
  if (requestedStoragePath) {
    if (
      !isAuthorizedScopedPdfPath({
        storagePath: requestedStoragePath,
        purpose: "supplier",
        orgId: String(reqRow.workspace_id),
        requestId: String(reqRow.id),
      })
    ) {
      return NextResponse.json(
        { error: "Invalid or unauthorized supplier document path." },
        { status: 400 },
      );
    }

    try {
      await downloadAndValidateStoredPdf({
        storageBucket: admin.storage.from(SPEC_PDFS_BUCKET),
        storagePath: requestedStoragePath,
        fileName: sanitizePdfFileName(requestedFileName, "supplier-doc.pdf"),
        maxBytes: siteConfig.maxUploadBytes,
      });
    } catch (err) {
      if (err instanceof SignedUploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      return NextResponse.json(
        { error: "Invalid PDF attachment." },
        { status: 400 },
      );
    }
    uploadedDocPath = requestedStoragePath;
  } else if (attachedFile) {
    const bytes = new Uint8Array(await attachedFile.arrayBuffer());
    try {
      validatePdfUpload({
        bytes,
        mimeType: attachedFile.type || "",
        fileName: attachedFile.name || "supplier-doc.pdf",
        maxBytes: siteConfig.maxUploadBytes,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid PDF attachment." },
        { status: 400 },
      );
    }

    const storagePath = `${reqRow.workspace_id}/supplier/${reqRow.id}/${randomUUID()}.pdf`;

    const { error: storageErr } = await admin.storage
      .from(SPEC_PDFS_BUCKET)
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageErr) {
      return NextResponse.json(
        { error: "Failed to store uploaded supplier PDF document." },
        { status: 500 },
      );
    }
    uploadedDocPath = storagePath;
  }

  const submittedAt = new Date().toISOString();
  const updateBody: Record<string, unknown> = {
    status: "submitted",
    submitted_payload: sanitizedPayload,
    uploaded_doc_path: uploadedDocPath,
    submitted_at: submittedAt,
  };
  if (supplierContactNote && !reqRow.supplier_name) {
    updateBody.supplier_name = supplierContactNote;
  }

  const { data: updatedRows, error: updateErr } = await admin
    .from("supplier_requests")
    .update(updateBody)
    .eq("id", reqRow.id)
    .eq("status", "open")
    .gt("expires_at", submittedAt)
    .select("id");

  if (updateErr || !updatedRows || updatedRows.length === 0) {
    if (uploadedDocPath) {
      await admin.storage.from(SPEC_PDFS_BUCKET).remove([uploadedDocPath]);
    }
    return NextResponse.json(
      { error: "Could not save submission; this link may have already been submitted." },
      { status: 409 },
    );
  }

  await admin.from("audit_log").insert({
    org_id: reqRow.workspace_id,
    actor_user_id: null,
    action: "supplier_submission_received",
    target_type: "supplier_request",
    target_id: reqRow.id,
    metadata: {
      passport_id: reqRow.passport_id,
      submitted_field_count: Object.keys(sanitizedPayload).length,
      has_pdf_attachment: Boolean(uploadedDocPath),
    },
  });

  return NextResponse.json({
    ok: true,
    submittedFieldCount: Object.keys(sanitizedPayload).length,
    hasDocument: Boolean(uploadedDocPath),
  });
}
