"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { BillingDisplayState } from "@/lib/billing";
import type { BillingStatus } from "@/types/database";

interface BillingWorkspaceProps {
  orgName: string;
  role: "owner" | "member";
  billingEnabled: boolean;
  billingStatus: BillingStatus;
  compEnabled: boolean;
  paddleEnv: "sandbox" | "production";
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  displayState: BillingDisplayState;
  checkoutNotice?: "success" | "canceled";
}

export function BillingWorkspace({
  orgName,
  role,
  billingEnabled,
  billingStatus,
  compEnabled,
  paddleEnv,
  checkoutConfigured,
  webhookConfigured,
  displayState,
  checkoutNotice,
}: BillingWorkspaceProps) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleStartCheckout() {
    setErrorMessage(null);
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
      setErrorMessage("Network error starting Paddle checkout.");
    } finally {
      setLoadingCheckout(false);
    }
  }

  const canUpgradeNow =
    billingEnabled &&
    !compEnabled &&
    billingStatus !== "active" &&
    role === "owner" &&
    checkoutConfigured;

  return (
    <div data-ui className="space-y-6">
      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#e8f3f6] px-2.5 py-0.5 text-[12px] font-semibold text-[#0b3c49]">
              {orgName}
            </span>
            <span className="text-[12.5px] text-[#505660]">
              Role: <strong className="font-semibold text-[#0f1114]">{role}</strong>
            </span>
          </div>
          <h1 className="font-display mt-2 text-[24px] font-bold tracking-tight text-[#0f1114] sm:text-[28px]">
            Plan &amp; Billing
          </h1>
          <p className="mt-1 text-[13.5px] text-[#505660]">
            Technical hosting infrastructure billing controls and Paddle sandbox adapter.
          </p>
        </div>

        <span
          className={`inline-flex self-start rounded-md px-3 py-1.5 text-[12.5px] font-semibold sm:self-auto ${
            displayState.canPublish
              ? "bg-[#edf8f2] text-[#156d49]"
              : "bg-[#fdf6ec] text-[#7c380b]"
          }`}
        >
          {displayState.badgeLabel}
        </span>
      </div>

      {checkoutNotice === "success" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[12px] border border-[#9fd4b9] bg-[#edf8f2] p-4 text-[13.5px] text-[#156d49]"
        >
          <p className="font-semibold">Checkout submitted to Paddle</p>
          <p className="mt-1">
            Subscription status updates automatically once Paddle delivers the signed{" "}
            <code>/api/webhooks/paddle</code> event.
          </p>
        </div>
      )}

      {checkoutNotice === "canceled" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[12px] border border-[#ebd0a8] bg-[#fdf6ec] p-4 text-[13.5px] text-[#7c380b]"
        >
          Checkout was canceled before completion. Existing drafts and PDFs are untouched.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Current Organization Entitlement Status */}
        <section className="rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6 lg:col-span-7">
          <h2 className="font-display text-[17px] font-semibold text-[#0f1114]">
            {displayState.headline}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#505660]">
            {displayState.detail}
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[12px] font-medium text-[#505660]">
                Billing gate (BILLING_ENABLED)
              </dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-[#0f1114]">
                <code>
                  {billingEnabled ? "true (enforced on publish)" : "false (pilot free)"}
                </code>
              </dd>
            </div>
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[12px] font-medium text-[#505660]">
                Organization billing_status
              </dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-[#0f1114]">
                <code>{billingStatus}</code>
              </dd>
            </div>
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[12px] font-medium text-[#505660]">
                Pilot comp_enabled override
              </dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-[#0f1114]">
                <code>{compEnabled ? "true (bypass active)" : "false"}</code>
              </dd>
            </div>
            <div className="rounded-[12px] bg-white p-3.5">
              <dt className="text-[12px] font-medium text-[#505660]">
                Paddle adapter mode
              </dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-[#0f1114]">
                <code>
                  {paddleEnv} ({checkoutConfigured && webhookConfigured ? "keys set" : "setup needed"})
                </code>
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-[12px] bg-white p-4 text-[12.5px] leading-relaxed text-[#505660]">
            Pilot brands can be granted manual publishing access by setting{" "}
            <code className="text-[#0f1114]">comp_enabled = true</code> on
            their row in <code className="text-[#0f1114]">organizations</code>{" "}
            via Supabase admin/SQL. End-users cannot modify billing flags directly.
          </div>
        </section>

        {/* Placeholder EUR Plan Card */}
        <section className="flex flex-col justify-between rounded-[18px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex rounded-md bg-[#173038] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#7dd3e8]">
                  Placeholder EUR pricing
                </span>
                <h2 className="font-display mt-2 text-[19px] font-semibold text-white">
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

            <p className="mt-3 text-[13.5px] leading-relaxed text-[#c4c8d0]">
              {siteConfig.billingPlan.summary}
            </p>

            <ul className="mt-4 space-y-2.5 rounded-[12px] bg-[#171a1e] p-4 text-[13px] text-[#e2e5ea]">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3eb8cf]" />
                <span>Live QR passport hosting at /p/[slug]</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3eb8cf]" />
                <span>SVG &amp; PNG print-ready QR downloads</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3eb8cf]" />
                <span>Immutable versioned snapshots &amp; audit trail</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3eb8cf]" />
                <span>Separate public &amp; restricted technical tiers</span>
              </li>
            </ul>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-[10px] border border-red-400/50 bg-red-950/60 px-3.5 py-2.5 text-[13px] text-red-200"
              >
                {errorMessage}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2.5">
            {canUpgradeNow ? (
              <button
                type="button"
                disabled={loadingCheckout}
                onClick={handleStartCheckout}
                className="pressable group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1a748b] disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {loadingCheckout
                    ? "Opening Paddle checkout..."
                    : `Activate ${paddleEnv === "sandbox" ? "Sandbox " : ""}plan (€${siteConfig.billingPlan.priceEurMonthly}/mo)`}
                </span>
                <span aria-hidden="true" className="btn-arrow">
                  →
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#1c2026] px-4 py-2.5 text-[13.5px] font-semibold text-[#c4c8d0]"
              >
                {!billingEnabled
                  ? "Billing disabled (free pilot open)"
                  : compEnabled || billingStatus === "active"
                    ? "Publishing unlocked for this org"
                    : !checkoutConfigured
                      ? "Set PADDLE_API_KEY & price ID to enable checkout"
                      : "Organization owner required"}
              </button>
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
    </div>
  );
}
