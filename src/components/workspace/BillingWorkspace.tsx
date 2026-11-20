"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import type { BillingDisplayState } from "@/lib/billing";
import type { BillingStatus } from "@/types/database";

interface BillingWorkspaceProps {
  orgName: string;
  role: "owner" | "member";
  billingStatus: BillingStatus;
  compEnabled: boolean;
  paddleEnv: "sandbox" | "production";
  checkoutConfigured: boolean;
  testSimulationEnabled: boolean;
  displayState: BillingDisplayState;
  checkoutNotice?: "success" | "canceled";
}

export function BillingWorkspace({
  role,
  billingStatus: initialBillingStatus,
  compEnabled,
  paddleEnv,
  checkoutConfigured,
  testSimulationEnabled,
  displayState,
  checkoutNotice,
}: BillingWorkspaceProps) {
  const router = useRouter();
  const [billingStatus, setBillingStatus] =
    useState<BillingStatus>(initialBillingStatus);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [simulatingAction, setSimulatingAction] = useState<
    "upgrade" | "reset" | null
  >(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBrandHostingActive = billingStatus === "active";
  const hasPublishingAccess = isBrandHostingActive || compEnabled || displayState.canPublish;

  async function handleStartCheckout() {
    setErrorMessage(null);
    setStatusMessage(null);
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
      });
      const json = (await res.json()) as {
        error?: string;
        checkoutUrl?: string;
      };
      if (!res.ok || !json.checkoutUrl) {
        setErrorMessage(json.error || "Could not start checkout session.");
        return;
      }
      if (!/^https:\/\//i.test(json.checkoutUrl)) {
        setErrorMessage("Received invalid checkout URL.");
        return;
      }
      window.location.assign(json.checkoutUrl);
    } catch {
      setErrorMessage("Network error starting checkout.");
    } finally {
      setLoadingCheckout(false);
    }
  }

  async function handleSimulatePlan(action: "upgrade" | "reset") {
    setErrorMessage(null);
    setStatusMessage(null);
    setSimulatingAction(action);
    try {
      const res = await fetch("/api/billing/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as {
        error?: string;
        billingStatus?: BillingStatus;
      };
      if (!res.ok || !json.billingStatus) {
        setErrorMessage(json.error || "Could not update test plan status.");
        return;
      }
      setBillingStatus(json.billingStatus);
      setStatusMessage(
        action === "upgrade"
          ? "Local test upgrade complete: organization is now on Brand Hosting (€49/month) and logged in your audit trail."
          : "Local test reset complete: organization has been returned to the Free Plan and logged in your audit trail.",
      );
      router.refresh();
    } catch {
      setErrorMessage("Network error updating test plan status.");
    } finally {
      setSimulatingAction(null);
    }
  }

  const canUpgradeViaPaddle =
    !isBrandHostingActive &&
    !compEnabled &&
    role === "owner" &&
    checkoutConfigured;

  return (
    <div data-ui className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[12.5px] text-[#505660]">
            Role: <strong className="font-semibold text-[#0f1114]">{role}</strong>
          </span>
          <h1 className="font-display mt-1 text-[24px] font-bold tracking-tight text-[#0f1114] sm:text-[28px]">
            Plans &amp; Billing
          </h1>
          <p className="mt-1 text-[14px] text-[#505660]">
            {displayState.headline}. {displayState.detail}
          </p>
        </div>

        <span
          className={`inline-flex self-start rounded-md px-3 py-1.5 text-[12.5px] font-semibold sm:self-auto ${
            hasPublishingAccess
              ? "bg-[#edf8f2] text-[#156d49]"
              : "bg-[#fdf6ec] text-[#7c380b]"
          }`}
        >
          {isBrandHostingActive
            ? "Brand Hosting Active"
            : displayState.badgeLabel}
        </span>
      </div>

      {/* Checkout / Simulation Feedback Banners */}
      {checkoutNotice === "success" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[12px] border border-[#9fd4b9] bg-[#edf8f2] p-4 text-[13.5px] text-[#156d49]"
        >
          <p className="font-semibold">Checkout submitted</p>
          <p className="mt-1">
            Your Brand Hosting subscription activates automatically as soon as
            payment confirmation is received.
          </p>
        </div>
      )}

      {checkoutNotice === "canceled" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[12px] border border-[#ebd0a8] bg-[#fdf6ec] p-4 text-[13.5px] text-[#7c380b]"
        >
          Checkout was canceled before completion. Your existing drafts and
          uploaded PDFs are untouched.
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          className="tab-panel-enter rounded-[12px] border border-[#9fd4b9] bg-[#edf8f2] p-4 text-[13.5px] font-medium text-[#156d49]"
        >
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="tab-panel-enter rounded-[12px] border border-red-300 bg-red-50 p-4 text-[13.5px] font-medium text-red-900"
        >
          {errorMessage}
        </div>
      )}

      {/* Two Clean User-Facing Plan Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Tier 1: Free Plan */}
        <section className="flex flex-col justify-between rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6 lg:col-span-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex rounded-md bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#505660]">
                  Draft &amp; Intake
                </span>
                <h2 className="font-display mt-2 text-[20px] font-semibold text-[#0f1114]">
                  Free Plan
                </h2>
              </div>
              <div className="text-right">
                <span className="num font-display text-[28px] font-bold tracking-tight text-[#0f1114]">
                  €0
                </span>
                <span className="block text-[12px] text-[#505660]">/ month</span>
              </div>
            </div>

            <p className="mt-3 text-[14px] leading-relaxed text-[#505660]">
              Sign up, upload PDFs or create blank drafts, run 71-point
              completeness checks, and edit drafts for your battery models.
            </p>

            <ul className="mt-5 space-y-2.5 rounded-[14px] bg-white p-4 text-[13.5px] text-[#0f1114]">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                <span>Sign up &amp; create your organization workspace</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                <span>Upload OEM spec PDFs or start blank drafts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                <span>Run 71-point Annex XIII completeness checks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                <span>Edit drafts &amp; export full organization JSON</span>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            {!isBrandHostingActive ? (
              <div className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#0f1114]">
                Current plan
              </div>
            ) : (
              <Link
                href="/app"
                className="pressable inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#0f1114] hover:bg-[#eae9e4]"
              >
                Open Passports ledger
              </Link>
            )}
          </div>
        </section>

        {/* Tier 2: Brand Hosting (€49/month) */}
        <section className="flex flex-col justify-between rounded-[18px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6 lg:col-span-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex rounded-md bg-[#173038] px-2.5 py-0.5 text-[12px] font-semibold text-[#7dd3e8]">
                  Live Hosting &amp; QR Labels
                </span>
                <h2 className="font-display mt-2 text-[20px] font-semibold text-white">
                  {siteConfig.billingPlan.name}
                </h2>
              </div>
              <div className="text-right">
                <span className="num font-display text-[28px] font-bold tracking-tight text-white">
                  €{siteConfig.billingPlan.priceEurMonthly}
                </span>
                <span className="block text-[12px] text-[#b8bcc4]">/ month</span>
              </div>
            </div>

            <p className="mt-3 text-[14px] leading-relaxed text-[#c4c8d0]">
              {siteConfig.billingPlan.summary}
            </p>

            <ul className="mt-5 space-y-2.5 rounded-[14px] bg-[#171a1e] p-4 text-[13.5px] text-[#e2e5ea]">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3eb8cf]" />
                <span>Publish live /p/[slug] mobile QR passports</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3eb8cf]" />
                <span>Download print-ready SVG &amp; PNG QR labels</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3eb8cf]" />
                <span>Issue immutable versioned updates (v1, v2) &amp; audit trail</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3eb8cf]" />
                <span>Separate public &amp; restricted technical access tiers</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 space-y-2.5">
            {isBrandHostingActive ? (
              <div className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#0a2921] px-4 py-2.5 text-[14px] font-semibold text-[#6ee7b7]">
                Active subscription
              </div>
            ) : canUpgradeViaPaddle ? (
              <button
                type="button"
                disabled={loadingCheckout}
                onClick={handleStartCheckout}
                className="pressable group inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1a748b] disabled:opacity-60"
              >
                <span>
                  {loadingCheckout
                    ? "Opening checkout..."
                    : `Upgrade to Brand Hosting${paddleEnv === "sandbox" ? " (Sandbox)" : ""} (€${siteConfig.billingPlan.priceEurMonthly}/mo)`}
                </span>
                <span aria-hidden="true" className="btn-arrow">
                  →
                </span>
              </button>
            ) : (
              <div className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#1c2026] px-4 py-2.5 text-[13.5px] font-semibold text-[#c4c8d0]">
                {compEnabled
                  ? "Publishing unlocked via pilot grant"
                  : role !== "owner"
                    ? "Ask your organization owner to manage plans"
                    : testSimulationEnabled
                      ? "Use Local Test Checkout below to test upgrading"
                      : "Online checkout will open once Paddle is connected"}
              </div>
            )}

            <Link
              href="/app"
              className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] text-[13.5px] font-medium text-[#c4c8d0] underline-offset-4 hover:text-white hover:underline"
            >
              Back to Passports
            </Link>
          </div>
        </section>
      </div>

      {/* Gated Local/Test-Only Simulated Checkout Panel (Never shown in production) */}
      {testSimulationEnabled && (
        <section className="rounded-[18px] bg-[#fdf6ec] p-5 text-[#7c380b] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[60ch]">
              <span className="inline-flex rounded-md bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#7c380b]">
                Local Test Mode
              </span>
              <h2 className="font-display mt-2 text-[17px] font-semibold text-[#0f1114]">
                Simulate Brand Hosting checkout on localhost
              </h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#505660]">
                Test upgrading to Brand Hosting (€49/month) or resetting back to
                the Free Plan without live Paddle credentials. Updates your
                organization record in Supabase and writes an entry to your audit
                log.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={
                  simulatingAction !== null ||
                  role !== "owner" ||
                  isBrandHostingActive
                }
                onClick={() => handleSimulatePlan("upgrade")}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#145b6e] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {simulatingAction === "upgrade"
                  ? "Upgrading..."
                  : `Test Upgrade to Brand Hosting (€${siteConfig.billingPlan.priceEurMonthly}/mo)`}
              </button>

              <button
                type="button"
                disabled={
                  simulatingAction !== null ||
                  role !== "owner" ||
                  !isBrandHostingActive
                }
                onClick={() => handleSimulatePlan("reset")}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#0f1114] hover:bg-[#f4f4f2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {simulatingAction === "reset"
                  ? "Resetting..."
                  : "Reset to Free Plan"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
