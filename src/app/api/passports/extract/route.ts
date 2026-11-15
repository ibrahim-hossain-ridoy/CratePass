import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { extractBatteryFieldsFromText } from "@/lib/extractor";
import { normalizeFieldValues } from "@/lib/passport-projection";
import { computeSha256Hex, extractPdfText, validatePdfUpload } from "@/lib/pdf";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { slugifyPassportName } from "@/lib/workspace/helpers";

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

  // Per-organization daily cap (default 5/day in siteConfig)
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
  if (dailyCount >= siteConfig.dailyExtractionLimitPerOrg) {
    return NextResponse.json(
      {
        error: `Daily extraction limit reached (${siteConfig.dailyExtractionLimitPerOrg} PDFs per day per organization). Edit existing drafts or try again tomorrow.`,
      },
      { status: 429 },
    );
  }

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
  const productNameOverride = String(formData.get("productName") ?? "").trim().slice(0, 160);

  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "Attach a PDF specification file under field 'file'." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
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

  const uploadId = randomUUID();
  const safeFilename = (fileEntry.name || "datasheet.pdf")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 120);
  const storagePath = `${ctx.org.orgId}/${uploadId}.pdf`;
  const sha256 = computeSha256Hex(bytes);

  const storageClient = createAdminSupabaseClient() ?? supabase;
  const { error: uploadStorageErr } = await storageClient.storage
    .from("spec-pdfs")
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
    return NextResponse.json(
      { error: "Failed to record PDF upload metadata." },
      { status: 500 },
    );
  }

  try {
    const parsedPdf = await extractPdfText(bytes);
    const lowTextWarning = parsedPdf.characterCount < 40;

    const extraction = await extractBatteryFieldsFromText(
      parsedPdf.text,
      safeFilename,
    );

    const workingFields: Record<string, string> = {};
    for (const [key, item] of Object.entries(extraction.fields)) {
      if (item.value) {
        workingFields[key] = item.value;
      }
    }
    const cleanWorkingFields = normalizeFieldValues(workingFields);

    const finalProductName =
      productNameOverride ||
      extraction.productName ||
      safeFilename.replace(/\.pdf$/i, "") ||
      "Battery Pack";
    const finalModelCode = extraction.modelCode || cleanWorkingFields.model_code || "";

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

    const { data: passportRow, error: passportErr } = await supabase
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
          err instanceof Error
            ? err.message
            : "PDF extraction failed cleanly. Please verify the PDF or enter fields manually.",
      },
      { status: 422 },
    );
  }
}
