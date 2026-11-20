import { resolveCname } from "node:dns/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CNAME_TARGET,
  normalizeCustomDomain,
  validateBrandAccentHex,
} from "@/lib/branding/domain";
import {
  MAX_BRAND_LOGO_BYTES,
  validateBrandLogoUpload,
} from "@/lib/branding/logo";
import { hasProFeatureAccess } from "@/lib/entitlements";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";

const BrandingPatchSchema = z.object({
  brandAccentHex: z.string().nullable().optional(),
  customDomain: z.string().nullable().optional(),
  checkDns: z.boolean().optional(),
  removeLogo: z.boolean().optional(),
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
    .from("organizations")
    .select(
      "brand_logo_url, brand_accent_hex, custom_domain, custom_domain_verified",
    )
    .eq("id", ctx.org.orgId)
    .single();

  if (error) {
    return NextResponse.json({
      isPro: hasProFeatureAccess({
        billingStatus: ctx.org.billingStatus,
        compEnabled: ctx.org.compEnabled,
      }),
      brandLogoUrl: null,
      brandAccentHex: "#145b6e",
      customDomain: null,
      customDomainActive: false,
      cnameTarget: CNAME_TARGET,
    });
  }

  return NextResponse.json({
    isPro: hasProFeatureAccess({
      billingStatus: ctx.org.billingStatus,
      compEnabled: ctx.org.compEnabled,
    }),
    brandLogoUrl: data?.brand_logo_url ?? null,
    brandAccentHex: data?.brand_accent_hex ?? "#145b6e",
    customDomain: data?.custom_domain ?? null,
    customDomainActive: Boolean(data?.custom_domain_verified),
    cnameTarget: CNAME_TARGET,
  });
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
      { error: "Only workspace owners can edit branding and custom domain settings." },
      { status: 403 },
    );
  }

  const isPro = hasProFeatureAccess({
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });
  if (!isPro) {
    return NextResponse.json(
      {
        error:
          "Custom branding and subdomains are Pro features (€79/mo). Upgrade in Plan & Billing to save.",
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 402 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = BrandingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid branding settings payload." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to update workspace settings." },
      { status: 503 },
    );
  }

  const { data: currentOrg } = await admin
    .from("organizations")
    .select(
      "brand_logo_url, brand_accent_hex, custom_domain, custom_domain_verified",
    )
    .eq("id", ctx.org.orgId)
    .single();

  const patch: Record<string, unknown> = {};
  let dnsCheckDetail: string | undefined;

  if (parsed.data.brandAccentHex !== undefined) {
    if (parsed.data.brandAccentHex === null || parsed.data.brandAccentHex.trim() === "") {
      patch.brand_accent_hex = null;
    } else {
      const hex = validateBrandAccentHex(parsed.data.brandAccentHex);
      if (!hex) {
        return NextResponse.json(
          { error: "Accent color must be a valid 6-digit hex code (e.g. #145b6e)." },
          { status: 400 },
        );
      }
      patch.brand_accent_hex = hex;
    }
  }

  if (parsed.data.removeLogo) {
    patch.brand_logo_url = null;
  }

  let targetDomain = currentOrg?.custom_domain
    ? String(currentOrg.custom_domain)
    : null;

  if (parsed.data.customDomain !== undefined) {
    if (parsed.data.customDomain === null || parsed.data.customDomain.trim() === "") {
      patch.custom_domain = null;
      patch.custom_domain_verified = false;
      targetDomain = null;
    } else {
      const normalized = normalizeCustomDomain(parsed.data.customDomain);
      if (!normalized) {
        return NextResponse.json(
          {
            error:
              "Enter a valid custom subdomain such as pass.myebike.eu (excluding cratepass.app or localhost).",
          },
          { status: 400 },
        );
      }
      patch.custom_domain = normalized;
      if (normalized !== currentOrg?.custom_domain) {
        patch.custom_domain_verified = false;
      }
      targetDomain = normalized;
    }
  }

  if (parsed.data.checkDns) {
    if (!targetDomain) {
      return NextResponse.json(
        { error: "Save a custom domain first before checking DNS." },
        { status: 400 },
      );
    }
    try {
      const records = await resolveCname(targetDomain);
      const matched = records.some(
        (rec) => rec.replace(/\.+$/, "").toLowerCase() === CNAME_TARGET,
      );
      patch.custom_domain_verified = matched;
      dnsCheckDetail = matched
        ? `CNAME record matched ${CNAME_TARGET}. Custom subdomain routing is now active.`
        : `Found CNAME (${records.join(", ")}), expected ${CNAME_TARGET}.`;
    } catch {
      patch.custom_domain_verified = false;
      dnsCheckDetail = `No CNAME record pointing to ${CNAME_TARGET} detected yet for ${targetDomain}. DNS propagation can take up to 30 minutes.`;
    }
  }

  const { data: updated, error: updateErr } = await admin
    .from("organizations")
    .update(patch)
    .eq("id", ctx.org.orgId)
    .select(
      "brand_logo_url, brand_accent_hex, custom_domain, custom_domain_verified",
    )
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      {
        error:
          "Could not save workspace branding. Confirm migration 202611200003_simple_qr_and_branding.sql has been applied.",
      },
      { status: 500 },
    );
  }

  await admin.from("audit_log").insert({
    org_id: ctx.org.orgId,
    actor_user_id: ctx.user.id,
    action: "branding_settings_updated",
    target_type: "organization",
    target_id: ctx.org.orgId,
    metadata: {
      custom_domain: updated.custom_domain ?? null,
      dns_active: Boolean(updated.custom_domain_verified),
      accent_hex: updated.brand_accent_hex ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    brandLogoUrl: updated.brand_logo_url ?? null,
    brandAccentHex: updated.brand_accent_hex ?? "#145b6e",
    customDomain: updated.custom_domain ?? null,
    customDomainActive: Boolean(updated.custom_domain_verified),
    dnsCheckDetail,
  });
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
      { error: "Only workspace owners can upload brand logos." },
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
        error: "Brand logo upload is a Pro feature (€79/mo).",
        code: "PLAN_LIMIT_REACHED",
      },
      { status: 402 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart upload." }, { status: 400 });
  }

  const logoFile = formData.get("logo");
  if (!(logoFile instanceof File)) {
    return NextResponse.json({ error: "Attach a logo image under field 'logo'." }, { status: 400 });
  }

  if (logoFile.size <= 0 || logoFile.size > MAX_BRAND_LOGO_BYTES) {
    return NextResponse.json(
      { error: "Brand logo must be between 1 byte and 2 MB." },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await logoFile.arrayBuffer());
  let ext: string;
  let normalizedMime: string;
  try {
    const validated = validateBrandLogoUpload({
      bytes,
      mimeType: logoFile.type || "",
    });
    ext = validated.ext;
    normalizedMime = validated.normalizedMime;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Supported logo formats: PNG, JPEG, WebP, or safe SVG.",
      },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to upload workspace logos." },
      { status: 503 },
    );
  }

  const storagePath = `${ctx.org.orgId}/brand-logo.${ext}`;

  const { error: uploadErr } = await admin.storage
    .from("brand-assets")
    .upload(storagePath, bytes, {
      contentType: normalizedMime,
      upsert: true,
    });

  if (uploadErr) {
    return NextResponse.json(
      {
        error:
          "Failed to upload logo to brand-assets bucket. Confirm migration 202611200003_simple_qr_and_branding.sql has been applied.",
      },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("brand-assets").getPublicUrl(storagePath);

  const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateErr } = await admin
    .from("organizations")
    .update({ brand_logo_url: cacheBustedUrl })
    .eq("id", ctx.org.orgId);

  if (updateErr) {
    return NextResponse.json(
      { error: "Uploaded logo but could not update workspace settings." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, brandLogoUrl: cacheBustedUrl });
}
