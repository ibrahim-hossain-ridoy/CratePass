"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";
import {
  PLAN_CATALOG,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
  getProAnnualSavingsPct,
  type BillingInterval,
} from "@/config/plans";

export function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const savingsPct = getProAnnualSavingsPct();
  const proPrice = interval === "yearly" ? PRO_YEARLY_EUR : PRO_MONTHLY_EUR;
  const proPeriod = interval === "yearly" ? "/ year" : "/ month";

  return (
    <section
      id="pricing"
      data-chapter-theme="chalk"
      className="bg-white py-20 text-[#0f1114] lg:py-28"
    >
      <div className="page-shell">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-flex rounded-md bg-[#e6f2f5] px-2.5 py-1 text-[13px] font-semibold text-[#0b3c49]">
              Self-Serve Pricing · Zero Enterprise Lock-In
            </span>
            <h2 className="text-display-section mt-3 max-w-[20ch] text-[#0f1114]">
              Start free with 3 live battery passports
            </h2>
            <p className="mt-3 max-w-[54ch] text-[17px] leading-relaxed text-[#22252a]">
              Test full Annex XIII publishing, public mobile QR pages, and initial
              unit serialization for €0. Upgrade to Pro when scaling serial production.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Pricing billing interval"
            className="inline-flex self-start rounded-[11px] bg-[#e8e7e3] p-1 md:self-auto"
          >
            <button
              type="button"
              role="radio"
              aria-checked={interval === "monthly"}
              onClick={() => setInterval("monthly")}
              className={`pressable cursor-pointer rounded-[8px] px-4 py-2 text-[14px] font-semibold transition-colors ${
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
              className={`pressable inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-4 py-2 text-[14px] font-semibold transition-colors ${
                interval === "yearly"
                  ? "bg-white text-[#0f1114]"
                  : "text-[#4b4f57] hover:text-[#0f1114]"
              }`}
            >
              <span>Yearly (€{PRO_YEARLY_EUR}/yr)</span>
              {savingsPct > 0 && (
                <span className="rounded bg-[#edf8f2] px-1.5 py-0.5 text-[11.5px] font-bold text-[#156d49]">
                  -{savingsPct}%
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Free Tier */}
          <article className="flex flex-col justify-between rounded-[20px] bg-[#f4f4f2] p-6 sm:p-8 lg:col-span-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-md bg-white px-2.5 py-0.5 text-[12.5px] font-semibold text-[#505660]">
                    {PLAN_CATALOG.free.badge}
                  </span>
                  <h3 className="font-display mt-2.5 text-[24px] font-semibold text-[#0f1114]">
                    Free Plan
                  </h3>
                </div>
                <div className="text-right">
                  <span className="num font-display text-[36px] font-bold tracking-tight text-[#0f1114]">
                    €0
                  </span>
                  <span className="block text-[13px] text-[#505660]">/ month</span>
                </div>
              </div>

              <p className="mt-3 text-[15px] leading-relaxed text-[#4b4f57]">
                {PLAN_CATALOG.free.summary}
              </p>

              <ul className="mt-6 space-y-3 rounded-[14px] bg-white p-5 text-[14.5px] text-[#0f1114]">
                {PLAN_CATALOG.free.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Link
                href="/signup?next=/app/new"
                className="pressable inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0e4656]"
              >
                <span>Start your 3 free live passports</span>
                <ArrowRightIcon className="btn-arrow h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* Pro Tier */}
          <article className="flex flex-col justify-between rounded-[20px] bg-[#101214] p-6 text-[#f4f3ef] sm:p-8 lg:col-span-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-md bg-[#173038] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#7dd3e8]">
                    {PLAN_CATALOG.pro.badge}
                  </span>
                  <h3 className="font-display mt-2.5 text-[24px] font-semibold text-white">
                    CratePass Pro
                  </h3>
                </div>
                <div className="text-right">
                  <span className="num font-display text-[36px] font-bold tracking-tight text-white">
                    €{proPrice}
                  </span>
                  <span className="block text-[13px] text-[#b8bcc4]">
                    {proPeriod}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[15px] leading-relaxed text-[#c4c8d0]">
                {PLAN_CATALOG.pro.summary}
              </p>

              <ul className="mt-6 space-y-3 rounded-[14px] bg-[#171a1e] p-5 text-[14.5px] text-[#e2e5ea]">
                {PLAN_CATALOG.pro.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3eb8cf]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Link
                href="/signup?next=/app/billing"
                className="pressable inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#3eb8cf] px-5 py-3 text-[15px] font-semibold text-[#08181d] transition-colors hover:bg-[#5ec8dc]"
              >
                <span>Start free &amp; upgrade anytime</span>
                <ArrowRightIcon className="btn-arrow h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-[14px] bg-[#f4f4f2] px-5 py-4 text-[13.5px] text-[#4b4f57] sm:flex-row sm:items-center">
          <p>
            Paid Pro plans are billed securely by{" "}
            <strong className="font-semibold text-[#0f1114]">Paddle</strong>{" "}
            (Merchant of Record) and auto-renew until cancelled. Includes a{" "}
            <Link
              href="/refund"
              className="font-semibold text-[#145b6e] underline underline-offset-4 hover:text-[#0e4656]"
            >
              14-day refund policy
            </Link>
            .
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-4 font-semibold text-[#0f1114]">
            <Link href="/pricing" className="hover:text-[#145b6e] hover:underline">
              Full plan comparison
            </Link>
            <Link href="/terms" className="hover:text-[#145b6e] hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#145b6e] hover:underline">
              Privacy
            </Link>
            <Link href="/refund" className="hover:text-[#145b6e] hover:underline">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
