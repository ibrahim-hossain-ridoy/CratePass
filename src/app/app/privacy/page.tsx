import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/AppShell";
import {
  PrivacyWorkspace,
  type DraftDeletionCandidate,
} from "@/components/workspace/PrivacyWorkspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace/context";
import WorkspaceLoading from "../loading";

async function PrivacyWorkspaceLoader() {
  const ctx = await getWorkspaceContext();
  if (ctx.state === "unauthenticated") {
    redirect("/login?next=/app/privacy");
  }

  if (ctx.state === "unconfigured") {
    return (
      <AppShell orgName="Setup required">
        <div className="rounded-[10px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-5 text-[14px] text-[var(--notice-ink)]">
          <h1 className="text-[18px] font-semibold">
            Configure Supabase environment variables to open /app/privacy
          </h1>
          <p className="mt-2">
            Public policies remain readable anytime at{" "}
            <Link href="/privacy" className="font-semibold underline">
              /privacy
            </Link>
            ,{" "}
            <Link href="/terms" className="font-semibold underline">
              /terms
            </Link>
            ,{" "}
            <Link href="/refund" className="font-semibold underline">
              /refund
            </Link>
            , and{" "}
            <Link href="/disclaimer" className="font-semibold underline">
              /disclaimer
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

  const supabase = await createServerSupabaseClient();
  let candidates: DraftDeletionCandidate[] = [];

  if (supabase) {
    const [passportsRes, versionsRes] = await Promise.all([
      supabase
        .from("passports")
        .select("id, slug, products ( name )")
        .eq("org_id", ctx.org.orgId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("passport_versions")
        .select("passport_id")
        .eq("org_id", ctx.org.orgId),
    ]);

    const versionCountByPassport = new Map<string, number>();
    for (const v of versionsRes.data ?? []) {
      const pid = String(v.passport_id);
      versionCountByPassport.set(pid, (versionCountByPassport.get(pid) ?? 0) + 1);
    }

    candidates = (passportsRes.data ?? []).map((p) => {
      const productRel = Array.isArray(p.products) ? p.products[0] : p.products;
      const pid = String(p.id);
      return {
        id: pid,
        slug: String(p.slug),
        productName: productRel?.name ? String(productRel.name) : "Untitled battery",
        versionCount: versionCountByPassport.get(pid) ?? 0,
      };
    });
  }

  return (
    <AppShell
      orgName={ctx.org.orgName}
      userEmail={ctx.user.email}
      billingLabel={
        ctx.org.compEnabled ? "Pilot plan (comped)" : `Plan: ${ctx.org.billingStatus}`
      }
    >
      <PrivacyWorkspace
        orgName={ctx.org.orgName}
        orgSlug={ctx.org.orgSlug}
        candidates={candidates}
      />
    </AppShell>
  );
}

export default function WorkspacePrivacyPage() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <PrivacyWorkspaceLoader />
    </Suspense>
  );
}
