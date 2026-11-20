import { NextResponse } from "next/server";
import { z } from "zod";
import { checkSerializedUnitsEntitlement } from "@/lib/entitlements";
import { parseSerializedUnitsCsv } from "@/lib/serialization/csv";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

const ImportUnitsSchema = z.object({
  csvText: z.string().min(1).max(2_000_000),
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

  const [unitsRes, totalWorkspaceRes] = await Promise.all([
    supabase
      .from("passport_units")
      .select(
        "id, serial_number, gtin, batch_lot, manufacturing_date, unit_status, created_at",
      )
      .eq("passport_id", id)
      .eq("workspace_id", ctx.org.orgId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("passport_units")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.org.orgId),
  ]);

  if (unitsRes.error) {
    return NextResponse.json(
      {
        error:
          "Could not load serialized units. Confirm migration 202611200002_passport_units_serialization.sql has been applied.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    units: unitsRes.data ?? [],
    workspaceUnitsCount: totalWorkspaceRes.count ?? 0,
  });
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

  const parsed = ImportUnitsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide non-empty CSV content in csvText." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  // Verify passport ownership
  const { data: passportRow, error: passportErr } = await supabase
    .from("passports")
    .select("id, slug")
    .eq("id", id)
    .eq("org_id", ctx.org.orgId)
    .single();

  if (passportErr || !passportRow) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  // Fetch existing serials for this passport + total units across workspace
  const [existingRes, workspaceCountRes] = await Promise.all([
    supabase
      .from("passport_units")
      .select("serial_number")
      .eq("passport_id", id)
      .eq("workspace_id", ctx.org.orgId),
    supabase
      .from("passport_units")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.org.orgId),
  ]);

  if (existingRes.error) {
    return NextResponse.json(
      {
        error:
          "Could not query passport_units table. Confirm migration 202611200002_passport_units_serialization.sql has been applied.",
      },
      { status: 500 },
    );
  }

  const existingSerials = (existingRes.data ?? []).map((r) =>
    String(r.serial_number),
  );
  const currentWorkspaceUnits = workspaceCountRes.count ?? 0;

  const csvResult = parseSerializedUnitsCsv(parsed.data.csvText, existingSerials);
  if (csvResult.validRows.length === 0) {
    return NextResponse.json(
      {
        error:
          csvResult.errors[0]?.message ?? "No valid unit rows found in CSV.",
        validationErrors: csvResult.errors.slice(0, 25),
      },
      { status: 400 },
    );
  }

  // Enforce Free plan 25-unit workspace cap vs Pro unlimited
  const entitlement = checkSerializedUnitsEntitlement({
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
    currentUnitsCount: currentWorkspaceUnits,
    incomingUnitsCount: csvResult.validRows.length,
  });

  if (!entitlement.allowed) {
    return NextResponse.json(
      {
        error: entitlement.reason,
        code: entitlement.code ?? "PLAN_LIMIT_REACHED",
        limitType: "serialized_units",
        limit: entitlement.limit,
        current: entitlement.current,
        remaining: entitlement.remaining,
      },
      { status: 402 },
    );
  }

  const insertRows = csvResult.validRows.map((row) => ({
    workspace_id: ctx.org.orgId,
    passport_id: id,
    serial_number: row.serial_number,
    gtin: row.gtin,
    batch_lot: row.batch_lot,
    manufacturing_date: row.manufacturing_date,
    unit_status: "active",
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("passport_units")
    .insert(insertRows)
    .select(
      "id, serial_number, gtin, batch_lot, manufacturing_date, unit_status, created_at",
    );

  if (insertErr) {
    return NextResponse.json(
      { error: "Batch insert failed. Check for duplicate serial numbers." },
      { status: 409 },
    );
  }

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "passport_units_imported",
    target_type: "passport",
    target_id: id,
    metadata: {
      slug: passportRow.slug,
      imported_count: inserted?.length ?? insertRows.length,
      skipped_errors_count: csvResult.errors.length,
    },
  });

  return NextResponse.json({
    ok: true,
    importedCount: inserted?.length ?? insertRows.length,
    units: inserted ?? [],
    validationErrors: csvResult.errors.slice(0, 25),
    workspaceUnitsCount:
      currentWorkspaceUnits + (inserted?.length ?? insertRows.length),
  });
}

export async function DELETE(
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
  const url = new URL(request.url);
  const unitId = url.searchParams.get("unitId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(unitId)) {
    return NextResponse.json({ error: "Invalid identifier." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { error } = await supabase
    .from("passport_units")
    .delete()
    .eq("id", unitId)
    .eq("passport_id", id)
    .eq("workspace_id", ctx.org.orgId);

  if (error) {
    return NextResponse.json({ error: "Could not delete serialized unit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deletedUnitId: unitId });
}
