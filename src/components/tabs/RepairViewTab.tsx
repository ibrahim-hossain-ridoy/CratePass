"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
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

  // Ref-driven 2.5D cutaway tilt (zero React state re-renders per frame)
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const stageTiltRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetTilt = useRef({ rx: 0, ry: 0 });
  const currentTilt = useRef({ rx: 0, ry: 0 });

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  function scheduleSpringStep() {
    if (rafRef.current !== null) return;

    const tick = () => {
      const stiffness = 0.14;
      const dx = targetTilt.current.rx - currentTilt.current.rx;
      const dy = targetTilt.current.ry - currentTilt.current.ry;

      currentTilt.current.rx += dx * stiffness;
      currentTilt.current.ry += dy * stiffness;

      if (stageTiltRef.current) {
        stageTiltRef.current.style.transform = `rotateX(${currentTilt.current.rx.toFixed(2)}deg) rotateY(${currentTilt.current.ry.toFixed(2)}deg)`;
      }

      if (Math.abs(dx) > 0.04 || Math.abs(dy) > 0.04) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentTilt.current.rx = targetTilt.current.rx;
        currentTilt.current.ry = targetTilt.current.ry;
        if (stageTiltRef.current) {
          stageTiltRef.current.style.transform =
            targetTilt.current.rx === 0 && targetTilt.current.ry === 0
              ? "rotateX(0deg) rotateY(0deg)"
              : `rotateX(${targetTilt.current.rx.toFixed(2)}deg) rotateY(${targetTilt.current.ry.toFixed(2)}deg)`;
        }
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (
      typeof window !== "undefined" &&
      (!window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }
    const el = stageContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    targetTilt.current = {
      rx: -ny * 6.5,
      ry: nx * 8.5,
    };
    scheduleSpringStep();
  }

  function handlePointerLeave() {
    targetTilt.current = { rx: 0, ry: 0 };
    scheduleSpringStep();
  }

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
      <div className="surface-elevated flex items-start gap-3 rounded-[12px] px-4 py-3.5 sm:px-5">
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <p className="text-[14px] font-medium leading-snug text-[var(--ink)]">
          {repairView.safetySummary}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* 2.5D Isometric Diagram Card */}
        <div className="stage-card-elevated overflow-hidden rounded-[16px] bg-[#101214] text-[#f4f3ef] lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#171a1e] px-5 py-4">
            <div>
              <h2 className="font-display text-[17px] font-semibold text-white">
                2.5D Component Cutaway
              </h2>
              <p className="text-[13px] text-[#c4c8d0]">
                Select a glowing pin to inspect serviceability and spare-part reference
              </p>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#e2e5ea]">
              <span className="inline-flex items-center gap-1.5">
                <span className="status-pulse h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                User
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                Workshop
              </span>
            </div>
          </div>

          {/* 3D / 2.5D Perspective Diagram Stage */}
          <div
            ref={stageContainerRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="perspective-stage relative mx-auto w-full bg-[#101214] p-3 sm:p-4"
          >
            <div
              ref={stageTiltRef}
              className="preserve-3d relative mx-auto aspect-[1376/768] w-full overflow-hidden rounded-[12px] bg-[#eae7e0]"
            >
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
                    spot.serviceability === "user" ? "#34d399" : "#f59e0b";
                  return (
                    <g key={spot.id}>
                      <line
                        x1={pos.x1}
                        y1={pos.y1}
                        x2={pos.x2}
                        y2={pos.y2}
                        stroke="#101214"
                        strokeOpacity="0.92"
                        strokeWidth={isSelected ? 6 : 3.8}
                      />
                      <line
                        x1={pos.x1}
                        y1={pos.y1}
                        x2={pos.x2}
                        y2={pos.y2}
                        stroke={isSelected ? dotColor : "#f4f3ef"}
                        strokeWidth={isSelected ? 2.8 : 1.7}
                        className={isSelected ? "route-dash-flow" : undefined}
                      />
                      {isSelected && (
                        <circle
                          cx={pos.x2}
                          cy={pos.y2}
                          r="19"
                          fill="none"
                          stroke={dotColor}
                          strokeOpacity="0.45"
                          strokeWidth="2"
                        />
                      )}
                      <circle
                        cx={pos.x2}
                        cy={pos.y2}
                        r={isSelected ? 12 : 8.5}
                        fill="#101214"
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
                    className="pressable group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#3eb8cf]"
                  >
                    {isSelected && (
                      <span
                        aria-hidden="true"
                        className={`hotspot-ring-pulse pointer-events-none absolute h-8 w-16 rounded-full border ${
                          isUser ? "border-[#34d399]" : "border-[#f59e0b]"
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold ring-2 ring-[#101214]/90 whitespace-nowrap transition-[transform,background-color] duration-150 ${
                        isSelected
                          ? isUser
                            ? "scale-105 bg-[#156d49] text-white"
                            : "scale-105 bg-[#9a440c] text-white"
                          : "bg-[#101214]/95 text-[#f4f3ef]"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : isUser
                              ? "bg-[#34d399]"
                              : "bg-[#f59e0b]"
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
          <div className="grid grid-cols-2 gap-2 bg-[#171a1e] p-3 sm:grid-cols-4 sm:px-5">
            {repairView.hotspots.map((spot) => {
              const isSelected = spot.id === selectedId;
              const isUser = spot.serviceability === "user";
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setSelectedId(spot.id)}
                  aria-pressed={isSelected}
                  className={`pressable flex min-h-[48px] flex-col items-start justify-center rounded-[10px] px-3 py-2 text-left cursor-pointer ${
                    isSelected
                      ? isUser
                        ? "bg-[#133326] text-white"
                        : "bg-[#332210] text-white"
                      : "bg-[#101214] text-[#e2e5ea] hover:bg-[#20242a]"
                  }`}
                >
                  <span className="text-[13.5px] font-semibold leading-tight">
                    {spot.shortLabel}
                  </span>
                  <span
                    className={`mt-0.5 text-[12px] font-medium leading-tight ${
                      isUser ? "text-[#34d399]" : "text-[#fbbf24]"
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
          className="hotspot-card-enter surface-elevated rounded-[12px] lg:col-span-5"
        >
          <div className="border-b border-[var(--border)] bg-[var(--well-soft)] px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                {activeHotspot.label}
              </h3>
              {activeHotspot.serviceability === "user" ? (
                <span className="inline-flex items-center rounded border border-[var(--positive-border)] bg-[var(--positive-bg)] px-2 py-0.5 text-[12px] font-semibold text-[var(--positive)]">
                  {activeHotspot.safetyTag}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-[var(--notice-border)] bg-[var(--notice-bg)] px-2 py-0.5 text-[12px] font-semibold text-[var(--notice-ink)]">
                  <LockIcon className="h-3 w-3 shrink-0" />
                  <span>Workshop only</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {activeHotspot.serviceability === "user" ? (
              <>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] px-3.5 py-2.5 text-[13px]">
                  <div>
                    <span className="text-[var(--muted)]">Est. time: </span>
                    <strong className="num font-semibold text-[var(--ink)]">
                      {activeHotspot.estimatedMinutes} min
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">Tools: </span>
                    <strong className="font-semibold text-[var(--ink)]">
                      {activeHotspot.toolRequired}
                    </strong>
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-bold text-[var(--ink)]">
                    User-level replacement steps
                  </p>
                  <ol className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-[var(--ink)]">
                    {activeHotspot.repairSteps.map((step, i) => (
                      <li key={step} className="flex items-start gap-2.5">
                        <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--well)] text-[11.5px] font-bold text-[var(--ink)]">
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
                <div className="rounded-[8px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-3.5">
                  <div className="flex items-start gap-2">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--notice-ink)]" />
                    <p className="text-[14px] font-bold leading-snug text-[var(--notice-ink)]">
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
              <div className="mt-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] px-3.5 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[14px] font-bold text-[var(--ink)]">
                    {activeHotspot.sparePart.name}
                  </span>
                  <code className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[var(--ink)]">
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
