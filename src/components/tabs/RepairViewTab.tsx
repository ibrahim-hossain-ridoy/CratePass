"use client";

import Image from "next/image";
import { useState } from "react";
import type { PassportDocument, RepairHotspot } from "@/types/passport";
import { AlertIcon, LockIcon } from "@/components/Icons";

interface RepairViewTabProps {
  repairView: PassportDocument["repairView"];
}

const PIN_POSITIONS: Record<
  RepairHotspot["id"],
  { left: string; top: string; x1: number; y1: number; x2: number; y2: number }
> = {
  fuse: { left: "24%", top: "86%", x1: 330, y1: 660, x2: 332, y2: 488 },
  "cell-pack": { left: "21%", top: "16%", x1: 289, y1: 123, x2: 520, y2: 425 },
  "bms-board": { left: "67%", top: "84%", x1: 922, y1: 645, x2: 865, y2: 398 },
  latch: { left: "84%", top: "14%", x1: 1156, y1: 108, x2: 1210, y2: 232 },
};

export function RepairViewTab({ repairView }: RepairViewTabProps) {
  const [selectedId, setSelectedId] = useState<RepairHotspot["id"]>("fuse");

  const activeHotspot =
    repairView.hotspots.find((h) => h.id === selectedId) ??
    repairView.hotspots[0];

  return (
    <section
      id="panel-repair"
      role="tabpanel"
      aria-labelledby="tab-desktop-repair"
      className="tab-panel-enter space-y-4"
    >
      {/* Safety boundary summary bar */}
      <div className="flex items-start gap-3 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3.5 sm:px-5">
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <p className="text-[14px] font-medium leading-snug text-[var(--ink)]">
          {repairView.safetySummary}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* 2.5D Isometric Diagram Card */}
        <div className="overflow-hidden rounded-[12px] border border-[#233242] bg-[#0B1016] text-[#F1F5F9] lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2C3A] bg-[#111923] px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-[17px] font-bold text-white">
                2.5D Component Cutaway
              </h2>
              <p className="text-[12.5px] text-[#94A3B8]">
                Select a pin to inspect serviceability and spare-part reference
              </p>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#CBD5E1]">
              <span className="inline-flex items-center gap-1.5">
                <span className="status-pulse h-2.5 w-2.5 rounded-full bg-[#34D399]" />
                User
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                Workshop
              </span>
            </div>
          </div>

          {/* Diagram Stage */}
          <div className="relative mx-auto w-full bg-[#0F1720] p-2 sm:p-3">
            <div className="relative mx-auto aspect-[1376/768] w-full overflow-hidden rounded-[10px] border border-[#233242] bg-[#131D28]">
              <Image
                src="/images/battery-cutaway-25d.jpg"
                alt="2.5D isometric cutaway studio render of the DB-36V battery pack displaying discharge fuse, cylindrical lithium cell array, BMS PCB, and frame latch"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                priority
                className="select-none object-cover"
              />

              {/* Precision vector leader callout lines over cutaway render */}
              <svg
                viewBox="0 0 1376 768"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
              >
                {repairView.hotspots.map((spot) => {
                  const pos = PIN_POSITIONS[spot.id];
                  const isSelected = spot.id === selectedId;
                  const dotColor =
                    spot.serviceability === "user" ? "#10B981" : "#F59E0B";
                  return (
                    <g key={spot.id}>
                      <line
                        x1={pos.x1}
                        y1={pos.y1}
                        x2={pos.x2}
                        y2={pos.y2}
                        stroke="#0B1016"
                        strokeOpacity="0.9"
                        strokeWidth={isSelected ? 5.5 : 3.8}
                      />
                      <line
                        x1={pos.x1}
                        y1={pos.y1}
                        x2={pos.x2}
                        y2={pos.y2}
                        stroke={isSelected ? dotColor : "#F1F5F9"}
                        strokeWidth={isSelected ? 2.6 : 1.8}
                      />
                      <circle
                        cx={pos.x2}
                        cy={pos.y2}
                        r={isSelected ? 12 : 8.5}
                        fill="#0B1016"
                        stroke={dotColor}
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={pos.x2}
                        cy={pos.y2}
                        r={isSelected ? 6.5 : 4.5}
                        fill={dotColor}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Interactive HTML Hotspot Pins (44x44px minimum touch target) */}
              {repairView.hotspots.map((spot) => {
                const pos = PIN_POSITIONS[spot.id];
                const isSelected = spot.id === selectedId;
                const isUser = spot.serviceability === "user";
                return (
                  <button
                    key={spot.id}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${spot.label} (${
                      isUser ? "User-serviceable" : "Authorised service only"
                    })`}
                    onClick={() => setSelectedId(spot.id)}
                    style={{ left: pos.left, top: pos.top }}
                    className="pressable group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#34D399]"
                  >
                    <span
                      className={`flex h-6 sm:h-7 items-center gap-1.5 rounded-full border px-2 sm:px-2.5 text-[11px] sm:text-[11.5px] font-bold ring-2 ring-[#0B1016]/80 whitespace-nowrap transition-[transform,background-color,border-color] duration-150 ${
                        isSelected
                          ? isUser
                            ? "scale-105 border-[#34D399] bg-[#059669] text-white"
                            : "scale-105 border-[#FBBF24] bg-[#D97706] text-white"
                          : "border-[#334155] bg-[#0B1016]/95 text-[#F1F5F9]"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : isUser
                              ? "bg-[#34D399]"
                              : "bg-[#F59E0B]"
                        }`}
                      />
                      <span>{spot.shortLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synchronized tactile selector buttons for thumb convenience */}
          <div className="grid grid-cols-2 gap-2 border-t border-[#1E2C3A] bg-[#111923] p-3 sm:grid-cols-4 sm:px-5">
            {repairView.hotspots.map((spot) => {
              const isSelected = spot.id === selectedId;
              const isUser = spot.serviceability === "user";
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setSelectedId(spot.id)}
                  aria-pressed={isSelected}
                  className={`pressable flex min-h-[46px] flex-col items-start justify-center rounded-[8px] border px-3 py-1.5 text-left cursor-pointer ${
                    isSelected
                      ? "border-[#34D399] bg-[#162736] text-white"
                      : "border-[#233242] bg-[#0B1016] text-[#CBD5E1] hover:border-[#3B82F6]"
                  }`}
                >
                  <span className="text-[13px] font-bold leading-tight">
                    {spot.shortLabel}
                  </span>
                  <span
                    className={`mt-0.5 text-[11px] font-medium leading-tight ${
                      isUser ? "text-[#6EE7B7]" : "text-[#FCD34D]"
                    }`}
                  >
                    {isUser ? "User-serviceable" : "Authorised only"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Hotspot Detail Card */}
        <article
          key={activeHotspot.id}
          className="hotspot-card-enter rounded-[10px] border border-[var(--border)] bg-[var(--surface)] lg:col-span-5"
        >
          <div className="border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[16px] font-semibold text-[var(--ink)]">
                {activeHotspot.label}
              </h3>
              {activeHotspot.serviceability === "user" ? (
                <span className="inline-flex items-center rounded border border-[var(--positive-border)] bg-[var(--positive-bg)] px-2 py-0.5 text-[12px] font-medium text-[var(--positive)]">
                  {activeHotspot.safetyTag}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-[var(--notice-border)] bg-[var(--notice-bg)] px-2 py-0.5 text-[12px] font-medium text-[var(--notice-ink)]">
                  <LockIcon className="h-3 w-3 shrink-0" />
                  <span>Workshop only</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {activeHotspot.serviceability === "user" ? (
              <>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-md bg-[var(--well-soft)] px-3.5 py-2.5 text-[13px]">
                  <div>
                    <span className="text-[var(--muted)]">Est. time: </span>
                    <strong className="num font-medium text-[var(--ink)]">
                      {activeHotspot.estimatedMinutes} min
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">Tools: </span>
                    <strong className="font-medium text-[var(--ink)]">
                      {activeHotspot.toolRequired}
                    </strong>
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-semibold text-[var(--ink)]">
                    User-level replacement steps
                  </p>
                  <ol className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-[var(--ink)]">
                    {activeHotspot.repairSteps.map((step, i) => (
                      <li key={step} className="flex items-start gap-2.5">
                        <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--well)] text-[11.5px] font-semibold text-[var(--ink)]">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-[var(--notice-border)] bg-[var(--notice-bg)] p-3.5">
                  <div className="flex items-start gap-2">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--notice-ink)]" />
                    <p className="text-[14px] font-semibold leading-snug text-[var(--notice-ink)]">
                      {activeHotspot.safetyTag}
                    </p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--notice-ink)]">
                    {activeHotspot.safetyNotice}
                  </p>
                </div>
              </div>
            )}

            {/* Spare part placeholder block (shown for all 4 hotspots) */}
            <div className="border-t border-[var(--rule)] pt-4">
              <p className="text-[12.5px] font-medium text-[var(--muted)]">
                Spare part reference (placeholder)
              </p>
              <div className="mt-1.5 rounded-md bg-[var(--well-soft)] px-3.5 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[var(--ink)]">
                    {activeHotspot.sparePart.name}
                  </span>
                  <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--ink)]">
                    {activeHotspot.sparePart.partNumber}
                  </code>
                </div>
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  {activeHotspot.sparePart.placeholderNote}
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
