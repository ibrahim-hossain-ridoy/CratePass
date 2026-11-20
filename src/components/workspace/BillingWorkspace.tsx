"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FREE_PLAN_LIMITS,
  PLAN_CATALOG,
  PLAN_COMPARISON_ROWS,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
  getProAnnualSavingsPct,
  type BillingInterval,
} from "@/config/plans";
import type { BillingDisplayState } from "@/lib/billing";
import type { BillingStatus } from "@/types/database";

interface BillingWorkspaceProps {
  orgName: string;
  role: "owner" | "member";
  billingStatus: BillingStatus;
  compEnabled: boolean;
  billingEnabled: boolean;
  paddleEnv: "sandbox" | "production";
  checkoutConfigured: boolean;
  testSimulationEnabled: boolean;
  displayState: BillingDisplayState;
  checkoutNotice?: "success" | "canceled";
  usage: {
    publishedPassportsCount: number;
    serializedUnitsCount: number;
    dailyExtractionsUsed: number;
  };
}

export function BillingWorkspace({
  role,
  billingStatus: initialBillingStatus,
  compEnabled,
  billingEnabled,
  paddleEnv,
  checkoutConfigured,
  testSimulationEnabled,
  displayState,
  checkoutNotice,
  usage,
}: BillingWorkspaceProps) {
  const router = useRouter();
  const [billingStatus, setBillingStatus] =
    useState<BillingStatus>(initialBillingStatus);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [simulatingAction, setSimulatingAction] = useState<
    "upgrade" | "reset" | null
  >(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isProActive = billingStatus === "active" || compEnabled;
  const savingsPct = getProAnnualSavingsPct();
  const displayProPrice =
    interval === "yearly" ? PRO_YEARLY_EUR : PRO_MONTHLY_EUR;
  const displayProPeriod = interval === "yearly" ? "/ year" : "/ month";

  async function handleStartCheckout() {
    setErrorMessage(null);
    setStatusMessage(null);
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
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
        setErrorMessage(json.error || "Could not update dev-mode plan status.");
        return;
      }
      setBillingStatus(json.billingStatus);
      setStatusMessage(
        action === "upgrade"
          ? `Dev Mode switched to Pro (€${PRO_MONTHLY_EUR}/mo): unlimited passports, unlimited serialized units, branding, and API access unlocked.`
          : "Dev Mode switched back to Free Plan (3 live passports · 25 serialized units · 5 daily AI PDF checks).",
      );
      router.refresh();
    } catch {
      setErrorMessage("Network error updating dev-mode plan status.");
    } finally {
      setSimulatingAction(null);
    }
  }

  const canUpgradeViaPaddle =
    !isProActive &&
    role === "owner" &&
    billingEnabled &&
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
            isProActive
              ? "bg-[#edf8f2] text-[#156d49]"
              : "bg-[#e6f2f5] text-[#0b3c49]"
          }`}
        >
          {isProActive ? "Pro Plan Active" : displayState.badgeLabel}
        </span>
      </div>

      {/* Feedback Banners */}
      {checkoutNotice === "success" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[12px] border border-[#9fd4b9] bg-[#edf8f2] p-4 text-[13.5px] text-[#156d49]"
        >
          <p className="font-semibold">Checkout submitted</p>
          <p className="mt-1">
            Your CratePass Pro subscription activates automatically as soon as
            Paddle payment confirmation is received.
          </p>
        </div>
      )}

      {checkoutNotice === "canceled" && (
        <div
          role="status"
          className="tab-panel-enter rounded-[12px] border border-[#ebd0a8] bg-[#fdf6ec] p-4 text-[13.5px] text-[#7c380b]"
        >
          Checkout was canceled before completion. Your existing passports,
          drafts, and uploaded PDFs are untouched.
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

      {/* Current Workspace Allowance Bar */}
      <section
        aria-label="Workspace allowance"
        className="grid grid-cols-1 gap-3.5 rounded-[16px] bg-[#f4f4f2] p-4 sm:grid-cols-3"
      >
        <div className="rounded-[12px] bg-white p-4">
          <p className="text-[12.5px] font-medium text-[#505660]">
            Live published passports
          </p>
          <p className="num font-display mt-1 text-[22px] font-bold text-[#0f1114]">
            {usage.publishedPassportsCount}{" "}
            <span className="text-[14px] font-medium text-[#505660]">
              / {isProActive ? "Unlimited" : FREE_PLAN_LIMITS.maxPublishedPassports}
            </span>
          </p>
        </div>
        <div className="rounded-[12px] bg-white p-4">
          <p className="text-[12.5px] font-medium text-[#505660]">
            Serialized unit QR codes
          </p>
          <p className="num font-display mt-1 text-[22px] font-bold text-[#0f1114]">
            {usage.serializedUnitsCount}{" "}
            <span className="text-[14px] font-medium text-[#505660]">
              / {isProActive ? "Unlimited" : FREE_PLAN_LIMITS.maxSerializedUnits}
            </span>
          </p>
        </div>
        <div className="rounded-[12px] bg-white p-4">
          <p className="text-[12.5px] font-medium text-[#505660]">
            Daily AI PDF checks (UTC)
          </p>
          <p className="num font-display mt-1 text-[22px] font-bold text-[#0f1114]">
            {usage.dailyExtractionsUsed}{" "}
            <span className="text-[14px] font-medium text-[#505660]">
              / {isProActive ? "Unlimited" : FREE_PLAN_LIMITS.dailyPdfExtractions}
            </span>
          </p>
        </div>
      </section>

      {/* Billing Interval Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-[#505660]">
          Start free with 3 live battery models. Upgrade to Pro when scaling serial production.
        </p>
        <div
          role="radiogroup"
          aria-label="Billing interval"
          className="inline-flex rounded-[11px] bg-[#e8e7e3] p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={interval === "monthly"}
            onClick={() => setInterval("monthly")}
            className={`pressable cursor-pointer rounded-[8px] px-4 py-1.5 text-[13.5px] font-semibold transition-colors ${
              interval === "monthly"
                ? "bg-white text-[#0f1114]"
                : "text-[#4b4f57] hover:text-[#0f1114]"
            }`}
          >
            Monthly (€{PRO_MONTHLY_EUR}/mo)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={interval === "yearly"}
            onClick={() => setInterval("yearly")}
            className={`pressable inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-4 py-1.5 text-[13.5px] font-semibold transition-colors ${
              interval === "yearly"
                ? "bg-white text-[#0f1114]"
                : "text-[#4b4f57] hover:text-[#0f1114]"
            }`}
          >
            <span>Yearly (€{PRO_YEARLY_EUR}/yr)</span>
            {savingsPct > 0 && (
              <span className="rounded bg-[#edf8f2] px-1.5 py-0.5 text-[11px] font-bold text-[#156d49]">
                -{savingsPct}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Two Plan Cards: Free vs Pro */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Free Plan */}
        <section className="flex flex-col justify-between rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6 lg:col-span-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex rounded-md bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#505660]">
                  {PLAN_CATALOG.free.badge}
                </span>
                <h2 className="font-display mt-2 text-[20px] font-semibold text-[#0f1114]">
                  {PLAN_CATALOG.free.name} Plan
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
              {PLAN_CATALOG.free.summary}
            </p>

            <ul className="mt-5 space-y-2.5 rounded-[14px] bg-white p-4 text-[13.5px] text-[#0f1114]">
              {PLAN_CATALOG.free.highlights.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            {!isProActive ? (
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

        {/* Pro Plan */}
        <section className="flex flex-col justify-between rounded-[18px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6 lg:col-span-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex rounded-md bg-[#173038] px-2.5 py-0.5 text-[12px] font-semibold text-[#7dd3e8]">
                  {PLAN_CATALOG.pro.badge}
                </span>
                <h2 className="font-display mt-2 text-[20px] font-semibold text-white">
                  CratePass {PLAN_CATALOG.pro.name}
                </h2>
              </div>
              <div className="text-right">
                <span className="num font-display text-[28px] font-bold tracking-tight text-white">
                  €{displayProPrice}
                </span>
                <span className="block text-[12px] text-[#b8bcc4]">
                  {displayProPeriod}
                </span>
              </div>
            </div>

            <p className="mt-3 text-[14px] leading-relaxed text-[#c4c8d0]">
              {PLAN_CATALOG.pro.summary}
            </p>

            <ul className="mt-5 space-y-2.5 rounded-[14px] bg-[#171a1e] p-4 text-[13.5px] text-[#e2e5ea]">
              {PLAN_CATALOG.pro.highlights.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3eb8cf]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 space-y-2.5">
            {isProActive ? (
              <div className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#0a2921] px-4 py-2.5 text-[14px] font-semibold text-[#6ee7b7]">
                {compEnabled ? "Pro unlocked via pilot grant" : "Active Pro subscription"}
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
                    : `Upgrade to Pro${paddleEnv === "sandbox" ? " (Sandbox)" : ""} (€${displayProPrice}${interval === "yearly" ? "/yr" : "/mo"})`}
                </span>
                <span aria-hidden="true" className="btn-arrow">
                  →
                </span>
              </button>
            ) : (
              <div className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#1c2026] px-4 py-2.5 text-[13.5px] font-semibold text-[#c4c8d0]">
                {role !== "owner"
                  ? "Ask your workspace owner to manage plans"
                  : testSimulationEnabled
                    ? "Use Dev Mode toggle below to switch between Free & Pro"
                    : "Online checkout opens once Paddle billing is configured"}
              </div>
            )}

            <p className="text-center text-[12px] leading-relaxed text-[#b8bcc4]">
              Processed by Paddle (Merchant of Record) · Cancel anytime ·{" "}
              <Link href="/refund" className="text-[#7dd3e8] underline underline-offset-4 hover:text-white">
                14-day refund policy
              </Link>{" "}
              ·{" "}
              <Link href="/terms" className="text-[#7dd3e8] underline underline-offset-4 hover:text-white">
                Terms
              </Link>
            </p>

            <Link
              href="/app"
              className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] text-[13.5px] font-medium text-[#c4c8d0] underline-offset-4 hover:text-white hover:underline"
            >
              Back to Passports
            </Link>
          </div>
        </section>
      </div>

      {/* Free vs Pro Comparison Table */}
      <section className="overflow-hidden rounded-[18px] bg-[#f9f9f7] p-5 sm:p-6">
        <h2 className="font-display text-[18px] font-semibold text-[#0f1114]">
          Compare Free vs. Pro capabilities
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[#dcdad4] text-[12.5px] font-semibold text-[#4b4f57]">
                <th className="py-2.5 pr-4">Capability</th>
                <th className="py-2.5 pr-4">Free (€0/mo)</th>
                <th className="py-2.5 text-[#0b3c49]">
                  Pro (€{PRO_MONTHLY_EUR}/mo · €{PRO_YEARLY_EUR}/yr)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e4de]">
              {PLAN_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3 pr-4 font-medium text-[#0f1114]">
                    {row.feature}
                  </td>
                  <td className="py-3 pr-4 text-[#505660]">{row.free}</td>
                  <td className="py-3 font-semibold text-[#145b6e]">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gated Dev Mode Plan Switcher (Active when BILLING_ENABLED=false or local dev without Paddle key) */}
      {testSimulationEnabled && (
        <section className="rounded-[18px] bg-[#fdf6ec] p-5 text-[#7c380b] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[60ch]">
              <span className="inline-flex rounded-md bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#7c380b]">
                {!billingEnabled ? "Dev Mode (BILLING_ENABLED=false)" : "Local Test Mode"}
              </span>
              <h2 className="font-display mt-2 text-[17px] font-semibold text-[#0f1114]">
                Test Free &amp; Pro plan gates locally
              </h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#505660]">
                Toggle this workspace between Free (3 live products / 25 serialized
                units) and Pro (€{PRO_MONTHLY_EUR}/mo) without Paddle credentials.
                Writes to your organization record and append-only audit log.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={
                  simulatingAction !== null ||
                  role !== "owner" ||
                  billingStatus === "active"
                }
                onClick={() => handleSimulatePlan("upgrade")}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#145b6e] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {simulatingAction === "upgrade"
                  ? "Switching..."
                  : "Switch to Pro (Dev Mode)"}
              </button>

              <button
                type="button"
                disabled={
                  simulatingAction !== null ||
                  role !== "owner" ||
                  billingStatus !== "active"
                }
                onClick={() => handleSimulatePlan("reset")}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#0f1114] hover:bg-[#f4f4f2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {simulatingAction === "reset"
                  ? "Switching..."
                  : "Switch to Free (Dev Mode)"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
