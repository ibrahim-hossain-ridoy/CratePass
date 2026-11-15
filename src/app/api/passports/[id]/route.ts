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
