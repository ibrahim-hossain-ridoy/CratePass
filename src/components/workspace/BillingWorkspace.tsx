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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--rule)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            {orgName}
          </p>
          <h1 className="text-title-page mt-0.5 font-bold text-[var(--ink)]">
            Plan &amp; Billing
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--muted)]">
            Technical hosting infrastructure billing controls and Paddle sandbox adapter.
          </p>
        </div>

        <span
          className={`inline-flex self-start rounded px-2.5 py-1 text-[12.5px] font-semibold sm:self-auto ${
            displayState.canPublish
              ? "border border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]"
              : "border border-[var(--notice-border)] bg-[var(--notice-bg)] text-[var(--notice-ink)]"
          }`}
        >
          {displayState.badgeLabel}
        </span>
      </div>

      {checkoutNotice === "success" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[10px] border border-[var(--positive-border)] bg-[var(--positive-bg)] p-4 text-[13.5px] text-[var(--positive)]"
        >
          <p className="font-semibold">Checkout submitted to Paddle</p>
          <p className="mt-1">
            Subscription status updates automatically once Paddle delivers the signed{" "}
            <code className="font-mono">/api/webhooks/paddle</code> event.
          </p>
        </div>
      )}

      {checkoutNotice === "canceled" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[10px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-4 text-[13.5px] text-[var(--notice-ink)]"
        >
          Checkout was canceled before completion. Existing drafts and PDFs are untouched.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Current Organization Entitlement Status */}
        <section className="surface-elevated rounded-[14px] p-5 lg:col-span-7">
          <h2 className="text-[16px] font-bold text-[var(--ink)]">
            {displayState.headline}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
            {displayState.detail}
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-[var(--rule)] pt-4 text-[13.5px] sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Billing gate (BILLING_ENABLED)</dt>
              <dd className="mt-0.5 font-mono font-semibold text-[var(--ink)]">
                {billingEnabled ? "true (enforced on publish)" : "false (pilot free)"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Organization billing_status</dt>
              <dd className="mt-0.5 font-mono font-semibold text-[var(--ink)]">
                {billingStatus}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Pilot comp_enabled override</dt>
              <dd className="mt-0.5 font-mono font-semibold text-[var(--ink)]">
                {compEnabled ? "true (bypass active)" : "false"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Paddle adapter mode</dt>
              <dd className="mt-0.5 font-mono font-semibold text-[var(--ink)]">
                {paddleEnv} ({checkoutConfigured && webhookConfigured ? "keys set" : "setup needed"})
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] p-3.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
            Pilot brands can be granted manual publishing access by setting{" "}
            <code className="font-mono text-[var(--ink)]">comp_enabled = true</code> on
            their row in <code className="font-mono text-[var(--ink)]">organizations</code>{" "}
            via Supabase admin/SQL. End-users cannot modify billing flags directly.
          </div>
        </section>

        {/* Placeholder EUR Plan Card */}
        <section className="surface-elevated rounded-[14px] bg-[var(--well-soft)] p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--accent-ink)]">
                Placeholder EUR pricing
              </p>
              <h2 className="mt-1 text-[18px] font-bold text-[var(--ink)]">
                {siteConfig.billingPlan.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="num text-[26px] font-bold tracking-tight text-[var(--ink)]">
                €{siteConfig.billingPlan.priceEurMonthly}
              </span>
              <span className="block text-[12px] text-[var(--muted)]">/ month</span>
            </div>
          </div>

          <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
            {siteConfig.billingPlan.summary}
          </p>

          <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-[13px] text-[var(--ink)]">
            <li>• Live QR passport hosting at /p/[slug]</li>
            <li>• SVG &amp; PNG print-ready QR downloads</li>
            <li>• Immutable versioned snapshots &amp; audit trail</li>
            <li>• Separate public &amp; restricted technical tiers</li>
          </ul>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-[8px] border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-900"
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-5 space-y-2.5">
            {canUpgradeNow ? (
              <button
                type="button"
                disabled={loadingCheckout}
                onClick={handleStartCheckout}
                className="pressable chamfer-sm inline-flex min-h-[44px] w-full items-center justify-center bg-[var(--accent)] px-4 py-2 text-[14px] font-bold text-white hover:bg-[var(--accent-ink)] disabled:opacity-60 cursor-pointer"
              >
                {loadingCheckout
                  ? "Opening Paddle checkout..."
                  : `Activate ${paddleEnv === "sandbox" ? "Sandbox " : ""}plan (€${siteConfig.billingPlan.priceEurMonthly}/mo)`}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-[13.5px] font-semibold text-[var(--muted)] opacity-75"
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
              className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[8px] text-[13.5px] font-medium text-[var(--ink)] underline-offset-4 hover:underline"
            >
              Back to Passports
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
