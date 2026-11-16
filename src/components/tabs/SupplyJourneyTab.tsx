"use client";

import React, { useState } from "react";
import type { SupplyStage } from "@/types/passport";

interface SupplyJourneyTabProps {
  stages: SupplyStage[];
}

const REGION_CODES: Record<SupplyStage["step"], string> = {
  1: "CL",
  2: "LT",
  3: "DE",
  4: "DE",
};

export function SupplyJourneyTab({ stages }: SupplyJourneyTabProps) {
  const [activeStep, setActiveStep] = useState<SupplyStage["step"]>(4);

  const activeIdx = Math.max(
    0,
    stages.findIndex((s) => s.step === activeStep),
  );
  const activeEndX = 68 + activeIdx * 208;

  return (
    <section
      id="panel-journey"
      role="tabpanel"
      aria-labelledby="tab-desktop-journey"
      className="tab-panel-enter space-y-4"
    >
      {/* Interactive schematic route overview with animated progression */}
      <div className="stage-card-elevated rounded-[14px] bg-[#141210] p-4 text-[#F7F5F0] sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-bold text-white">
              Static Supply Route Schematic
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#A69E94]">
              Fictional four-stage material and assembly chain — select any node to trace route progression
            </p>
          </div>
          <span className="chamfer-sm border border-[#332E28] bg-[#1E1B17] px-2.5 py-1 font-mono text-[11.5px] font-bold text-[#FB923C]">
            4 fictional nodes
          </span>
        </div>

        {/* Horizontal schematic vector corridor (desktop & tablet) */}
        <div className="mt-5 hidden sm:block">
          <svg
            viewBox="0 0 760 94"
            className="h-auto w-full"
            role="img"
            aria-label="Schematic supply route from Raw Material Origin to Cell Factory, Assembly, and EU Warehouse"
          >
            {/* Base connector track */}
            <line
              x1="68"
              y1="32"
              x2="692"
              y2="32"
              stroke="#2E2924"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Active progression line up to selected node */}
            <line
              x1="68"
              y1="32"
              x2={activeEndX}
              y2="32"
              stroke="#F97316"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Live animated flowing telemetry dashes across full corridor */}
            <line
              x1="68"
              y1="32"
              x2="692"
              y2="32"
              stroke="#34D399"
              strokeWidth="2.2"
              className="route-dash-flow"
            />

            {/* Directional midpoint chevrons */}
            {[172, 380, 588].map((mx, idx) => {
              const reached = activeIdx > idx;
              return (
                <polyline
                  key={mx}
                  points={`${mx - 4},26 ${mx + 4},32 ${mx - 4},38`}
                  fill="none"
                  stroke={reached ? "#FB923C" : "#A69E94"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {stages.map((stage, idx) => {
              const cx = 68 + idx * 208;
              const isSelected = stage.step === activeStep;
              const isReached = idx <= activeIdx;
              const isFinal = idx === stages.length - 1;
              return (
                <g
                  key={stage.step}
                  onClick={() => setActiveStep(stage.step)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy="32"
                      r="24"
                      fill="none"
                      stroke={isFinal ? "#34D399" : "#F97316"}
                      strokeOpacity="0.5"
                      strokeWidth="2"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy="32"
                    r="18"
                    fill={
                      isFinal && isReached
                        ? "#34D399"
                        : isReached
                          ? "#EA580C"
                          : "#26221E"
                    }
                    stroke={isSelected ? "#FFFFFF" : "#332E28"}
                    strokeWidth={isSelected ? "2.2" : "1.5"}
                  />
                  <text
                    x={cx}
                    y="36"
                    textAnchor="middle"
                    fill={isFinal && isReached ? "#052E16" : "#FFFFFF"}
                    fontSize="11"
                    fontWeight="700"
                  >
                    {REGION_CODES[stage.step]}
                  </text>
                  <text
                    x={cx}
                    y="72"
                    textAnchor="middle"
                    fill={isSelected ? "#FB923C" : "#F7F5F0"}
                    fontSize="12.5"
                    fontWeight={isSelected ? "700" : "600"}
                  >
                    {stage.stage}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Mobile / Quick Stage Selector Pills */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stages.map((stage) => {
            const isSelected = stage.step === activeStep;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setActiveStep(stage.step)}
                aria-pressed={isSelected}
                className={`pressable flex items-center justify-between rounded-[8px] border px-2.5 py-2 text-left text-[12px] cursor-pointer ${
                  isSelected
                    ? "border-[#F97316] bg-[#281C14] text-white"
                    : "border-[#2E2924] bg-[#1C1815] text-[#A69E94] hover:text-white"
                }`}
              >
                <span className="truncate font-semibold">
                  {stage.step}. {stage.stage}
                </span>
                <span className="ml-1.5 shrink-0 font-mono text-[10.5px] font-bold text-[#FB923C]">
                  {REGION_CODES[stage.step]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected 4-stage route list */}
      <ol className="relative space-y-3">
        {stages.map((stage, idx) => {
          const isFinal = idx === stages.length - 1;
          const isSelected = stage.step === activeStep;
          return (
            <li
              key={stage.step}
              tabIndex={0}
              onClick={() => setActiveStep(stage.step)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveStep(stage.step);
                }
              }}
              className={`interactive-card surface-elevated relative cursor-pointer rounded-[12px] p-4 sm:p-5 ${
                isSelected
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/15"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <span
                    className={`num chamfer-sm flex h-7 w-7 shrink-0 items-center justify-center font-mono text-[13px] font-bold ${
                      isFinal
                        ? "bg-[var(--positive)] text-white"
                        : "bg-[var(--accent)] text-white"
                    }`}
                  >
                    {stage.step}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15.5px] font-bold text-[var(--ink)]">
                        {stage.stage}
                      </h3>
                      <span className="rounded border border-[var(--border)] bg-[var(--well-soft)] px-2 py-0.5 text-[11.5px] font-semibold text-[var(--muted)]">
                        {REGION_CODES[stage.step]} · {stage.location}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
                      {stage.facility}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">
                      {stage.detail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--rule)] pt-2.5 text-[12.5px] text-[var(--muted)] sm:shrink-0 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 sm:text-right">
                  <span className="num font-semibold text-[var(--ink)]">
                    {stage.dateWindow}
                  </span>
                  <span>{stage.transportMode}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
