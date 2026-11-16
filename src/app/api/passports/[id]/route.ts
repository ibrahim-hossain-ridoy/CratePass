import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeFieldValues } from "@/lib/passport-projection";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

const PatchPassportSchema = z.object({
  productName: z.string().trim().min(1).max(160).optional(),
  modelCode: z.string().trim().max(80).optional(),
  workingFields: z.record(z.string(), z.unknown()),
});

export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = PatchPassportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("passports")
    .select("id, product_id, org_id")
    .eq("id", id)
    .eq("org_id", ctx.org.orgId)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  const cleanFields = normalizeFieldValues(parsed.data.workingFields);

  const { error: updatePassportErr } = await supabase
    .from("passports")
    .update({ working_fields: cleanFields })
    .eq("id", id)
    .eq("org_id", ctx.org.orgId);

  if (updatePassportErr) {
    return NextResponse.json({ error: "Could not save passport fields." }, { status: 500 });
  }

  if (parsed.data.productName !== undefined || parsed.data.modelCode !== undefined) {
    const productPatch: Record<string, string> = {};
    if (parsed.data.productName !== undefined) {
      productPatch.name = parsed.data.productName;
    }
    if (parsed.data.modelCode !== undefined) {
      productPatch.model_code = parsed.data.modelCode;
    }
    await supabase
      .from("products")
      .update(productPatch)
      .eq("id", existing.product_id)
      .eq("org_id", ctx.org.orgId);
  }

  return NextResponse.json({ ok: true, workingFields: cleanFields });
}

export async function DELETE(
  _request: Request,
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

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { data: passportRow, error: passportErr } = await supabase
    .from("passports")
    .select("id, org_id, product_id, slug, status")
    .eq("id", id)
    .eq("org_id", ctx.org.orgId)
    .single();

  if (passportErr || !passportRow) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  if (passportRow.status === "published") {
    return NextResponse.json(
      { error: "Unpublish the live passport before requesting deletion." },
      { status: 409 },
    );
  }

  // Respect immutable passport_versions ledger (cannot self-delete published history)
  const { data: versions } = await supabase
    .from("passport_versions")
    .select("id")
    .eq("passport_id", id)
    .eq("org_id", ctx.org.orgId)
    .limit(1);

  if (versions && versions.length > 0) {
    return NextResponse.json(
      {
        error:
          "This record has immutable published version snapshots in passport_versions. Unpublish from public view or request GDPR workspace erasure via support.",
      },
      { status: 409 },
    );
  }

  const { data: uploads } = await supabase
    .from("uploads")
    .select("storage_path")
    .eq("passport_id", id)
    .eq("org_id", ctx.org.orgId);

  const storagePaths = (uploads ?? [])
    .map((u) => String(u.storage_path || "").trim())
    .filter((p) => p.startsWith(`${ctx.org.orgId}/`));

  if (storagePaths.length > 0) {
    await supabase.storage.from("spec-pdfs").remove(storagePaths);
  }

  const { error: deleteErr } = await supabase
    .from("passports")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.org.orgId);

  if (deleteErr) {
    return NextResponse.json(
      { error: "Could not delete draft passport." },
      { status: 500 },
    );
  }

  await supabase
    .from("products")
    .delete()
    .eq("id", passportRow.product_id)
    .eq("org_id", ctx.org.orgId);

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "passport.deleted",
    target_type: "passport",
    target_id: id,
    metadata: {
      slug: passportRow.slug,
      removed_pdf_count: storagePaths.length,
    },
  });

  return NextResponse.json({ ok: true, deletedId: id });
}
