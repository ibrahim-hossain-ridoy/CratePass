import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  DynamicBmsEntrySchema,
  escapePostgresLikePattern,
  sanitizeDynamicBmsNotes,
  verifyServicePin,
} from "@/lib/service/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ServicePortalPostSchema = DynamicBmsEntrySchema.extend({
  pin: z.string().trim().min(4).max(16),
});

/**
 * Dealer / Repairer SoH & Lifecycle Update Portal endpoint: POST /api/service/[slug]
 * Validates workspace-issued repairer/recycler PIN server-side and appends strictly
 * to `dynamic_bms_logs` without mutating immutable static snapshots.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid passport slug." }, { status: 400 });
  }

  const forwardedIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await enforceRateLimit(
    `service-pin:${slug.toLowerCase()}:${forwardedIp.slice(0, 40)}`,
    15,
    60,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many PIN attempts. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = ServicePortalPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Invalid service log submission.",
      },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service portal backend is not configured." },
      { status: 503 },
    );
  }

  const { data: passportRow, error: passportErr } = await admin
    .from("passports")
    .select("id, org_id, slug, status")
    .eq("slug", slug.toLowerCase())
    .eq("status", "published")
    .single();

  if (passportErr || !passportRow) {
    return NextResponse.json(
      { error: "Published battery passport not found." },
      { status: 404 },
    );
  }

  const { data: tokens, error: tokenErr } = await admin
    .from("service_access_tokens")
    .select("id, label, pin_hash, role")
    .eq("workspace_id", passportRow.org_id)
    .eq("active", true);

  if (tokenErr || !tokens || tokens.length === 0) {
    return NextResponse.json(
      { error: "Invalid service access PIN." },
      { status: 401 },
    );
  }

  // Evaluate all active workspace PIN hashes without early exit to avoid slot timing leaks
  let matchedToken: (typeof tokens)[number] | undefined;
  for (const t of tokens) {
    const ok = verifyServicePin(
      String(passportRow.org_id),
      parsed.data.pin,
      String(t.pin_hash),
    );
    if (ok && !matchedToken) {
      matchedToken = t;
    }
  }

  if (!matchedToken) {
    return NextResponse.json(
      { error: "Invalid service access PIN." },
      { status: 401 },
    );
  }

  // Optional unit serial lookup (escape LIKE wildcards so %/_ match literally)
  let unitId: string | null = null;
  if (parsed.data.serialNumber) {
    const escapedSerial = escapePostgresLikePattern(parsed.data.serialNumber);
    const { data: unitRow } = await admin
      .from("passport_units")
      .select("id")
      .eq("passport_id", passportRow.id)
      .eq("workspace_id", passportRow.org_id)
      .ilike("serial_number", escapedSerial)
      .limit(1)
      .single();

    if (unitRow?.id) {
      unitId = String(unitRow.id);
    }
  }

  const cleanNotes = sanitizeDynamicBmsNotes(parsed.data.notes ?? "");
  const recordedByLabel = `${matchedToken.label} (${matchedToken.role})`;

  const { data: insertedLog, error: logErr } = await admin
    .from("dynamic_bms_logs")
    .insert({
      workspace_id: passportRow.org_id,
      passport_id: passportRow.id,
      unit_id: unitId,
      recorded_by_label: recordedByLabel,
      state_of_health_pct: parsed.data.stateOfHealthPct ?? null,
      cycle_count: parsed.data.cycleCount ?? null,
      internal_resistance_mohm: parsed.data.internalResistanceMohm ?? null,
      lifecycle_status: parsed.data.lifecycleStatus,
      notes: cleanNotes,
    })
    .select(
      "id, recorded_by_label, state_of_health_pct, cycle_count, internal_resistance_mohm, lifecycle_status, notes, recorded_at",
    )
    .single();

  if (logErr || !insertedLog) {
    return NextResponse.json(
      { error: "Could not record dynamic BMS update." },
      { status: 500 },
    );
  }

  // Keep unit lifecycle status synchronized when updating a specific serialized unit
  if (unitId) {
    const mappedUnitStatus =
      parsed.data.lifecycleStatus === "original"
        ? "active"
        : parsed.data.lifecycleStatus;
    await admin
      .from("passport_units")
      .update({ unit_status: mappedUnitStatus })
      .eq("id", unitId)
      .eq("workspace_id", passportRow.org_id);
  }

  await admin.from("audit_log").insert({
    org_id: passportRow.org_id,
    actor_user_id: null,
    action: "dynamic_bms_logged",
    target_type: "passport",
    target_id: passportRow.id,
    metadata: {
      source: "service_portal_pin",
      recorded_by: recordedByLabel,
      unit_id: unitId,
      lifecycle_status: parsed.data.lifecycleStatus,
      state_of_health_pct: parsed.data.stateOfHealthPct ?? null,
    },
  });

  return NextResponse.json({ ok: true, log: insertedLog }, { status: 201 });
}
