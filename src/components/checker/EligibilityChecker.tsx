"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, BrandMark } from "@/components/Icons";
import { PublicFooter } from "@/components/PublicFooter";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import {
  evaluateBatteryEligibility,
  type CheckerBatteryChoice,
  type CheckerDatasheetState,
  type CheckerMarketDate,
  type CheckerTurnoverTier,
} from "@/lib/checker";

const CATEGORY_OPTIONS: readonly {
  id: CheckerBatteryChoice;
  title: string;
  tag: string;
  desc: string;
}[] = [
  {
    id: "LMT",
    title: "LMT / E-Bike / E-Scooter",
    tag: "Full Passport",
    desc: "Wheeled light means of transport batteries (< 25 kg) for e-bikes, cargo bikes, and e-scooters.",
  },
  {
    id: "EV",
    title: "EV Traction Battery",
    tag: "Full Passport",
    desc: "Electric vehicle traction packs for L-category (> 25 kg), passenger cars, vans, or trucks.",
  },
  {
    id: "industrial_gt_2kwh",
    title: "Industrial Battery > 2 kWh",
    tag: "Full Passport",
    desc: "Stationary energy storage systems (SESS), forklifts, AGVs, and industrial packs over 2 kWh.",
  },
  {
    id: "simple_qr",
    title: "Industrial ≤ 2 kWh / Portable / SLI",
    tag: "Simple QR Mode",
    desc: "Portable packs, starter/lighting/ignition (SLI) batteries, or compact industrial units ≤ 2 kWh.",
  },
];

const MARKET_DATE_OPTIONS: readonly {
  id: CheckerMarketDate;
  title: string;
  desc: string;
}[] = [
  {
    id: "before_feb_2027",
    title: "Before 18 February 2027",
    desc: "Already shipping into the EU now or preparing batches ahead of the Feb 2027 enforcement date.",
  },
  {
    id: "feb_to_aug_2027",
    title: "18 Feb 2027 – 17 Aug 2027",
    desc: "Initial mandatory EU Battery Passport & Article 13(6) QR launch window.",
  },
  {
    id: "after_aug_2027",
    title: "On or after 18 August 2027",
    desc: "Includes postponed supply-chain due diligence window under Regulation (EU) 2025/1561.",
  },
];

const TURNOVER_OPTIONS: readonly {
  id: CheckerTurnoverTier;
  title: string;
  desc: string;
}[] = [
  {
    id: "under_40m",
    title: "Under €40M annual net turnover",
    desc: "SME operator threshold (checked against Article 47–48 due diligence scope).",
  },
  {
    id: "40m_to_150m",
    title: "€40M – €150M annual net turnover",
    desc: "Mid-market operator above the €40M supply-chain due diligence threshold.",
  },
  {
    id: "over_150m",
    title: "Over €150M annual net turnover",
    desc: "Large economic operator with full supply-chain due diligence scope.",
  },
];

const DATASHEET_OPTIONS: readonly {
  id: CheckerDatasheetState;
  title: string;
  desc: string;
}[] = [
  {
    id: "full_pdf",
    title: "Yes — we have OEM spec PDF datasheets",
    desc: "Cell or pack datasheets ready for automated 50-point static extraction & gap check.",
  },
  {
    id: "partial_supplier",
    title: "Partial — specs are with our Asian / Chinese factory",
    desc: "Need to gather missing chemistry, safety, or test report references from factory engineers.",
  },
  {
    id: "none",
    title: "Starting from scratch (no datasheet yet)",
    desc: "Need a structured working template to collect data step-by-step before production.",
  },
];

