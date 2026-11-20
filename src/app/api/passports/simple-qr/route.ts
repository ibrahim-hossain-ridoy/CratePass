import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { normalizeFieldValues } from "@/lib/passport-projection";
import { validatePdfUpload } from "@/lib/pdf";
import {
  SPEC_PDFS_BUCKET,
  SignedUploadValidationError,
  downloadAndValidateStoredPdf,
  isAuthorizedScopedPdfPath,
  sanitizePdfFileName,
} from "@/lib/storage/signed-uploads";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { slugifyPassportName } from "@/lib/workspace/helpers";

/**
 * Create a lightweight Simple QR Mode record (Article 13(6) non-passport batteries:
 * Portable, SLI, Industrial <= 2 kWh).
 */
export async function POST(request: Request) {
  const ctx = await getWorkspaceContext();
  if (ctx.state === "unconfigured") {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  if (ctx.state === "unauthenticated") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (ctx.state === "error") {
    return NextResponse.json({ error: ctx.message }, { status: 500 });
  }

  let productName = "";
  let modelCode = "";
  let manufacturerName = "";
  let manufacturerAddress = "";
  let euDocLink = "";
  let collectionMarking = "Crossed-out wheeled bin symbol (Article 13(4))";
  let disposalInstructions = "";
  let batteryTypeLabel = "Portable / SLI / Industrial <= 2 kWh";
  let docFile: File | null = null;
  let requestedStoragePath = "";
  let requestedFileName = "";

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    productName = String(body.productName ?? "").trim().slice(0, 160);
    modelCode = String(body.modelCode ?? "").trim().slice(0, 80);
    manufacturerName = String(body.manufacturerName ?? "").trim().slice(0, 160);
    manufacturerAddress = String(body.manufacturerAddress ?? "").trim().slice(0, 260);
    euDocLink = String(body.euDocLink ?? "").trim().slice(0, 500);
    collectionMarking = String(
      body.collectionMarking ?? "Crossed-out wheeled bin symbol (Article 13(4))",
    )
      .trim()
      .slice(0, 260);
    disposalInstructions = String(body.disposalInstructions ?? "").trim().slice(0, 2000);
    batteryTypeLabel = String(
      body.batteryTypeLabel ?? "Portable / SLI / Industrial <= 2 kWh",
    )
      .trim()
      .slice(0, 120);
    requestedStoragePath = String(body.storagePath ?? "").trim();
    requestedFileName = String(body.fileName ?? "").trim();
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

    productName = String(formData.get("productName") ?? "")
      .trim()
      .slice(0, 160);
    modelCode = String(formData.get("modelCode") ?? "")
      .trim()
      .slice(0, 80);
    manufacturerName = String(formData.get("manufacturerName") ?? "")
      .trim()
      .slice(0, 160);
    manufacturerAddress = String(formData.get("manufacturerAddress") ?? "")
      .trim()
      .slice(0, 260);
    euDocLink = String(formData.get("euDocLink") ?? "")
      .trim()
      .slice(0, 500);
    collectionMarking = String(
      formData.get("collectionMarking") ??
        "Crossed-out wheeled bin symbol (Article 13(4))",
    )
      .trim()
      .slice(0, 260);
    disposalInstructions = String(formData.get("disposalInstructions") ?? "")
      .trim()
      .slice(0, 2000);
    batteryTypeLabel = String(
      formData.get("batteryTypeLabel") ?? "Portable / SLI / Industrial <= 2 kWh",
    )
      .trim()
      .slice(0, 120);

    const fileEntry = formData.get("docPdf");
    if (fileEntry instanceof File && fileEntry.size > 0) {
      docFile = fileEntry;
    }
  }

  if (!productName || !manufacturerName) {
    return NextResponse.json(
      { error: "Product name and manufacturer name are required for Simple QR Mode." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const storageClient = createAdminSupabaseClient() ?? supabase;
  let simpleQrDocPath: string | null = null;

  if (requestedStoragePath) {
    if (
      !isAuthorizedScopedPdfPath({
        storagePath: requestedStoragePath,
        purpose: "doc",
        orgId: ctx.org.orgId,
      })
    ) {
      return NextResponse.json(
        { error: "Invalid or unauthorized EU Declaration of Conformity storage path." },
        { status: 400 },
      );
    }

    try {
      await downloadAndValidateStoredPdf({
        storageBucket: storageClient.storage.from(SPEC_PDFS_BUCKET),
        storagePath: requestedStoragePath,
        fileName: sanitizePdfFileName(
          requestedFileName,
          "eu-declaration-of-conformity.pdf",
        ),
        maxBytes: siteConfig.maxUploadBytes,
      });
    } catch (err) {
      if (err instanceof SignedUploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      return NextResponse.json(
        { error: "Failed to validate uploaded EU Declaration of Conformity PDF." },
        { status: 400 },
      );
    }
    simpleQrDocPath = requestedStoragePath;
  } else if (docFile) {
    if (docFile.size > siteConfig.maxUploadBytes) {
      return NextResponse.json(
        { error: "EU Declaration of Conformity PDF exceeds the 10 MB limit." },
        { status: 413 },
      );
    }

    const bytes = new Uint8Array(await docFile.arrayBuffer());
    try {
      validatePdfUpload({
        bytes,
        mimeType: docFile.type || "",
        fileName: docFile.name || "eu-declaration-of-conformity.pdf",
        maxBytes: siteConfig.maxUploadBytes,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid PDF upload." },
        { status: 400 },
      );
    }

    const docUuid = randomUUID();
    const storagePath = `${ctx.org.orgId}/doc/${docUuid}.pdf`;
    const { error: uploadErr } = await storageClient.storage
      .from(SPEC_PDFS_BUCKET)
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: "Failed to upload EU Declaration of Conformity PDF." },
        { status: 500 },
      );
    }
    simpleQrDocPath = storagePath;
  }

  const workingFields = normalizeFieldValues({
    manufacturer_name: manufacturerName,
    manufacturer_postal_address: manufacturerAddress,
    model_serial_number: modelCode || productName,
    battery_category: batteryTypeLabel,
    art_13_4_marking: collectionMarking,
    eu_doc_link:
      euDocLink ||
      (simpleQrDocPath ? "Uploaded EU Declaration of Conformity PDF" : ""),
    waste_battery_info:
      disposalInstructions ||
      "Separate collection required. Do not dispose with unsorted household waste. Return spent batteries to an authorised municipal collection point or retailer take-back programme.",
  });

  const slug = `${slugifyPassportName(productName)}-${randomBytes(3).toString("hex")}`;

  const { data: productRow, error: productErr } = await supabase
    .from("products")
    .insert({
      org_id: ctx.org.orgId,
      name: productName,
      model_code: modelCode,
    })
    .select("id")
    .single();

  if (productErr || !productRow) {
    if (simpleQrDocPath) {
      await storageClient.storage.from(SPEC_PDFS_BUCKET).remove([simpleQrDocPath]);
    }
    return NextResponse.json(
      { error: "Could not create product record." },
      { status: 500 },
    );
  }

  let passportInsert = await supabase
    .from("passports")
    .insert({
      org_id: ctx.org.orgId,
      product_id: productRow.id,
      slug,
      status: "draft",
      battery_category: "industrial",
      record_mode: "simple_qr",
      simple_qr_doc_path: simpleQrDocPath,
      working_fields: workingFields,
    })
    .select("id, slug")
    .single();

  if (passportInsert.error) {
    // Graceful fallback if migration 202611200003 has not been applied yet
    passportInsert = await supabase
      .from("passports")
      .insert({
        org_id: ctx.org.orgId,
        product_id: productRow.id,
        slug,
        status: "draft",
        battery_category: "industrial",
        working_fields: workingFields,
      })
      .select("id, slug")
      .single();
  }

  if (passportInsert.error || !passportInsert.data) {
    if (simpleQrDocPath) {
      await storageClient.storage.from(SPEC_PDFS_BUCKET).remove([simpleQrDocPath]);
    }
    return NextResponse.json(
      { error: "Could not create Simple QR record." },
      { status: 500 },
    );
  }

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "simple_qr_created",
    target_type: "passport",
    target_id: passportInsert.data.id,
    metadata: {
      slug: passportInsert.data.slug,
      record_mode: "simple_qr",
      has_doc_pdf: Boolean(simpleQrDocPath),
    },
  });

  return NextResponse.json({
    ok: true,
    passportId: String(passportInsert.data.id),
    slug: String(passportInsert.data.slug),
    recordMode: "simple_qr",
  });
}
