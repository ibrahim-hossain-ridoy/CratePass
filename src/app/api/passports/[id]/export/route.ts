import { NextResponse } from "next/server";
import { normalizeBatteryCategory } from "@/config/battery-fields";
import { buildAuditDataPackagePdf } from "@/lib/export/audit-package-pdf";
import {
  buildEuRegistryJsonLd,
  computeCanonicalSnapshotSha256,
} from "@/lib/export/jsonld";
import { projectPublicPassportFields } from "@/lib/passport-projection";
import { buildPublicPassportUrl } from "@/lib/qr";
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

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "jsonld").toLowerCase();
  if (format !== "jsonld" && format !== "audit_pdf") {
    return NextResponse.json(
      { error: "Invalid export format. Expected 'jsonld' or 'audit_pdf'." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  let passportRow: {
    id: string;
    slug: string;
    status: string;
    battery_category: string;
    record_mode?: string;
    working_fields: unknown;
    products: unknown;
  } | null = null;

  const passportQuery = await supabase
    .from("passports")
    .select(
      "id, slug, status, battery_category, record_mode, working_fields, products ( name, model_code )",
    )
    .eq("id", id)
    .eq("org_id", ctx.org.orgId)
    .single();

  if (!passportQuery.error && passportQuery.data) {
    passportRow = passportQuery.data;
  } else {
    // Backwards-compatible fallback before migration 202611200003 is applied
    const fallback = await supabase
      .from("passports")
      .select(
        "id, slug, status, battery_category, working_fields, products ( name, model_code )",
      )
      .eq("id", id)
      .eq("org_id", ctx.org.orgId)
      .single();
    if (!fallback.error && fallback.data) {
      passportRow = {
        ...fallback.data,
        record_mode: "full_passport",
      };
    }
  }

  if (!passportRow) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  const versionsRes = await supabase
    .from("passport_versions")
    .select("version_number, declared_at, snapshot_public_fields")
    .eq("passport_id", id)
    .eq("org_id", ctx.org.orgId)
    .order("version_number", { ascending: false });

  const productRel = (
    Array.isArray(passportRow.products)
      ? passportRow.products[0]
      : passportRow.products
  ) as { name?: string; model_code?: string } | null;
  const productName = productRel?.name ? String(productRel.name) : String(passportRow.slug);
  const modelCode = productRel?.model_code ? String(productRel.model_code) : "";
  const slug = String(passportRow.slug);
  const workingFields =
    passportRow.working_fields && typeof passportRow.working_fields === "object"
      ? (passportRow.working_fields as Record<string, string>)
      : {};
  const batteryCategory = normalizeBatteryCategory(
    passportRow.battery_category ?? workingFields.battery_category,
  );
  const recordMode =
    passportRow.record_mode === "simple_qr" ? "simple_qr" : "full_passport";
  const origin = resolveOrigin(request);

  const versions = (versionsRes.data ?? []).map((v) => {
    const pub = projectPublicPassportFields(
      (v.snapshot_public_fields as Record<string, unknown>) || {},
    );
    return {
      versionNumber: Number(v.version_number),
      declaredAt: String(v.declared_at),
      sha256: computeCanonicalSnapshotSha256(pub),
      snapshotPublic: pub,
    };
  });

  if (format === "jsonld") {
    const latest = versions[0];
    const doc = buildEuRegistryJsonLd({
      slug,
      origin,
      batteryCategory,
      recordMode,
      versionNumber: latest?.versionNumber ?? 0,
      declaredAt: latest?.declaredAt ?? new Date().toISOString(),
      rawFields: latest ? latest.snapshotPublic : workingFields,
      commodityCode: url.searchParams.get("commodityCode"),
    });

    return new NextResponse(JSON.stringify(doc, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/ld+json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-eu-registry.jsonld"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const publicUrl = buildPublicPassportUrl(slug, origin);
  const pdfBytes = buildAuditDataPackagePdf({
    orgName: ctx.org.orgName,
    productName,
    modelCode,
    slug,
    publicUrl,
    batteryCategory,
    recordMode,
    status: passportRow.status === "published" ? "published" : "draft",
    workingFields,
    versions: versions.map((v) => ({
      versionNumber: v.versionNumber,
      declaredAt: v.declaredAt,
      sha256: v.sha256,
    })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}-audit-data-package.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
