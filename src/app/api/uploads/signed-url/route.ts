import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { checkDailyExtractionEntitlement } from "@/lib/entitlements";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  SPEC_PDFS_BUCKET,
  SignedUploadValidationError,
  buildScopedPdfStoragePath,
  validateSignedUploadRequest,
} from "@/lib/storage/signed-uploads";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

/**
 * Authenticated direct-to-Supabase signed upload URL generator for `spec-pdfs`.
 * Strictly derives `orgId` from the authenticated workspace session (never client input).
 */
export async function POST(request: Request) {
  const ctx = await getWorkspaceContext();
  if (ctx.state === "unconfigured") {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 },
    );
  }
  if (ctx.state === "unauthenticated") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (ctx.state === "error") {
    return NextResponse.json({ error: ctx.message }, { status: 500 });
  }

  const allowed = await enforceRateLimit(
    `signed-upload:user:${ctx.user.id}`,
    20,
    60,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Wait a minute before trying again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: {
    fileName?: unknown;
    fileSize?: unknown;
    mimeType?: unknown;
    purpose?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawPurpose = body.purpose === undefined ? "spec" : body.purpose;
  if (rawPurpose !== "spec" && rawPurpose !== "doc") {
    return NextResponse.json(
      { error: "Invalid upload purpose. Expected 'spec' or 'doc'." },
      { status: 400 },
    );
  }

  try {
    validateSignedUploadRequest({
      fileName: body.fileName,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      maxBytes: siteConfig.maxUploadBytes,
    });
  } catch (err) {
    if (err instanceof SignedUploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Invalid PDF upload request." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database session unavailable." },
      { status: 503 },
    );
  }

  // Pre-check daily PDF extraction quota before minting a spec upload URL
  if (rawPurpose === "spec") {
    const { data: dailyCountRaw, error: dailyErr } = await supabase.rpc(
      "get_org_daily_extraction_count",
      { p_org_id: ctx.org.orgId },
    );
    if (dailyErr) {
      return NextResponse.json(
        { error: "Failed to check organization daily extraction quota." },
        { status: 500 },
      );
    }
    const dailyCount = typeof dailyCountRaw === "number" ? dailyCountRaw : 0;
    const extractionEntitlement = checkDailyExtractionEntitlement({
      billingStatus: ctx.org.billingStatus,
      compEnabled: ctx.org.compEnabled,
      dailyUsed: dailyCount,
    });
    if (!extractionEntitlement.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI PDF limit reached (${extractionEntitlement.limit ?? siteConfig.dailyExtractionLimitPerOrg} PDFs/day on Free plan). Upgrade to Pro (€79/mo) for unlimited PDF checks, use Blank Draft mode, or try again tomorrow.`,
          code: "PLAN_LIMIT_REACHED",
        },
        { status: 429 },
      );
    }
  }

  const path = buildScopedPdfStoragePath({
    purpose: rawPurpose,
    orgId: ctx.org.orgId,
  });

  const storageClient = createAdminSupabaseClient() ?? supabase;
  const { data, error } = await storageClient.storage
    .from(SPEC_PDFS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl || !data?.token) {
    return NextResponse.json(
      { error: "Failed to create signed upload URL for private storage." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path || path,
  });
}
