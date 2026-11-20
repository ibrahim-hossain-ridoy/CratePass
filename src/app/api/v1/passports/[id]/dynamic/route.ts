import { NextResponse } from "next/server";
import { hasProFeatureAccess } from "@/lib/entitlements";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  DynamicBmsEntrySchema,
  escapePostgresLikePattern,
  hashWorkspaceApiKey,
  sanitizeDynamicBmsNotes,
} from "@/lib/service/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { BillingStatus } from "@/types/database";

/**
 * Pro REST API endpoint for ERP/BMS automation:
 * POST /api/v1/passports/[id]/dynamic
 * Authenticated via `Authorization: Bearer cp_live_...` (SHA-256 hashed in `workspace_api_keys`).
 * Strictly appends to `dynamic_bms_logs` without altering immutable static snapshots.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid passport UUID." }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(cp_live_[a-f0-9]{32,128})$/i.exec(authHeader.trim());
  if (!match) {
    return NextResponse.json(
      { error: "Missing or malformed Authorization: Bearer cp_live_... header." },
      { status: 401 },
    );
  }

  const rawKey = match[1];
  const keyHash = hashWorkspaceApiKey(rawKey);

  const allowed = await enforceRateLimit(
    `api-v1-dynamic:${keyHash.slice(0, 16)}`,
    60,
    60,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "API rate limit exceeded (60 requests/minute per key)." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = DynamicBmsEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "API backend is not configured." },
      { status: 503 },
    );
  }

  const { data: keyRow, error: keyErr } = await admin
    .from("workspace_api_keys")
    .select(
      "id, workspace_id, label, active, organizations ( billing_status, comp_enabled )",
    )
    .eq("key_hash", keyHash)
    .eq("active", true)
    .single();

  if (keyErr || !keyRow) {
    return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }

  const orgRel = (
    Array.isArray(keyRow.organizations)
      ? keyRow.organizations[0]
      : keyRow.organizations
  ) as { billing_status?: BillingStatus; comp_enabled?: boolean } | null;

  if (
    !hasProFeatureAccess({
      billingStatus: orgRel?.billing_status ?? "free",
      compEnabled: Boolean(orgRel?.comp_enabled),
    })
  ) {
    return NextResponse.json(
      {
        error: "Dynamic BMS REST API requires an active CratePass Pro plan.",
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 402 },
    );
  }

  const { data: passportRow, error: passportErr } = await admin
    .from("passports")
    .select("id, org_id")
    .eq("id", id)
    .eq("org_id", keyRow.workspace_id)
    .single();

  if (passportErr || !passportRow) {
    return NextResponse.json(
      { error: "Passport not found in API key workspace." },
      { status: 404 },
    );
  }

  let unitId: string | null = null;
  if (parsed.data.serialNumber) {
    const escapedSerial = escapePostgresLikePattern(parsed.data.serialNumber);
    const { data: unitRow } = await admin
      .from("passport_units")
      .select("id")
      .eq("passport_id", id)
      .eq("workspace_id", keyRow.workspace_id)
      .ilike("serial_number", escapedSerial)
      .limit(1)
      .single();

    if (unitRow?.id) {
      unitId = String(unitRow.id);
    }
  }

  const cleanNotes = sanitizeDynamicBmsNotes(parsed.data.notes ?? "");
  const recordedByLabel = `API: ${keyRow.label}`;

  const { data: logRow, error: insertErr } = await admin
    .from("dynamic_bms_logs")
    .insert({
      workspace_id: keyRow.workspace_id,
      passport_id: id,
      unit_id: unitId,
      recorded_by_label: recordedByLabel,
      state_of_health_pct: parsed.data.stateOfHealthPct ?? null,
      cycle_count: parsed.data.cycleCount ?? null,
      internal_resistance_mohm: parsed.data.internalResistanceMohm ?? null,
      lifecycle_status: parsed.data.lifecycleStatus,
      notes: cleanNotes,
    })
    .select(
      "id, passport_id, unit_id, recorded_by_label, state_of_health_pct, cycle_count, internal_resistance_mohm, lifecycle_status, notes, recorded_at",
    )
    .single();

  if (insertErr || !logRow) {
    return NextResponse.json(
      { error: "Could not append dynamic BMS log entry." },
      { status: 500 },
    );
  }

  await Promise.all([
    admin
      .from("workspace_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id),
    admin.from("audit_log").insert({
      org_id: keyRow.workspace_id,
      actor_user_id: null,
      action: "dynamic_bms_logged",
      target_type: "passport",
      target_id: id,
      metadata: {
        source: "rest_api_v1",
        api_key_id: keyRow.id,
        unit_id: unitId,
        lifecycle_status: parsed.data.lifecycleStatus,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, log: logRow }, { status: 201 });
}
