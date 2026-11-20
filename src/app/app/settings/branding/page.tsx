import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/AppShell";
import { BrandingSettingsWorkspace } from "@/components/workspace/BrandingSettingsWorkspace";
import { isBillingEnabled } from "@/config/site";
import { describeOrgBillingState } from "@/lib/billing";
import { loadWorkspaceBrandingAndServiceSettings } from "@/lib/branding/workspace-settings";
import { hasProFeatureAccess } from "@/lib/entitlements";
import { getWorkspaceContext } from "@/lib/workspace/context";
import WorkspaceLoading from "../../loading";

async function BrandingSettingsLoader() {
  const ctx = await getWorkspaceContext();
  if (ctx.state === "unauthenticated") {
    redirect("/login?next=/app/settings/branding");
  }

  if (ctx.state === "unconfigured") {
    return (
      <AppShell orgName="Setup required">
        <div className="rounded-[12px] bg-[#fdf6ec] p-5 text-[14px] text-[#7c380b]">
          <p className="font-semibold">
            Configure Supabase environment variables to open branding settings.
          </p>
          <Link href="/app" className="mt-2 inline-block font-semibold underline">
            Back to dashboard
          </Link>
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

  const billingState = describeOrgBillingState({
    billingEnabled: isBillingEnabled(),
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });

  const isPro = hasProFeatureAccess({
    billingStatus: ctx.org.billingStatus,
    compEnabled: ctx.org.compEnabled,
  });

  const { branding, serviceTokens, apiKeys } =
    await loadWorkspaceBrandingAndServiceSettings(ctx.org.orgId);

  return (
    <AppShell
      orgName={ctx.org.orgName}
      userEmail={ctx.user.email}
      billingLabel={billingState.badgeLabel}
    >
      <BrandingSettingsWorkspace
        orgName={ctx.org.orgName}
        role={ctx.org.role}
        isPro={isPro}
        initialBranding={branding}
        initialServiceTokens={serviceTokens}
        initialApiKeys={apiKeys}
      />
    </AppShell>
  );
}

export default function BrandingSettingsPage() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <BrandingSettingsLoader />
    </Suspense>
  );
}
