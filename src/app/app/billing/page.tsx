import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/AppShell";
import { BillingWorkspace } from "@/components/workspace/BillingWorkspace";
import { getPaddleEnv, isBillingEnabled } from "@/config/site";
import {
  describeOrgBillingState,
  getBillingProvider,
  isTestBillingSimulationAllowed,
} from "@/lib/billing";
import { getWorkspaceContext } from "@/lib/workspace/context";
import WorkspaceLoading from "../loading";

async function BillingLoader({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ checkout?: string }>;
}) {
  const ctx = await getWorkspaceContext();
  if (ctx.state === "unauthenticated") {
    redirect("/login?next=/app/billing");
  }

  if (ctx.state === "unconfigured") {
    return (
      <AppShell orgName="Setup required">
        <div className="rounded-[12px] bg-[#fdf6ec] p-5 text-[14px] text-[#7c380b]">
          <h1 className="font-display text-[18px] font-semibold">
            Configure Supabase environment variables to open /app/billing
          </h1>
          <p className="mt-2">
            Add Supabase keys in <code className="font-mono">.env.local</code> first, or inspect{" "}
            <Link href="/demo" className="font-semibold underline">
              /demo
            </Link>
            .
          </p>
        </div>
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

  const sp = await searchParamsPromise;
  const billingEnabled = isBillingEnabled();
  const provider = getBillingProvider();
  const displayState = describeOrgBillingState({
    billingEnabled,
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });

  const checkoutNotice =
    sp.checkout === "success"
      ? "success"
      : sp.checkout === "canceled"
        ? "canceled"
        : undefined;

  return (
    <AppShell
      orgName={ctx.org.orgName}
      userEmail={ctx.user.email}
      billingLabel={displayState.badgeLabel}
    >
      <BillingWorkspace
        orgName={ctx.org.orgName}
        role={ctx.org.role}
        billingStatus={ctx.org.billingStatus}
        compEnabled={ctx.org.compEnabled}
        paddleEnv={getPaddleEnv()}
        checkoutConfigured={provider.isCheckoutConfigured()}
        testSimulationEnabled={isTestBillingSimulationAllowed()}
        displayState={displayState}
        checkoutNotice={checkoutNotice}
      />
    </AppShell>
  );
}

export default function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <BillingLoader searchParamsPromise={searchParams} />
    </Suspense>
  );
}
