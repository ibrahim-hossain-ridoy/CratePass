import { NextResponse } from "next/server";
import { z } from "zod";
import { hasProFeatureAccess } from "@/lib/entitlements";
import { generateWorkspaceApiKey } from "@/lib/service/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

const CreateApiKeySchema = z.object({
  label: z.string().trim().min(2).max(120),
});

const RevokeApiKeySchema = z.object({
  keyId: z.string().uuid(),
});

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

  const { data, error } = await supabase
    .from("workspace_api_keys")
    .select("id, label, key_prefix, active, last_used_at, created_at")
    .eq("workspace_id", ctx.org.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ keys: [] });
  }

  return NextResponse.json({ keys: data ?? [] });
}

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

  if (ctx.org.role !== "owner") {
    return NextResponse.json(
      { error: "Only workspace owners can create REST API keys." },
      { status: 403 },
    );
  }

  if (
    !hasProFeatureAccess({
      billingStatus: ctx.org.billingStatus,
      compEnabled: ctx.org.compEnabled,
    })
  ) {
    return NextResponse.json(
      {
        error: "REST API keys require CratePass Pro (€79/mo).",
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 402 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = CreateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide an API key label (2–120 characters)." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { rawKey, keyPrefix, keyHash } = generateWorkspaceApiKey();
  const { data: created, error } = await supabase
    .from("workspace_api_keys")
    .insert({
      workspace_id: ctx.org.orgId,
      label: parsed.data.label,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      active: true,
    })
    .select("id, label, key_prefix, active, last_used_at, created_at")
    .single();

  if (error || !created) {
    return NextResponse.json(
      {
        error:
          "Could not create API key. Confirm migration 202611200004_service_portal_and_dynamic_logs.sql has been applied.",
      },
      { status: 500 },
    );
  }

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "workspace_api_key_created",
    target_type: "workspace_api_key",
    target_id: created.id,
    metadata: { label: created.label, key_prefix: keyPrefix },
  });

  // Raw API key is returned ONCE upon creation and never stored in plaintext
  return NextResponse.json({ ok: true, key: created, rawKey });
}

export async function PATCH(request: Request) {
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

  if (ctx.org.role !== "owner") {
    return NextResponse.json(
      { error: "Only workspace owners can revoke REST API keys." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RevokeApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid keyId." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { error } = await supabase
    .from("workspace_api_keys")
    .update({ active: false })
    .eq("id", parsed.data.keyId)
    .eq("workspace_id", ctx.org.orgId);

  if (error) {
    return NextResponse.json({ error: "Could not revoke API key." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
