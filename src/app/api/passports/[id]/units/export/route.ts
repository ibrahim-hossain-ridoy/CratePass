import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { buildQrLabelSheetPdf } from "@/lib/export/pdf-builder";
import { createZipArchive, type ZipEntryInput } from "@/lib/export/zip";
import { buildUnitPublicUrl } from "@/lib/serialization/csv";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

function resolveOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    configured &&
    /^https?:\/\//i.test(configured) &&
    !configured.includes("localhost")
  ) {
    return configured.replace(/\/+$/, "");
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid passport ID." }, { status: 400 });
  }

  const reqUrl = new URL(request.url);
  const format = (reqUrl.searchParams.get("format") || "pdf").toLowerCase();
  if (format !== "pdf" && format !== "zip") {
    return NextResponse.json(
      { error: "Invalid export format. Expected 'pdf' or 'zip'." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const [passportRes, unitsRes] = await Promise.all([
    supabase
      .from("passports")
      .select("id, slug, products ( name, model_code )")
      .eq("id", id)
      .eq("org_id", ctx.org.orgId)
      .single(),
    supabase
      .from("passport_units")
      .select("serial_number, gtin, batch_lot, manufacturing_date")
      .eq("passport_id", id)
      .eq("workspace_id", ctx.org.orgId)
      .order("serial_number", { ascending: true })
      .limit(500),
  ]);

  if (passportRes.error || !passportRes.data) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  const units = unitsRes.data ?? [];
  if (units.length === 0) {
    return NextResponse.json(
      { error: "Import at least one serialized unit before exporting QR sheets." },
      { status: 400 },
    );
  }

  const productRel = Array.isArray(passportRes.data.products)
    ? passportRes.data.products[0]
    : passportRes.data.products;
  const modelName = productRel?.name ? String(productRel.name) : passportRes.data.slug;
  const slug = String(passportRes.data.slug);
  const origin = resolveOrigin(request);

  const labelItems = units.map((u) => {
    const serialNumber = String(u.serial_number);
    const gtin = u.gtin ? String(u.gtin) : null;
    return {
      serialNumber,
      modelName,
      gtin,
      batchLot: u.batch_lot ? String(u.batch_lot) : null,
      url: buildUnitPublicUrl({ origin, slug, serialNumber, gtin }),
    };
  });

  if (format === "pdf") {
    const pdfBytes = buildQrLabelSheetPdf({
      modelName,
      slug,
      labels: labelItems,
    });
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}-qr-labels-a4.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // format === "zip": individual SVG + PNG QR codes + CSV manifest (cap ZIP at 250 units per download for memory safety)
  const zipSlice = labelItems.slice(0, 250);
  const entries: ZipEntryInput[] = [];
  const manifestLines = ["serial_number,gtin,batch_lot,qr_url"];

  for (const item of zipSlice) {
    const safeSerial = item.serialNumber.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const [svg, pngBuffer] = await Promise.all([
      QRCode.toString(item.url, {
        type: "svg",
        width: 320,
        margin: 2,
        color: { dark: "#141413", light: "#FFFFFF" },
      }),
      QRCode.toBuffer(item.url, {
        type: "png",
        width: 640,
        margin: 2,
        color: { dark: "#141413", light: "#FFFFFF" },
      }),
    ]);

    entries.push({ name: `svg/${safeSerial}.svg`, data: svg });
    entries.push({ name: `png/${safeSerial}.png`, data: new Uint8Array(pngBuffer) });
    manifestLines.push(
      `"${item.serialNumber.replace(/"/g, '""')}","${item.gtin ?? ""}","${(item.batchLot ?? "").replace(/"/g, '""')}","${item.url}"`,
    );
  }

  entries.push({ name: "manifest.csv", data: manifestLines.join("\n") + "\n" });

  const zipBytes = createZipArchive(entries);
  return new NextResponse(Buffer.from(zipBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-unit-qrs.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
