import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/AppShell";
import {
  PassportDashboard,
  type DashboardPassportItem,
} from "@/components/workspace/PassportDashboard";
import { BATTERY_FIELDS } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import WorkspaceLoading from "./loading";

async function DashboardLoader() {
  const ctx = await getWorkspaceContext();

  if (ctx.state === "unauthenticated") {
    redirect("/login?next=/app");
  }

  if (ctx.state === "unconfigured") {
    return (
      <AppShell orgName="Setup required">
        <div className="rounded-[10px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-5 text-[14px] text-[var(--notice-ink)]">
          <h1 className="text-[18px] font-semibold">
            Configure Supabase environment variables to open /app
          </h1>
          <p className="mt-2 leading-relaxed">
            Copy <code className="font-mono">.env.example</code> to{" "}
            <code className="font-mono">.env.local</code>, add your Supabase project
            keys, and execute the SQL files in{" "}
            <code className="font-mono">supabase/migrations/</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex min-h-[40px] items-center rounded-[8px] border border-[var(--notice-border)] bg-[var(--surface)] px-3.5 font-semibold text-[var(--ink)]"
            >
              View /demo
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[40px] items-center rounded-[8px] px-3 font-medium text-[var(--ink)] underline-offset-4 hover:underline"
            >
              Landing page
            </Link>
          </div>
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
          <h1 className="text-[18px] font-semibold">Workspace initialization issue</h1>
          <p className="mt-1.5">{ctx.message}</p>
        </div>
      </AppShell>
    );
  }

  const supabase = await createServerSupabaseClient();
  let items: DashboardPassportItem[] = [];
  let dailyUsed = 0;
  let queryError: string | undefined;

  if (supabase) {
    const [passportsRes, dailyRes] = await Promise.all([
      supabase
        .from("passports")
        .select(
          "id, slug, status, working_fields, current_version_id, updated_at, products ( name, model_code )",
        )
        .eq("org_id", ctx.org.orgId)
        .order("updated_at", { ascending: false }),
      supabase.rpc("get_org_daily_extraction_count", {
        p_org_id: ctx.org.orgId,
      }),
    ]);

    if (passportsRes.error) {
      queryError = "Database query failed while loading organization passports.";
    } else {
      dailyUsed = typeof dailyRes.data === "number" ? dailyRes.data : 0;

      const versionIds = (passportsRes.data ?? [])
        .map((r) => r.current_version_id as string | null)
        .filter((v): v is string => Boolean(v));

      const versionNumberMap = new Map<string, number>();
      if (versionIds.length > 0) {
        const versionsRes = await supabase
          .from("passport_versions")
          .select("id, version_number")
          .in("id", versionIds);
        for (const row of versionsRes.data ?? []) {
          versionNumberMap.set(String(row.id), Number(row.version_number));
        }
      }

      items = (passportsRes.data ?? []).map((row) => {
        const productRel = Array.isArray(row.products)
          ? row.products[0]
          : row.products;
        const fields =
          row.working_fields && typeof row.working_fields === "object"
            ? (row.working_fields as Record<string, unknown>)
            : {};
        const populatedCount = BATTERY_FIELDS.filter(
          (f) => typeof fields[f.key] === "string" && String(fields[f.key]).trim().length > 0,
        ).length;

        return {
          id: String(row.id),
          slug: String(row.slug),
          status: row.status === "published" ? "published" : "draft",
          productName: productRel?.name ? String(productRel.name) : "Untitled battery",
          modelCode: productRel?.model_code ? String(productRel.model_code) : "",
          versionNumber: row.current_version_id
            ? (versionNumberMap.get(String(row.current_version_id)) ?? null)
            : null,
          populatedCount,
          totalFieldCount: BATTERY_FIELDS.length,
          updatedAt: String(row.updated_at),
        };
      });
    }
  }

  const billingLabel = ctx.org.compEnabled
    ? "Pilot plan (comped)"
    : `Plan: ${ctx.org.billingStatus}`;

  return (
    <AppShell
      orgName={ctx.org.orgName}
      userEmail={ctx.user.email}
      billingLabel={billingLabel}
    >
      <PassportDashboard
        orgName={ctx.org.orgName}
        dailyExtractionsUsed={dailyUsed}
        dailyExtractionLimit={siteConfig.dailyExtractionLimitPerOrg}
        passports={items}
        queryError={queryError}
      />
    </AppShell>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <DashboardLoader />
    </Suspense>
  );
}
