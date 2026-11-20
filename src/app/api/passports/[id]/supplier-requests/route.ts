import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  computeSupplierExpiryIso,
  filterValidStaticFieldKeys,
  generateSupplierToken,
} from "@/lib/supplier/tokens";
import { getWorkspaceContext } from "@/lib/workspace/context";

const CreateSupplierRequestSchema = z.object({
  supplierName: z.string().trim().max(160).optional().default(""),
  supplierEmail: z.string().trim().max(254).optional().default(""),
  requestedFieldKeys: z.array(z.string()).min(1).max(60),
  defaultLocale: z.enum(["en", "zh", "ko", "ja", "vi"]).optional().default("zh"),
});

export async function GET(
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

  const { data, error } = await supabase
    .from("supplier_requests")
    .select(
      "id, supplier_name, supplier_email, requested_field_keys, default_locale, status, submitted_payload, uploaded_doc_path, expires_at, created_at, submitted_at",
    )
    .eq("passport_id", id)
    .eq("workspace_id", ctx.org.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error:
          "Could not load supplier requests. Confirm migration 202611200001_supplier_magic_links.sql has been applied.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ requests: data ?? [] });
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = CreateSupplierRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Select at least one missing static field to request." },
      { status: 400 },
    );
  }

  const validKeys = filterValidStaticFieldKeys(parsed.data.requestedFieldKeys);
  if (validKeys.length === 0) {
    return NextResponse.json(
      { error: "No valid static Annex XIII fields were selected." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  // Confirm passport belongs to this workspace
  const { data: passportRow, error: passportErr } = await supabase
    .from("passports")
    .select("id, slug")
    .eq("id", id)
    .eq("org_id", ctx.org.orgId)
    .single();

  if (passportErr || !passportRow) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  const { rawToken, tokenHash } = generateSupplierToken();
  const expiresAt = computeSupplierExpiryIso();

  const { data: created, error: insertErr } = await supabase
    .from("supplier_requests")
    .insert({
      workspace_id: ctx.org.orgId,
      passport_id: id,
      token_hash: tokenHash,
      supplier_name: parsed.data.supplierName,
      supplier_email: parsed.data.supplierEmail,
      requested_field_keys: validKeys,
      default_locale: parsed.data.defaultLocale,
      status: "open",
      expires_at: expiresAt,
    })
    .select(
      "id, supplier_name, supplier_email, requested_field_keys, default_locale, status, submitted_payload, uploaded_doc_path, expires_at, created_at, submitted_at",
    )
    .single();

  if (insertErr || !created) {
    return NextResponse.json(
      {
        error:
          "Could not create supplier request. Confirm migration 202611200001_supplier_magic_links.sql has been applied.",
      },
      { status: 500 },
    );
  }

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "supplier_request_created",
    target_type: "supplier_request",
    target_id: created.id,
    metadata: {
      passport_id: id,
      slug: passportRow.slug,
      field_count: validKeys.length,
      default_locale: parsed.data.defaultLocale,
      expires_at: expiresAt,
    },
  });

  return NextResponse.json({
    ok: true,
    request: created,
    magicPath: `/supplier/${rawToken}`,
  });
}
