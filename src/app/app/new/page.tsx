import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/workspace/AppShell";
import { NewPassportFlow } from "@/components/workspace/NewPassportFlow";
import { FREE_PLAN_LIMITS } from "@/config/plans";
import { isBillingEnabled, siteConfig } from "@/config/site";
import { describeOrgBillingState } from "@/lib/billing";
import { resolveWorkspacePlan } from "@/lib/entitlements";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import WorkspaceLoading from "../loading";

async function NewPassportLoader() {
  await connection();
  const ctx = await getWorkspaceContext();

  if (ctx.state === "unauthenticated") {
    redirect("/login?next=/app/new");
  }

  if (ctx.state === "unconfigured") {
    return (
      <AppShell orgName="Setup required">
        <div className="rounded-[10px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-5 text-[14px] text-[var(--notice-ink)]">
          <h1 className="text-[18px] font-semibold">Supabase setup required</h1>
          <p className="mt-1.5">
            Configure <code className="font-mono">.env.local</code> before uploading spec
            PDFs.
          </p>
          <Link
            href="/app"
            className="mt-4 inline-flex min-h-[40px] items-center rounded-[8px] border border-[var(--notice-border)] bg-[var(--surface)] px-3.5 font-semibold text-[var(--ink)]"
          >
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  if (ctx.state === "error") {
    return (
      <AppShell orgName="Workspace error" userEmail={ctx.userEmail}>
        <div
          role="alert"
          className="rounded-[10px] border border-red-300 bg-red-50 p-5 text-[14px] text-red-900"
        >
          {ctx.message}
        </div>
      </AppShell>
    );
  }

  const supabase = await createServerSupabaseClient();
  let dailyUsed = 0;
  if (supabase) {
    const { data } = await supabase.rpc("get_org_daily_extraction_count", {
      p_org_id: ctx.org.orgId,
    });
    dailyUsed = typeof data === "number" ? data : 0;
  }

  const plan = resolveWorkspacePlan({
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });
  const billingState = describeOrgBillingState({
    billingEnabled: isBillingEnabled(),
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });

  return (
    <AppShell
      orgName={ctx.org.orgName}
      userEmail={ctx.user.email}
      billingLabel={billingState.badgeLabel}
    >
      <NewPassportFlow
        dailyUsed={dailyUsed}
        dailyLimit={
          plan === "pro"
            ? 999
            : (FREE_PLAN_LIMITS.dailyPdfExtractions ?? siteConfig.dailyExtractionLimitPerOrg)
        }
        maxUploadMb={Math.round(siteConfig.maxUploadBytes / (1024 * 1024))}
      />
    </AppShell>
  );
}

export default function NewPassportPage() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <NewPassportLoader />
    </Suspense>
  );
}
