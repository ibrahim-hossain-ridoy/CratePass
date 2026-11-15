import { NextResponse } from "next/server";
import { z } from "zod";
import { isBillingEnabled } from "@/config/site";
import {
  ACCURACY_DECLARATION_TEXT,
  canOrgPublish,
  preparePublishSnapshots,
} from "@/lib/publish";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

const PublishActionSchema = z.object({
  action: z.enum(["publish", "publish_new_version", "unpublish"]),
  declarationAccepted: z.boolean().optional().default(false),
  workingFields: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PublishActionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { data: passportRow, error: passportErr } = await supabase
    .from("passports")
    .select("id, org_id, slug, status, working_fields, current_version_id")
    .eq("id", id)
    .eq("org_id", ctx.org.orgId)
    .single();

  if (passportErr || !passportRow) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  if (parsed.data.action === "unpublish") {
    const { error: unpubErr } = await supabase
      .from("passports")
      .update({ status: "draft" })
      .eq("id", id)
      .eq("org_id", ctx.org.orgId);

    if (unpubErr) {
      return NextResponse.json({ error: "Could not unpublish passport." }, { status: 500 });
    }

    await supabase.from("audit_log").insert({
      org_id: ctx.org.orgId,
      actor_user_id: ctx.user.id,
      action: "passport.unpublished",
      target_type: "passport",
      target_id: id,
      metadata: { slug: passportRow.slug },
    });

    return NextResponse.json({ ok: true, status: "draft" });
  }

  // Billing gate for M6 (inactive while BILLING_ENABLED=false or comp_enabled=true)
  const billingAllowed = canOrgPublish({
    billingEnabled: isBillingEnabled(),
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });
  if (!billingAllowed) {
    return NextResponse.json(
      {
        error: "Active subscription or pilot comp is required to publish and generate live QR links.",
        code: "BILLING_REQUIRED",
      },
      { status: 402 },
    );
  }

  const sourceFields =
    parsed.data.workingFields ??
    ((passportRow.working_fields as Record<string, unknown>) || {});

  let snapshots: ReturnType<typeof preparePublishSnapshots>;
  try {
    snapshots = preparePublishSnapshots({
      workingFields: sourceFields,
      declarationAccepted: Boolean(parsed.data.declarationAccepted),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation error." },
      { status: 400 },
    );
  }

  const { data: latestVersions } = await supabase
    .from("passport_versions")
    .select("version_number")
    .eq("passport_id", id)
    .eq("org_id", ctx.org.orgId)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersionNumber =
    latestVersions && latestVersions.length > 0
      ? Number(latestVersions[0].version_number) + 1
      : 1;

  const declaredAt = new Date().toISOString();

  const { data: createdVersion, error: versionErr } = await supabase
    .from("passport_versions")
    .insert({
      passport_id: id,
      org_id: ctx.org.orgId,
      version_number: nextVersionNumber,
      snapshot_all_fields: snapshots.snapshotAllFields,
      snapshot_public_fields: snapshots.snapshotPublicFields,
      declared_accurate_by: ctx.user.id,
      declared_at: declaredAt,
    })
    .select("id, version_number, declared_at, created_at")
    .single();

  if (versionErr || !createdVersion) {
    return NextResponse.json(
      { error: "Could not create immutable passport version." },
      { status: 500 },
    );
  }

  const { error: updateErr } = await supabase
    .from("passports")
    .update({
      status: "published",
      current_version_id: createdVersion.id,
      working_fields: snapshots.snapshotAllFields,
    })
    .eq("id", id)
    .eq("org_id", ctx.org.orgId);

  if (updateErr) {
    return NextResponse.json(
      { error: "Created version snapshot but failed updating passport status." },
      { status: 500 },
    );
  }

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "passport.published",
    target_type: "passport",
    target_id: id,
    metadata: {
      slug: passportRow.slug,
      version_number: createdVersion.version_number,
      declaration_text: ACCURACY_DECLARATION_TEXT,
    },
  });

  return NextResponse.json({
    ok: true,
    status: "published",
    slug: passportRow.slug,
    version: {
      id: createdVersion.id,
      versionNumber: createdVersion.version_number,
      declaredAt: createdVersion.declared_at,
      createdAt: createdVersion.created_at,
    },
    missingRequiredCount: snapshots.missingRequiredKeys.length,
  });
}
