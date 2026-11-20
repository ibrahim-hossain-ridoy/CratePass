import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeFieldValues } from "@/lib/passport-projection";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeSupplierSubmission } from "@/lib/supplier/tokens";
import { getWorkspaceContext } from "@/lib/workspace/context";

const PatchSupplierRequestSchema = z.object({
  action: z.enum(["revoke", "merge"]),
  selectedKeys: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; requestId: string }> },
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

  const { id, requestId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(requestId)) {
    return NextResponse.json({ error: "Invalid identifier." }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = PatchSupplierRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action payload." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database session unavailable." }, { status: 503 });
  }

  const { data: reqRow, error: reqErr } = await supabase
    .from("supplier_requests")
    .select(
      "id, workspace_id, passport_id, supplier_name, requested_field_keys, status, submitted_payload, uploaded_doc_path",
    )
    .eq("id", requestId)
    .eq("passport_id", id)
    .eq("workspace_id", ctx.org.orgId)
    .single();

  if (reqErr || !reqRow) {
    return NextResponse.json({ error: "Supplier request not found." }, { status: 404 });
  }

  if (parsed.data.action === "revoke") {
    if (reqRow.status === "merged") {
      return NextResponse.json(
        { error: "Merged supplier requests cannot be revoked." },
        { status: 400 },
      );
    }

    const { error: revErr } = await supabase
      .from("supplier_requests")
      .update({ status: "revoked" })
      .eq("id", requestId)
      .eq("workspace_id", ctx.org.orgId);

    if (revErr) {
      return NextResponse.json(
        { error: "Could not revoke supplier link." },
        { status: 500 },
      );
    }

    await supabase.from("audit_log").insert({
      org_id: ctx.org.orgId,
      actor_user_id: ctx.user.id,
      action: "supplier_request_revoked",
      target_type: "supplier_request",
      target_id: requestId,
      metadata: { passport_id: id },
    });

    return NextResponse.json({ ok: true, status: "revoked" });
  }

  // Action: merge supplier submission into passport draft working_fields (NEVER auto-publishes)
  if (reqRow.status !== "submitted") {
    return NextResponse.json(
      { error: "Only submitted supplier responses can be merged into draft." },
      { status: 400 },
    );
  }

  const { data: passportRow, error: passportErr } = await supabase
    .from("passports")
    .select("id, working_fields")
    .eq("id", id)
    .eq("org_id", ctx.org.orgId)
    .single();

  if (passportErr || !passportRow) {
    return NextResponse.json({ error: "Passport not found." }, { status: 404 });
  }

  const requestedKeys = Array.isArray(reqRow.requested_field_keys)
    ? (reqRow.requested_field_keys as string[])
    : [];
  const submittedRaw =
    reqRow.submitted_payload && typeof reqRow.submitted_payload === "object"
      ? (reqRow.submitted_payload as Record<string, unknown>)
      : {};

  const sanitizedIncoming = sanitizeSupplierSubmission(requestedKeys, submittedRaw);
  const selectedKeySet = parsed.data.selectedKeys
    ? new Set(parsed.data.selectedKeys)
    : null;

  const currentWorking =
    passportRow.working_fields && typeof passportRow.working_fields === "object"
      ? (passportRow.working_fields as Record<string, unknown>)
      : {};

  const mergedCandidate: Record<string, unknown> = { ...currentWorking };
  const mergedKeys: string[] = [];

  for (const [key, val] of Object.entries(sanitizedIncoming)) {
    if (selectedKeySet && !selectedKeySet.has(key)) continue;
    mergedCandidate[key] = val;
    mergedKeys.push(key);
  }

  const cleanMergedFields = normalizeFieldValues(mergedCandidate);

  const { error: updatePassportErr } = await supabase
    .from("passports")
    .update({ working_fields: cleanMergedFields })
    .eq("id", id)
    .eq("org_id", ctx.org.orgId);

  if (updatePassportErr) {
    return NextResponse.json(
      { error: "Could not merge supplier values into passport draft." },
      { status: 500 },
    );
  }

  const { data: mergedRows, error: markMergedErr } = await supabase
    .from("supplier_requests")
    .update({ status: "merged" })
    .eq("id", requestId)
    .eq("workspace_id", ctx.org.orgId)
    .eq("status", "submitted")
    .select("id");

  if (markMergedErr || !mergedRows || mergedRows.length === 0) {
    return NextResponse.json(
      { error: "Merged fields into draft, but request status was already finalized." },
      { status: 409 },
    );
  }

  await supabase.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "supplier_submission_merged",
    target_type: "supplier_request",
    target_id: requestId,
    metadata: {
      passport_id: id,
      supplier_name: reqRow.supplier_name,
      merged_keys: mergedKeys,
      merged_count: mergedKeys.length,
      uploaded_doc_path: reqRow.uploaded_doc_path ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    status: "merged",
    mergedKeys,
    workingFields: cleanMergedFields,
  });
}
