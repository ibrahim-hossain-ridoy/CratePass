import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  isValidBatteryCategory,
  type BatteryCategory,
} from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { checkDailyExtractionEntitlement } from "@/lib/entitlements";
import {
  extractBatteryFieldsFromText,
  resolveExtractionProvider,
} from "@/lib/extractor";
import { normalizeFieldValues } from "@/lib/passport-projection";
import { computeSha256Hex, extractPdfText, validatePdfUpload } from "@/lib/pdf";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  SPEC_PDFS_BUCKET,
  SignedUploadValidationError,
  downloadAndValidateStoredPdf,
  extractUuidFromScopedPdfPath,
  isAuthorizedScopedPdfPath,
  sanitizePdfFileName,
} from "@/lib/storage/signed-uploads";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { slugifyPassportName } from "@/lib/workspace/helpers";

export const maxDuration = 60;

export async function POST(request: Request) {
  const ctx = await getWorkspaceContext();
  if (ctx.state === "unconfigured") {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 },
    );
  }
  if (ctx.state === "unauthenticated") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (ctx.state === "error") {
    return NextResponse.json({ error: ctx.message }, { status: 500 });
  }

  // Per-user sliding-window rate limit
  const allowedByUserRate = await enforceRateLimit(
    `extract:user:${ctx.user.id}`,
    siteConfig.userExtractionRateLimit.maxRequests,
    siteConfig.userExtractionRateLimit.windowSeconds,
  );
  if (!allowedByUserRate) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Wait a minute before running another PDF extraction.",
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database session unavailable." },
      { status: 503 },
    );
  }

  // Per-organization daily cap (Free: 5/day, Pro: unlimited)
  const { data: dailyCountRaw, error: dailyErr } = await supabase.rpc(
    "get_org_daily_extraction_count",
    { p_org_id: ctx.org.orgId },
  );
  if (dailyErr) {
    return NextResponse.json(
      { error: "Failed to check organization daily extraction quota." },
      { status: 500 },
    );
  }
  const dailyCount = typeof dailyCountRaw === "number" ? dailyCountRaw : 0;
  const extractionEntitlement = checkDailyExtractionEntitlement({
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
    dailyUsed: dailyCount,
  });
  if (!extractionEntitlement.allowed) {
    return NextResponse.json(
      {
        error: `Daily AI PDF limit reached (${extractionEntitlement.limit ?? siteConfig.dailyExtractionLimitPerOrg} PDFs/day on Free plan). Upgrade to Pro (€79/mo) for unlimited PDF checks, use Blank Draft mode, or try again tomorrow.`,
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 429 },
    );
  }

  const storageClient = createAdminSupabaseClient() ?? supabase;
  const contentType = request.headers.get("content-type") || "";

  let bytes: Uint8Array;
  let uploadId: string;
  let safeFilename: string;
  let storagePath: string;
  let productNameOverride = "";
  let batteryCategory: BatteryCategory = "LMT";

  if (contentType.includes("application/json")) {
    let body: {
      storagePath?: unknown;
      fileName?: unknown;
      productName?: unknown;
      batteryCategory?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    productNameOverride = String(body.productName ?? "").trim().slice(0, 160);
    const rawCategory = String(body.batteryCategory ?? "LMT").trim();
    batteryCategory = isValidBatteryCategory(rawCategory) ? rawCategory : "LMT";

    const requestedPath =
      typeof body.storagePath === "string" ? body.storagePath.trim() : "";
    if (
      !isAuthorizedScopedPdfPath({
        storagePath: requestedPath,
        purpose: "spec",
        orgId: ctx.org.orgId,
      })
    ) {
      return NextResponse.json(
        { error: "Invalid or unauthorized PDF storage path." },
        { status: 400 },
      );
    }

    const parsedUploadId = extractUuidFromScopedPdfPath(requestedPath);
    if (!parsedUploadId) {
      return NextResponse.json(
        { error: "Invalid PDF storage identifier." },
        { status: 400 },
      );
    }

    safeFilename = sanitizePdfFileName(body.fileName, "datasheet.pdf");
    try {
      const validated = await downloadAndValidateStoredPdf({
        storageBucket: storageClient.storage.from(SPEC_PDFS_BUCKET),
        storagePath: requestedPath,
        fileName: safeFilename,
        maxBytes: siteConfig.maxUploadBytes,
      });
      bytes = validated.bytes;
    } catch (err) {
      if (err instanceof SignedUploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      return NextResponse.json(
        { error: "Failed to validate uploaded PDF from storage." },
        { status: 400 },
      );
    }

    uploadId = parsedUploadId;
    storagePath = requestedPath;
  } else {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart form submission." },
        { status: 400 },
      );
    }

    const fileEntry = formData.get("file");
    productNameOverride = String(formData.get("productName") ?? "")
      .trim()
      .slice(0, 160);
    const rawCategory = String(formData.get("batteryCategory") ?? "LMT").trim();
    batteryCategory = isValidBatteryCategory(rawCategory) ? rawCategory : "LMT";

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: "Attach a PDF specification file under field 'file'." },
        { status: 400 },
      );
    }

    if (fileEntry.size > siteConfig.maxUploadBytes) {
      return NextResponse.json(
        { error: "PDF file exceeds the 10 MB upload limit." },
        { status: 413 },
      );
    }

    bytes = new Uint8Array(await fileEntry.arrayBuffer());
    try {
      validatePdfUpload({
        bytes,
        mimeType: fileEntry.type || "",
        fileName: fileEntry.name || "datasheet.pdf",
        maxBytes: siteConfig.maxUploadBytes,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid PDF upload." },
        { status: 400 },
      );
    }

    uploadId = randomUUID();
    safeFilename = sanitizePdfFileName(fileEntry.name, "datasheet.pdf");
    storagePath = `${ctx.org.orgId}/${uploadId}.pdf`;

    const { error: uploadStorageErr } = await storageClient.storage
      .from(SPEC_PDFS_BUCKET)
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadStorageErr) {
      return NextResponse.json(
        { error: "Failed to store PDF in private workspace storage." },
        { status: 500 },
      );
    }
  }

  const sha256 = computeSha256Hex(bytes);

  // Record upload BEFORE calling extractor so quota reflects attempted extractions
  const { error: insertUploadErr } = await supabase.from("uploads").insert({
    id: uploadId,
    org_id: ctx.org.orgId,
    uploaded_by: ctx.user.id,
    original_filename: safeFilename,
    storage_path: storagePath,
    file_size_bytes: bytes.byteLength,
    sha256,
    extraction_status: "pending",
  });

  if (insertUploadErr) {
    if (insertUploadErr.code === "23505") {
      return NextResponse.json(
        { error: "This uploaded PDF has already been processed." },
        { status: 409 },
      );
    }
    await storageClient.storage.from(SPEC_PDFS_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: "Failed to record PDF upload metadata." },
      { status: 500 },
    );
  }

  const providerSelection = resolveExtractionProvider();

  try {
    let parsedPdf = {
      text: "",
      totalPages: 0,
      characterCount: 0,
      truncated: false,
    };
    let textExtractFailed = false;
    try {
      parsedPdf = await extractPdfText(bytes);
    } catch (pdfErr) {
      textExtractFailed = true;
      console.error("[extract] unpdf text extraction failed:", {
        uploadId,
        orgId: ctx.org.orgId,
        provider: providerSelection.provider,
        fileSizeBytes: bytes.byteLength,
        error: pdfErr instanceof Error ? pdfErr.message : String(pdfErr),
      });
      if (providerSelection.provider !== "gemini") {
        throw pdfErr;
      }
    }

    const extraction = await extractBatteryFieldsFromText(
      parsedPdf.text,
      safeFilename,
      { pdfBytes: bytes },
    );
    const lowTextWarning =
      !textExtractFailed &&
      parsedPdf.characterCount < 40 &&
      extraction.summary.found === 0;

    const workingFields: Record<string, string> = {};
    for (const [key, item] of Object.entries(extraction.fields)) {
      if (item.value) {
        workingFields[key] = item.value;
      }
    }
    if (!workingFields.battery_category) {
      workingFields.battery_category = batteryCategory;
    }
    const cleanWorkingFields = normalizeFieldValues(workingFields);

    const finalProductName =
      productNameOverride ||
      extraction.productName ||
      safeFilename.replace(/\.pdf$/i, "") ||
      "Battery Pack";
    const finalModelCode =
      extraction.modelCode || cleanWorkingFields.model_serial_number || "";

    const slug = `${slugifyPassportName(finalProductName)}-${randomBytes(3).toString("hex")}`;

    const { data: productRow, error: productErr } = await supabase
      .from("products")
      .insert({
        org_id: ctx.org.orgId,
        name: finalProductName,
        model_code: finalModelCode,
      })
      .select("id")
      .single();

    if (productErr || !productRow) {
      throw new Error("Could not create product record.");
    }

    let passportInsert = await supabase
      .from("passports")
      .insert({
        org_id: ctx.org.orgId,
        product_id: productRow.id,
        slug,
        status: "draft",
        battery_category: batteryCategory,
        working_fields: cleanWorkingFields,
      })
      .select("id, slug")
      .single();

    if (passportInsert.error) {
      passportInsert = await supabase
        .from("passports")
        .insert({
          org_id: ctx.org.orgId,
          product_id: productRow.id,
          slug,
          status: "draft",
          working_fields: cleanWorkingFields,
        })
        .select("id, slug")
        .single();
    }

    const { data: passportRow, error: passportErr } = passportInsert;

    if (passportErr || !passportRow) {
      throw new Error("Could not create draft battery passport.");
    }

    await supabase
      .from("uploads")
      .update({
        passport_id: passportRow.id,
        extraction_status: "completed",
        extraction_result: {
          fields: extraction.fields,
          summary: extraction.summary,
          usage: extraction.usage,
          totalPages: parsedPdf.totalPages,
          characterCount: parsedPdf.characterCount,
        },
      })
      .eq("id", uploadId)
      .eq("org_id", ctx.org.orgId);

    // Audit log tracks extraction model & token usage per organization
    await supabase.from("audit_log").insert({
      org_id: ctx.org.orgId,
      actor_user_id: ctx.user.id,
      action: "extraction.completed",
      target_type: "upload",
      target_id: uploadId,
      metadata: {
        passport_id: passportRow.id,
        model: extraction.usage.model,
        mode: extraction.usage.mode,
        input_tokens: extraction.usage.inputTokens,
        output_tokens: extraction.usage.outputTokens,
        summary: extraction.summary,
        file_size_bytes: bytes.byteLength,
      },
    });

    return NextResponse.json({
      passportId: passportRow.id,
      slug: passportRow.slug,
      batteryCategory,
      productName: finalProductName,
      modelCode: finalModelCode,
      totalPages: parsedPdf.totalPages,
      characterCount: parsedPdf.characterCount,
      truncated: parsedPdf.truncated,
      lowTextWarning,
      dailyExtractionsUsed: dailyCount + 1,
      dailyExtractionLimit: siteConfig.dailyExtractionLimitPerOrg,
      extraction: {
        fields: extraction.fields,
        summary: extraction.summary,
        usage: extraction.usage,
      },
      workingFields: cleanWorkingFields,
    });
  } catch (err) {
    console.error("[extract] PDF extraction failed:", {
      uploadId,
      orgId: ctx.org.orgId,
      provider: providerSelection.provider,
      model: providerSelection.model,
      fileSizeBytes: bytes.byteLength,
      errorName: err instanceof Error ? err.name : "Error",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    await supabase
      .from("uploads")
      .update({ extraction_status: "failed" })
      .eq("id", uploadId)
      .eq("org_id", ctx.org.orgId);

    await supabase.from("audit_log").insert({
      org_id: ctx.org.orgId,
      actor_user_id: ctx.user.id,
      action: "extraction.failed",
      target_type: "upload",
      target_id: uploadId,
      metadata: {
        reason: err instanceof Error ? err.message.slice(0, 200) : "unknown_error",
      },
    });

    return NextResponse.json(
      {
        error:
          err instanceof Error && /^PDF /.test(err.message)
            ? err.message
            : "PDF extraction failed cleanly. Please check the file or fill fields manually.",
      },
      { status: 422 },
    );
  }
}
