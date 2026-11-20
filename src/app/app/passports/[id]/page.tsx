import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/AppShell";
import {
  PassportReviewWorkspace,
  type VersionHistoryItem,
} from "@/components/workspace/PassportReviewWorkspace";
import type { SupplierRequestSummary } from "@/components/workspace/SupplierRequestsPanel";
import type { SerializedUnitSummary } from "@/components/workspace/SerializedUnitsPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { normalizeBatteryCategory } from "@/config/battery-fields";
import { isBillingEnabled } from "@/config/site";
import { describeOrgBillingState } from "@/lib/billing";
import { checkPublishEntitlement, resolveWorkspacePlan } from "@/lib/entitlements";
import { normalizeSupplierLocale } from "@/lib/supplier/i18n-zh";
import type { ExtractionResultMap } from "@/types/database";
import WorkspaceLoading from "../../loading";

async function PassportReviewLoader({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    notFound();
  }

  const ctx = await getWorkspaceContext();
  if (ctx.state === "unauthenticated") {
    redirect(`/login?next=/app/passports/${id}`);
  }
  if (ctx.state === "unconfigured") {
    return (
      <AppShell orgName="Setup required">
        <p className="text-[14px] text-[var(--muted)]">
          Configure Supabase keys in <code className="font-mono">.env.local</code> first.
        </p>
      </AppShell>
    );
  }
  if (ctx.state === "error") {
    return (
      <AppShell orgName="Workspace error" userEmail={ctx.userEmail}>
        <p className="text-[14px] text-red-900">{ctx.message}</p>
      </AppShell>
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) notFound();

  let passportData: {
    id: string;
    slug: string;
    status: string;
    record_mode?: string;
    working_fields: unknown;
    products: unknown;
  } | null = null;

  const [
    passportRes,
    versionsRes,
    uploadRes,
    pubCountRes,
    supplierRes,
    unitsRes,
    workspaceUnitsCountRes,
  ] = await Promise.all([
    supabase
      .from("passports")
      .select(
        "id, slug, status, record_mode, working_fields, products ( name, model_code )",
      )
      .eq("id", id)
      .eq("org_id", ctx.org.orgId)
      .single(),
    supabase
      .from("passport_versions")
      .select("id, version_number, declared_at, created_at")
      .eq("passport_id", id)
      .eq("org_id", ctx.org.orgId)
      .order("version_number", { ascending: false }),
    supabase
      .from("uploads")
      .select("extraction_result")
      .eq("passport_id", id)
      .eq("org_id", ctx.org.orgId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("passports")
      .select("id", { count: "exact", head: true })
      .eq("org_id", ctx.org.orgId)
      .eq("status", "published"),
    supabase
      .from("supplier_requests")
      .select(
        "id, supplier_name, supplier_email, requested_field_keys, default_locale, status, submitted_payload, uploaded_doc_path, expires_at, created_at, submitted_at",
      )
      .eq("passport_id", id)
      .eq("workspace_id", ctx.org.orgId)
      .order("created_at", { ascending: false }),
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

  if (!passportRes.error && passportRes.data) {
    passportData = passportRes.data;
  } else {
    const fallbackRes = await supabase
      .from("passports")
      .select("id, slug, status, working_fields, products ( name, model_code )")
      .eq("id", id)
      .eq("org_id", ctx.org.orgId)
      .single();
    if (!fallbackRes.error && fallbackRes.data) {
      passportData = { ...fallbackRes.data, record_mode: "full_passport" };
    }
  }

  if (!passportData) {
    notFound();
  }

  const productRel = (
    Array.isArray(passportData.products)
      ? passportData.products[0]
      : passportData.products
  ) as { name?: string; model_code?: string } | null;

  const versions: VersionHistoryItem[] = (versionsRes.data ?? []).map((v) => ({
    id: String(v.id),
    versionNumber: Number(v.version_number),
    declaredAt: String(v.declared_at),
    createdAt: String(v.created_at),
  }));

  const rawExtraction = uploadRes.data?.[0]?.extraction_result as
    | { fields?: ExtractionResultMap }
    | undefined;

  const workingFields =
    passportData.working_fields &&
    typeof passportData.working_fields === "object"
      ? (passportData.working_fields as Record<string, string>)
      : {};

  const billingEnabled = isBillingEnabled();
  const publishedPassportsCount = pubCountRes.count ?? 0;
  const isPublished = passportData.status === "published";
  const recordMode =
    passportData.record_mode === "simple_qr" ? "simple_qr" : "full_passport";
  const plan = resolveWorkspacePlan({
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });
  const publishEntitlement = checkPublishEntitlement({
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
    publishedPassportsCount,
    isAlreadyPublished: isPublished,
    action: isPublished ? "publish_new_version" : "publish",
  });
  const billingState = describeOrgBillingState({
    billingEnabled,
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });

  const supplierRequests: SupplierRequestSummary[] = supplierRes.error
    ? []
    : (supplierRes.data ?? []).map((row) => ({
        id: String(row.id),
        supplier_name: String(row.supplier_name ?? ""),
        supplier_email: String(row.supplier_email ?? ""),
        requested_field_keys: Array.isArray(row.requested_field_keys)
          ? (row.requested_field_keys as string[])
          : [],
        default_locale: normalizeSupplierLocale(row.default_locale),
        status:
          row.status === "submitted" ||
          row.status === "merged" ||
          row.status === "revoked"
            ? row.status
            : "open",
        submitted_payload:
          row.submitted_payload && typeof row.submitted_payload === "object"
            ? (row.submitted_payload as Record<string, string>)
            : {},
        uploaded_doc_path: row.uploaded_doc_path
          ? String(row.uploaded_doc_path)
          : null,
        expires_at: String(row.expires_at),
        created_at: String(row.created_at),
        submitted_at: row.submitted_at ? String(row.submitted_at) : null,
      }));

  const serializedUnits: SerializedUnitSummary[] = unitsRes.error
    ? []
    : (unitsRes.data ?? []).map((u) => ({
        id: String(u.id),
        serial_number: String(u.serial_number),
        gtin: u.gtin ? String(u.gtin) : null,
        batch_lot: u.batch_lot ? String(u.batch_lot) : null,
        manufacturing_date: u.manufacturing_date
          ? String(u.manufacturing_date)
          : null,
        unit_status: String(u.unit_status ?? "active"),
        created_at: String(u.created_at),
      }));

  const workspaceUnitsCount = workspaceUnitsCountRes.error
    ? 0
    : (workspaceUnitsCountRes.count ?? 0);

  return (
    <AppShell
      orgName={ctx.org.orgName}
      userEmail={ctx.user.email}
      billingLabel={billingState.badgeLabel}
    >
      <PassportReviewWorkspace
        passportId={String(passportData.id)}
        slug={String(passportData.slug)}
        initialStatus={isPublished ? "published" : "draft"}
        recordMode={recordMode}
        initialBatteryCategory={normalizeBatteryCategory(
          workingFields.battery_category,
        )}
        initialProductName={
          productRel?.name ? String(productRel.name) : "Untitled Battery Pack"
        }
        initialModelCode={productRel?.model_code ? String(productRel.model_code) : ""}
        initialFields={workingFields}
        extractionFields={rawExtraction?.fields}
        initialVersions={versions}
        initialSupplierRequests={supplierRequests}
        initialSerializedUnits={serializedUnits}
        initialWorkspaceUnitsCount={workspaceUnitsCount}
        canPublish={publishEntitlement.allowed}
        workspacePlan={plan}
        publishedPassportsCount={publishedPassportsCount}
        siteUrlConfigured={process.env.NEXT_PUBLIC_SITE_URL}
      />
    </AppShell>
  );
}

export default function PassportReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <PassportReviewLoader paramsPromise={params} />
    </Suspense>
  );
}
