import { NextResponse } from "next/server";
import { getBillingProvider, PaddleConfigError } from "@/lib/billing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

function resolveSafeBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
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
      { error: "Only organization owners can initiate billing checkout." },
      { status: 403 },
    );
  }

  if (ctx.org.compEnabled || ctx.org.billingStatus === "active") {
    return NextResponse.json(
      { error: "This organization is already cleared for publishing." },
      { status: 400 },
    );
  }

  const provider = getBillingProvider();
  const baseUrl = resolveSafeBaseUrl(request);

  try {
    const session = await provider.createCheckoutSession({
      orgId: ctx.org.orgId,
      orgSlug: ctx.org.orgSlug,
      customerEmail: ctx.user.email,
      successUrl: `${baseUrl}/app/billing?checkout=success`,
      cancelUrl: `${baseUrl}/app/billing?checkout=canceled`,
    });

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.from("audit_log").insert({
        org_id: ctx.org.orgId,
        actor_user_id: ctx.user.id,
        action: "billing.checkout_created",
        target_type: "organization",
        target_id: ctx.org.orgId,
        metadata: {
          provider: session.provider,
          mode: session.mode,
          transaction_id: session.transactionId,
        },
      });
    }

    return NextResponse.json({ ok: true, ...session });
  } catch (err) {
    if (err instanceof PaddleConfigError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Unable to start Paddle checkout session." },
      { status: 502 },
    );
  }
}
