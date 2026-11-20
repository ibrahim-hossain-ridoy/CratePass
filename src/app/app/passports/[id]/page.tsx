import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/AppShell";
import {
  PassportReviewWorkspace,
  type VersionHistoryItem,
} from "@/components/workspace/PassportReviewWorkspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import { normalizeBatteryCategory } from "@/config/battery-fields";
import { isBillingEnabled } from "@/config/site";
import { describeOrgBillingState } from "@/lib/billing";
import { canOrgPublish } from "@/lib/publish";
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

  const [passportRes, versionsRes, uploadRes] = await Promise.all([
    supabase
      .from("passports")
      .select("id, slug, status, working_fields, products ( name, model_code )")
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
  ]);

  if (passportRes.error || !passportRes.data) {
    notFound();
  }

  const productRel = Array.isArray(passportRes.data.products)
    ? passportRes.data.products[0]
    : passportRes.data.products;

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
    passportRes.data.working_fields &&
    typeof passportRes.data.working_fields === "object"
      ? (passportRes.data.working_fields as Record<string, string>)
      : {};

  const billingEnabled = isBillingEnabled();
  const canPublish = canOrgPublish({
    billingEnabled,
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });
  const billingState = describeOrgBillingState({
    billingEnabled,
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });

  return (
    <AppShell
      orgName={ctx.org.orgName}
      userEmail={ctx.user.email}
      billingLabel={billingState.badgeLabel}
    >
      <PassportReviewWorkspace
        passportId={String(passportRes.data.id)}
        slug={String(passportRes.data.slug)}
        initialStatus={
          passportRes.data.status === "published" ? "published" : "draft"
        }
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
        canPublish={canPublish}
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
