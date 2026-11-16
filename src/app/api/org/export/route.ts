import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

export async function GET() {
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

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const [productsRes, passportsRes, versionsRes, uploadsRes, auditRes] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, model_code, created_at")
        .eq("org_id", ctx.org.orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("passports")
        .select("id, product_id, slug, status, working_fields, current_version_id, created_at, updated_at")
        .eq("org_id", ctx.org.orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("passport_versions")
        .select("id, passport_id, version_number, snapshot_all_fields, snapshot_public_fields, declared_at, created_at")
        .eq("org_id", ctx.org.orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("uploads")
        .select("id, passport_id, original_filename, file_size_bytes, sha256, extraction_status, created_at")
        .eq("org_id", ctx.org.orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("audit_log")
        .select("id, action, target_type, target_id, metadata, created_at")
        .eq("org_id", ctx.org.orgId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "org.exported",
    target_type: "organization",
    target_id: ctx.org.orgId,
    metadata: { exported_by: ctx.user.email },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    exporter: {
      userId: ctx.user.id,
      email: ctx.user.email,
    },
    organization: {
      id: ctx.org.orgId,
      name: ctx.org.orgName,
      slug: ctx.org.orgSlug,
      role: ctx.org.role,
      billingStatus: ctx.org.billingStatus,
      compEnabled: ctx.org.compEnabled,
    },
    products: productsRes.data ?? [],
    passports: passportsRes.data ?? [],
    passportVersions: versionsRes.data ?? [],
    uploads: uploadsRes.data ?? [],
    recentAuditLog: auditRes.data ?? [],
  };

  const safeSlug = ctx.org.orgSlug.replace(/[^a-z0-9-]/gi, "-");
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="battery-passport-export-${safeSlug}.json"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