export function EligibilityChecker() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [category, setCategory] = useState<CheckerBatteryChoice>("LMT");
  const [marketDate, setMarketDate] = useState<CheckerMarketDate>("feb_to_aug_2027");
  const [turnover, setTurnover] = useState<CheckerTurnoverTier>("under_40m");
  const [datasheetState, setDatasheetState] =
    useState<CheckerDatasheetState>("partial_supplier");

  const result = useMemo(
    () =>
      evaluateBatteryEligibility({
        category,
        marketDate,
        turnover,
        datasheetState,
      }),
    [category, marketDate, turnover, datasheetState],
  );

  const isResultStep = step === 5;
  const progressRatio = isResultStep ? 1 : step / 4;

  return (
    <div className="flex min-h-svh flex-col bg-[#e8e7e3] text-[#0f1114]">
      {/* Studio Header */}
      <header className="sticky top-0 z-30 bg-[#e8e7e3]/95 backdrop-blur">
        <div className="page-shell flex h-[72px] items-center justify-between gap-4">
          <Link
            href="/"
            className="pressable inline-flex shrink-0 items-center gap-2.5 text-[#0f1114]"
          >
            <BrandMark className="h-8 w-8 shrink-0" />
            <span className="font-display text-[16px] font-semibold tracking-tight">
              {siteConfig.brandName}
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/demo"
              className="hidden px-3 py-2 text-[14.5px] font-medium text-[#22252a] hover:text-[#145b6e] sm:inline-flex"
            >
              Live demo
            </Link>
            <Link
              href="/login"
              className="pressable inline-flex items-center justify-center rounded-[10px] bg-[#dcdad4] px-3.5 py-2 text-[14px] font-semibold text-[#0f1114] hover:bg-[#cfccc4]"
            >
              Sign in
            </Link>
            <Link
              href="/signup?next=/app/new"
              className="pressable inline-flex items-center justify-center rounded-[10px] bg-[#145b6e] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#0e4656]"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12">
        <div className="page-shell max-w-[960px] space-y-6">
          {/* Masthead */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex rounded-md bg-white px-2.5 py-1 text-[12.5px] font-semibold text-[#0b3c49]">
                EU Battery Regulation (EU) 2023/1542 · Free Scope Checker
              </span>
              <h1 className="text-display-section mt-2.5 text-[#0f1114]">
                EU Battery Passport Eligibility &amp; Gap Checker
              </h1>
              <p className="mt-2 max-w-[60ch] text-[15.5px] leading-relaxed text-[#4b4f57]">
                Answer 4 quick questions to see your applicable 2026–2027 deadlines,
                exact Annex XIII field counts by access tier, and whether you need a
                full 71-point passport or Simple QR label. No login required.
              </p>
            </div>
          </div>

          {/* Progress Rail */}
          <div className="rounded-[18px] bg-white p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold text-[#4b4f57]">
              <span>
                {isResultStep
                  ? "Step 2 · Instant Obligation & Field Scope Result"
                  : `Step 1 · Question ${step} of 4`}
              </span>
              <span className="num text-[#145b6e]">
                {isResultStep ? "Complete" : `${Math.round(progressRatio * 100)}%`}
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#e8e7e3]">
              <div
                style={{ transform: `scaleX(${progressRatio})` }}
                className="progress-fill-smooth h-full w-full rounded-full bg-[#145b6e]"
              />
            </div>

            {/* Question 1: Battery Category */}
            {step === 1 && (
              <div className="tab-panel-enter mt-7 space-y-5">
                <div>
                  <h2 className="font-display text-[21px] font-semibold text-[#0f1114]">
                    1. Which battery category are you placing on the EU market?
                  </h2>
                  <p className="mt-1 text-[14.5px] text-[#4b4f57]">
                    Determines whether full 71-point Annex XIII Digital Battery Passport
                    rules or Article 13(6) Simple QR rules apply.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const active = category === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCategory(opt.id)}
                        className={`pressable flex cursor-pointer flex-col items-start rounded-[14px] p-4.5 text-left transition-colors ${
                          active
                            ? "bg-[#101214] text-white"
                            : "bg-[#f4f4f2] text-[#0f1114] hover:bg-[#e8e7e3]"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="font-display text-[16.5px] font-semibold">
                            {opt.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${
                              active
                                ? "bg-[#3eb8cf] text-[#08181d]"
                                : "bg-white text-[#0b3c49]"
                            }`}
                          >
                            {opt.tag}
                          </span>
                        </div>
                        <span
                          className={`mt-1.5 text-[13.5px] leading-snug ${
                            active ? "text-[#c4c8d0]" : "text-[#4b4f57]"
                          }`}
                        >
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="pressable inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-[10px] bg-[#145b6e] px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-[#0e4656]"
                  >
                    <span>Next: Market date</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Question 2: Market Placement Date */}
            {step === 2 && (
              <div className="tab-panel-enter mt-7 space-y-5">
                <div>
                  <h2 className="font-display text-[21px] font-semibold text-[#0f1114]">
                    2. When will units be placed on the EU market?
                  </h2>
                  <p className="mt-1 text-[14.5px] text-[#4b4f57]">
                    EU Battery Passports and Article 13(6) QR codes take effect on 18
                    February 2027; due diligence follows on 18 August 2027.
                  </p>
                </div>

                <div className="space-y-3">
                  {MARKET_DATE_OPTIONS.map((opt) => {
                    const active = marketDate === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMarketDate(opt.id)}
                        className={`pressable flex w-full cursor-pointer flex-col items-start rounded-[14px] p-4.5 text-left transition-colors ${
                          active
                            ? "bg-[#101214] text-white"
                            : "bg-[#f4f4f2] text-[#0f1114] hover:bg-[#e8e7e3]"
                        }`}
                      >
                        <span className="font-display text-[16.5px] font-semibold">
                          {opt.title}
                        </span>
                        <span
                          className={`mt-1 text-[13.5px] ${
                            active ? "text-[#c4c8d0]" : "text-[#4b4f57]"
                          }`}
                        >
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="pressable inline-flex min-h-[44px] cursor-pointer items-center rounded-[10px] bg-[#f4f4f2] px-4 py-2 text-[14px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="pressable inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-[10px] bg-[#145b6e] px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-[#0e4656]"
                  >
                    <span>Next: Annual turnover</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Question 3: Annual Turnover */}
            {step === 3 && (
              <div className="tab-panel-enter mt-7 space-y-5">
                <div>
                  <h2 className="font-display text-[21px] font-semibold text-[#0f1114]">
                    3. What is your group&apos;s annual net turnover?
                  </h2>
                  <p className="mt-1 text-[14.5px] text-[#4b4f57]">
                    Used to flag the August 2027 battery supply-chain due diligence
                    threshold under Regulation (EU) 2025/1561.
                  </p>
                </div>

                <div className="space-y-3">
                  {TURNOVER_OPTIONS.map((opt) => {
                    const active = turnover === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTurnover(opt.id)}
                        className={`pressable flex w-full cursor-pointer flex-col items-start rounded-[14px] p-4.5 text-left transition-colors ${
                          active
                            ? "bg-[#101214] text-white"
                            : "bg-[#f4f4f2] text-[#0f1114] hover:bg-[#e8e7e3]"
                        }`}
                      >
                        <span className="font-display text-[16.5px] font-semibold">
                          {opt.title}
                        </span>
                        <span
                          className={`mt-1 text-[13.5px] ${
                            active ? "text-[#c4c8d0]" : "text-[#4b4f57]"
                          }`}
                        >
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="pressable inline-flex min-h-[44px] cursor-pointer items-center rounded-[10px] bg-[#f4f4f2] px-4 py-2 text-[14px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="pressable inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-[10px] bg-[#145b6e] px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-[#0e4656]"
                  >
                    <span>Next: Datasheet status</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Question 4: Current Datasheet Availability */}
            {step === 4 && (
              <div className="tab-panel-enter mt-7 space-y-5">
                <div>
                  <h2 className="font-display text-[21px] font-semibold text-[#0f1114]">
                    4. What battery specification data do you have today?
                  </h2>
                  <p className="mt-1 text-[14.5px] text-[#4b4f57]">
                    Helps recommend the fastest intake workflow (AI PDF extraction,
                    5-Language Supplier Magic Link, or Blank Draft).
                  </p>
                </div>

                <div className="space-y-3">
                  {DATASHEET_OPTIONS.map((opt) => {
                    const active = datasheetState === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDatasheetState(opt.id)}
                        className={`pressable flex w-full cursor-pointer flex-col items-start rounded-[14px] p-4.5 text-left transition-colors ${
                          active
                            ? "bg-[#101214] text-white"
                            : "bg-[#f4f4f2] text-[#0f1114] hover:bg-[#e8e7e3]"
                        }`}
                      >
                        <span className="font-display text-[16.5px] font-semibold">
                          {opt.title}
                        </span>
                        <span
                          className={`mt-1 text-[13.5px] ${
                            active ? "text-[#c4c8d0]" : "text-[#4b4f57]"
                          }`}
                        >
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="pressable inline-flex min-h-[44px] cursor-pointer items-center rounded-[10px] bg-[#f4f4f2] px-4 py-2 text-[14px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="pressable inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-[10px] bg-[#145b6e] px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-[#0e4656]"
                  >
                    <span>See my obligations &amp; field counts</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Instant Result */}
            {isResultStep && (
              <div className="tab-panel-enter mt-7 space-y-6">
                {/* Result Hero Banner */}
                <div className="rounded-[18px] bg-[#101214] p-6 text-[#f4f3ef]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex rounded-md bg-[#173038] px-3 py-1 text-[12.5px] font-semibold text-[#7dd3e8]">
                      {result.passportMode === "full_passport"
                        ? `Full 71-Point Passport (${result.mappedCategory})`
                        : "Article 13(6) Simple QR Mode"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="cursor-pointer text-[13px] font-semibold text-[#3eb8cf] underline-offset-4 hover:underline"
                    >
                      Edit answers
                    </button>
                  </div>

                  <h2 className="font-display mt-3 text-[23px] font-semibold leading-snug text-white sm:text-[26px]">
                    {result.headline}
                  </h2>
                  <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-[#c4c8d0]">
                    {result.subheadline}
                  </p>

                  {/* Required Annex XIII Tier Counts */}
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                      <p className="text-[12.5px] text-[#c4c8d0]">Total required</p>
                      <p className="num font-display mt-1 text-[24px] font-bold text-white">
                        {result.fieldBreakdown.totalPoints}
                      </p>
                      <p className="text-[12px] text-[#9aa0ab]">
                        {result.passportMode === "full_passport"
                          ? `${result.fieldBreakdown.staticRequiredCount} static · ${result.fieldBreakdown.dynamicBmsCount} BMS`
                          : "DoC + disposal items"}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                      <p className="text-[12.5px] text-[#c4c8d0]">Public tier</p>
                      <p className="num font-display mt-1 text-[24px] font-bold text-[#34d399]">
                        {result.fieldBreakdown.publicCount}
                      </p>
                      <p className="text-[12px] text-[#9aa0ab]">Visible on QR scan</p>
                    </div>
                    <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                      <p className="text-[12.5px] text-[#c4c8d0]">Legitimate interest</p>
                      <p className="num font-display mt-1 text-[24px] font-bold text-[#3eb8cf]">
                        {result.fieldBreakdown.legitimateInterestCount}
                      </p>
                      <p className="text-[12px] text-[#9aa0ab]">Repairers &amp; recyclers</p>
                    </div>
                    <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                      <p className="text-[12.5px] text-[#c4c8d0]">Authorities only</p>
                      <p className="num font-display mt-1 text-[24px] font-bold text-[#fbbf24]">
                        {result.fieldBreakdown.authoritiesOnlyCount}
                      </p>
                      <p className="text-[12px] text-[#9aa0ab]">Test report refs</p>
                    </div>
                  </div>
                </div>

                {/* Applicable Regulatory Milestones */}
                <div className="space-y-3">
                  <h3 className="font-display text-[17px] font-semibold text-[#0f1114]">
                    Applicable deadlines &amp; scope
                  </h3>
                  {result.obligations.map((ob) => (
                    <div
                      key={ob.id}
                      className="rounded-[14px] bg-[#f4f4f2] p-4.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-display text-[16px] font-semibold text-[#0f1114]">
                          {ob.title}
                        </h4>
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[12px] font-semibold ${
                            ob.status === "mandatory"
                              ? "bg-[#e6f2f5] text-[#0b3c49]"
                              : ob.status === "conditional"
                                ? "bg-[#fdf6ec] text-[#7c380b]"
                                : "bg-white text-[#4b4f57]"
                          }`}
                        >
                          {ob.effectiveDate}
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] font-medium text-[#145b6e]">
                        {ob.regulationRef}
                      </p>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-[#22252a]">
                        {ob.summary}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recommended Workflow Card + Primary CTA */}
                <div className="rounded-[16px] bg-[#0c262e] p-6 text-[#f4f7f8]">
                  <p className="text-[12.5px] font-semibold text-[#7ce3f4]">
                    Recommended CratePass workflow
                  </p>
                  <h3 className="font-display mt-1 text-[20px] font-semibold text-white">
                    {result.workflowTip.title}
                  </h3>
                  <p className="mt-1.5 max-w-[60ch] text-[14.5px] leading-relaxed text-[#d9e7ea]">
                    {result.workflowTip.detail}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href="/signup?next=/app/new"
                      className="pressable inline-flex min-h-[48px] items-center gap-2 rounded-[10px] bg-white px-6 py-3 text-[15px] font-semibold text-[#0c262e] hover:bg-[#e6f2f5]"
                    >
                      <span>Start your 3 free live passports →</span>
                    </Link>
                    <Link
                      href="/demo"
                      className="pressable inline-flex min-h-[48px] items-center justify-center rounded-[10px] bg-[#16404d] px-5 py-3 text-[14.5px] font-semibold text-white hover:bg-[#1e5262]"
                    >
                      Inspect /demo passport
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Non-Legal-Advice Notice */}
          <p className="rounded-[12px] bg-white/80 px-4 py-3 text-[13px] leading-relaxed text-[#4b4f57]">
            <strong className="font-semibold text-[#0f1114]">
              {WORKING_FIELD_LIST_NOTICE}
            </strong>{" "}
            Informational scope guidance only — not legal advice and not verified by CratePass. Declared by economic operator.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
