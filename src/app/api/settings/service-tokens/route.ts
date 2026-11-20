import { NextResponse } from "next/server";
import { z } from "zod";
import { hasProFeatureAccess } from "@/lib/entitlements";
import { hashServicePin } from "@/lib/service/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

const CreatePinSchema = z.object({
  label: z.string().trim().min(2).max(120),
  pin: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,16}$/, "PIN must be 4–16 alphanumeric characters."),
  role: z.enum(["repairer", "recycler"]).default("repairer"),
});

const PatchPinSchema = z.object({
  tokenId: z.string().uuid(),
  active: z.boolean(),
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
    .from("service_access_tokens")
    .select("id, label, role, active, created_at")
    .eq("workspace_id", ctx.org.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ tokens: [] });
  }

  return NextResponse.json({ tokens: data ?? [] });
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
      { error: "Only workspace owners can issue service access PINs." },
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
        error:
          "Dealer / Repairer SoH service PINs require CratePass Pro (€79/mo).",
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

  const parsed = CreatePinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Provide a service center label and 4–16 character PIN.",
      },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const pinHash = hashServicePin(ctx.org.orgId, parsed.data.pin);
  const { data: created, error } = await supabase
    .from("service_access_tokens")
    .insert({
      workspace_id: ctx.org.orgId,
      label: parsed.data.label,
      pin_hash: pinHash,
      role: parsed.data.role,
      active: true,
    })
    .select("id, label, role, active, created_at")
    .single();

  if (error || !created) {
    return NextResponse.json(
      {
        error:
          "Could not create service access PIN. Confirm migration 202611200004_service_portal_and_dynamic_logs.sql has been applied.",
      },
      { status: 500 },
    );
  }

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "service_access_token_created",
    target_type: "service_access_token",
    target_id: created.id,
    metadata: { label: created.label, role: created.role },
  });

  return NextResponse.json({ ok: true, token: created });
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
      { error: "Only workspace owners can update service access PINs." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PatchPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { error } = await supabase
    .from("service_access_tokens")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.tokenId)
    .eq("workspace_id", ctx.org.orgId);

  if (error) {
    return NextResponse.json({ error: "Could not update PIN status." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
