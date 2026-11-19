import { NextResponse } from "next/server";
import { isTestBillingSimulationAllowed } from "@/lib/billing";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace/context";
import type { BillingStatus } from "@/types/database";

const MAX_BODY_BYTES = 4 * 1024;

export async function POST(request: Request) {
  if (!isTestBillingSimulationAllowed()) {
    return NextResponse.json(
      { error: "Test billing simulation is disabled in this environment." },
      { status: 403 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

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
      { error: "Only organization owners can run test billing actions." },
      { status: 403 },
    );
  }

  const allowed = await enforceRateLimit(
    `billing-sim:user:${ctx.user.id}`,
    20,
    60,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many test billing requests. Wait a minute and retry." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: { action?: string } = {};
  try {
    body = JSON.parse(rawBody || "{}") as { action?: string };
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  if (body.action !== "upgrade" && body.action !== "reset") {
    return NextResponse.json(
      { error: "Invalid action. Expected 'upgrade' or 'reset'." },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is required in .env.local to update organization billing status during local test simulation.",
      },
      { status: 503 },
    );
  }

  const nextStatus: BillingStatus = body.action === "upgrade" ? "active" : "free";
  const auditAction =
    body.action === "upgrade"
      ? "billing.test_simulation_upgraded"
      : "billing.test_simulation_reset";

  const { error: updateError } = await admin
    .from("organizations")
    .update({ billing_status: nextStatus })
    .eq("id", ctx.org.orgId);

  if (updateError) {
    return NextResponse.json(
      { error: "Could not update organization plan status." },
      { status: 500 },
    );
  }

  await admin.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: auditAction,
    target_type: "organization",
    target_id: ctx.org.orgId,
    metadata: {
      simulated: true,
      previous_status: ctx.org.billingStatus,
      next_status: nextStatus,
    },
  });

  return NextResponse.json({
    ok: true,
    billingStatus: nextStatus,
    simulated: true,
  });
}
