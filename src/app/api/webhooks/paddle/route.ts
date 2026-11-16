import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  getBillingProvider,
  PaddleConfigError,
  PaddleSignatureError,
} from "@/lib/billing";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paddle-signature");
  const provider = getBillingProvider();

  if (!provider.isWebhookConfigured()) {
    return NextResponse.json(
      { error: "Paddle webhook secret is not configured." },
      { status: 503 },
    );
  }

  let parsed;
  try {
    parsed = provider.verifyWebhook(rawBody, signatureHeader);
  } catch (err) {
    if (err instanceof PaddleConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof PaddleSignatureError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ZodError || err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to verify webhook." }, { status: 400 });
  }

  if (parsed.kind === "ignored") {
    return NextResponse.json({ ok: true, ignored: true, eventType: parsed.eventType });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server Supabase admin credentials unavailable." },
      { status: 503 },
    );
  }

  const { event } = parsed;

  // Idempotency guard against Paddle retries
  const { data: existingEvent } = await admin
    .from("audit_log")
    .select("id")
    .eq("action", "billing.webhook_processed")
    .eq("org_id", event.orgId)
    .filter("metadata->>event_id", "eq", event.eventId)
    .limit(1);

  if (existingEvent && existingEvent.length > 0) {
    return NextResponse.json({ ok: true, duplicate: true, eventId: event.eventId });
  }

  const { data: updatedOrg, error: updateErr } = await admin
    .from("organizations")
    .update({
      billing_provider: "paddle",
      ...(event.customerId ? { billing_customer_id: event.customerId } : {}),
      ...(event.subscriptionId
        ? { billing_subscription_id: event.subscriptionId }
        : {}),
      billing_status: event.billingStatus,
    })
    .eq("id", event.orgId)
    .select("id")
    .maybeSingle();

  if (updateErr || !updatedOrg) {
    return NextResponse.json(
      { error: "Target organization not found or update failed." },
      { status: 404 },
    );
  }

  await admin.from("audit_log").insert({
    org_id: event.orgId,
    actor_user_id: null,
    action: "billing.webhook_processed",
    target_type: "organization",
    target_id: event.orgId,
    metadata: {
      provider: "paddle",
      event_id: event.eventId,
      event_type: event.eventType,
      billing_status: event.billingStatus,
      subscription_id: event.subscriptionId,
    },
  });

  return NextResponse.json({
    ok: true,
    orgId: event.orgId,
    billingStatus: event.billingStatus,
  });
}
