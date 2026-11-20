import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { normalizeFieldValues } from "@/lib/passport-projection";
import { validatePdfUpload } from "@/lib/pdf";
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form submission." },
      { status: 400 },
    );
  }

  const productName = String(formData.get("productName") ?? "")
    .trim()
    .slice(0, 160);
  const modelCode = String(formData.get("modelCode") ?? "")
    .trim()
    .slice(0, 80);
  const manufacturerName = String(formData.get("manufacturerName") ?? "")
    .trim()
    .slice(0, 160);
  const manufacturerAddress = String(formData.get("manufacturerAddress") ?? "")
    .trim()
    .slice(0, 260);
  const euDocLink = String(formData.get("euDocLink") ?? "")
    .trim()
    .slice(0, 500);
  const collectionMarking = String(
    formData.get("collectionMarking") ??
      "Crossed-out wheeled bin symbol (Article 13(4))",
  )
    .trim()
    .slice(0, 260);
  const disposalInstructions = String(formData.get("disposalInstructions") ?? "")
    .trim()
    .slice(0, 2000);
  const batteryTypeLabel = String(
    formData.get("batteryTypeLabel") ?? "Portable / SLI / Industrial <= 2 kWh",
  )
    .trim()
    .slice(0, 120);

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

  let simpleQrDocPath: string | null = null;
  const docFile = formData.get("docPdf");
  if (docFile instanceof File && docFile.size > 0) {
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
    const storageClient = createAdminSupabaseClient() ?? supabase;
    const { error: uploadErr } = await storageClient.storage
      .from("spec-pdfs")
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
