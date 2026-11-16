"use client";

import React, { useEffect, useRef, useState } from "react";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";

type PhoneTabId = "passport" | "repair" | "supply" | "provenance";
type PipelineStepId = "scan" | "check" | "qr";

const PIPELINE_STEPS: {
  id: PipelineStepId;
  stepNum: string;
  label: string;
  sublabel: string;
  metric: string;
}[] = [
  {
    id: "scan",
    stepNum: "01",
    label: "Spec PDF Scan",
    sublabel: "OEM datasheet parser",
    metric: "51 static pts",
  },
  {
    id: "check",
    stepNum: "02",
    label: "71-Point Check",
    sublabel: "Annex XIII completeness",
    metric: "3-tier filter",
  },
  {
    id: "qr",
    stepNum: "03",
    label: "QR Sticker",
    sublabel: "Mobile /p/[slug] host",
    metric: "SVG + PNG",
  },
];

const COMPLETENESS_ROWS = [
  {
    id: "voltage",
    pointRef: "#10 · #13",
    field: "Rated voltage & energy",
    value: "36 V · 14.5 Ah · 522 Wh",
    source: "p. 2 · Electrical Table 1.1",
    snippet: "Nominal Voltage: 36.0 V DC | Rated Capacity: 14.5 Ah (522 Wh)",
    tier: "Public",
    present: true,
    note: "Matched",
    targetTab: "passport" as PhoneTabId,
    pipelineStep: "scan" as PipelineStepId,
  },
  {
    id: "chemistry",
    pointRef: "#20",
    field: "Cathode chemistry",
    value: "Li-ion NMC 811",
    source: "p. 3 · Cell Spec Sheet",
    snippet: "Cell Chemistry: Lithium Nickel Manganese Cobalt Oxide (NMC 811)",
    tier: "Public",
    present: true,
    note: "Matched",
    targetTab: "passport" as PhoneTabId,
    pipelineStep: "scan" as PipelineStepId,
  },
  {
    id: "carbon",
    pointRef: "#26 · #27",
    field: "Lifecycle CO2e breakdown",
    value: "Not found in PDF",
    source: "Annex XIII §4 · Flagged",
    snippet: "No lifecycle carbon footprint (kg CO2e/kWh) table detected in PDF.",
    tier: "Public (EV/Ind)",
    present: false,
    note: "Missing",
    targetTab: "provenance" as PhoneTabId,
    pipelineStep: "check" as PipelineStepId,
  },
  {
    id: "repair",
    pointRef: "#47 · #48",
    field: "External fuse & latch SKUs",
    value: "Part codes omitted",
    source: "Care & repair · Flagged",
    snippet: "Fuse rating 30 A noted, but replacement spare-part SKU is absent.",
    tier: "Legit. interest",
    present: false,
    note: "Missing",
    targetTab: "repair" as PhoneTabId,
    pipelineStep: "qr" as PipelineStepId,
  },
] as const;

const PHONE_TABS: { id: PhoneTabId; label: string }[] = [
  { id: "passport", label: "Passport" },
  { id: "repair", label: "Repair" },
  { id: "supply", label: "Supply" },
  { id: "provenance", label: "Recycle" },
];

export function CornerBrackets({
  colorClass = "border-[#F97316]",
}: {
  colorClass?: string;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 ${colorClass}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 ${colorClass}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 ${colorClass}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 ${colorClass}`}
      />
    </>
  );
}

function AnimatedQrSvg({ highlighted }: { highlighted: boolean }) {
  return (
    <div
      className={`relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[10px] border bg-white p-2 transition-colors duration-200 ${
        highlighted
          ? "border-[#F97316] ring-2 ring-[#F97316]/30"
          : "border-[#332E28]"
      }`}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        aria-label="QR code linking to /p/db-36v-pack"
        className="h-full w-full"
      >
        <rect x="8" y="8" width="30" height="30" stroke="#161412" strokeWidth="5" />
        <rect x="16" y="16" width="14" height="14" fill="#EA580C" />
        <rect x="82" y="8" width="30" height="30" stroke="#161412" strokeWidth="5" />
        <rect x="90" y="16" width="14" height="14" fill="#161412" />
        <rect x="8" y="82" width="30" height="30" stroke="#161412" strokeWidth="5" />
        <rect x="16" y="90" width="14" height="14" fill="#15803D" />

        <g fill="#161412">
          <rect x="46" y="8" width="6" height="6" />
          <rect x="58" y="8" width="12" height="6" />
          <rect x="46" y="20" width="12" height="6" />
          <rect x="64" y="20" width="6" height="12" />
          <rect x="46" y="32" width="6" height="6" />
          <rect x="8" y="46" width="12" height="6" />
          <rect x="26" y="46" width="6" height="12" />
          <rect x="38" y="46" width="18" height="6" />
          <rect x="64" y="46" width="12" height="6" />
          <rect x="82" y="46" width="6" height="12" />
          <rect x="94" y="46" width="18" height="6" />
          <rect x="8" y="58" width="6" height="12" />
          <rect x="46" y="58" width="12" height="12" />
          <rect x="70" y="58" width="6" height="12" />
          <rect x="94" y="58" width="6" height="6" />
          <rect x="106" y="58" width="6" height="18" />
          <rect x="20" y="64" width="18" height="6" />
          <rect x="46" y="76" width="6" height="18" />
          <rect x="58" y="76" width="18" height="6" />
          <rect x="82" y="76" width="12" height="12" />
          <rect x="46" y="100" width="12" height="12" />
          <rect x="64" y="88" width="6" height="18" />
          <rect x="76" y="94" width="12" height="6" />
          <rect x="94" y="88" width="18" height="12" />
          <rect x="82" y="106" width="30" height="6" />
        </g>
      </svg>
      {/* Animated laser scan line */}
      <div
        aria-hidden="true"
        className="qr-scan-line pointer-events-none absolute inset-x-1 top-1 h-[2px] bg-[#F97316]"
      />
    </div>
  );
}

export function HeroPassportStage({
  title = "Completeness check",
  badgeLabel = "Sample output – illustrative",
}: {
  title?: string;
  badgeLabel?: string;
}) {
  const [activeTab, setActiveTab] = useState<PhoneTabId>("passport");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("carbon");
  const [activePipeline, setActivePipeline] = useState<PipelineStepId>("check");
  const [isPointerInside, setIsPointerInside] = useState(false);

  // Ref-driven 3D tilt (zero React state re-renders per frame)
  const tiltContainerRef = useRef<HTMLDivElement | null>(null);
  const tiltCardRef = useRef<HTMLDivElement | null>(null);
  const floatingChipRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetTilt = useRef({ rx: 0, ry: 0 });
  const currentTilt = useRef({ rx: 0, ry: 0 });

  useEffect(() => {
    if (isPointerInside) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActivePipeline((prev) =>
        prev === "scan" ? "check" : prev === "check" ? "qr" : "scan",
      );
    }, 3400);
    return () => window.clearInterval(timer);
  }, [isPointerInside]);

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

      const rx = currentTilt.current.rx;
      const ry = currentTilt.current.ry;

      if (tiltCardRef.current) {
        tiltCardRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      if (floatingChipRef.current) {
        floatingChipRef.current.style.transform = `translate3d(${(ry * 1.1).toFixed(1)}px, ${(-rx * 1.1).toFixed(1)}px, 24px)`;
      }

      if (Math.abs(dx) > 0.04 || Math.abs(dy) > 0.04) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentTilt.current.rx = targetTilt.current.rx;
        currentTilt.current.ry = targetTilt.current.ry;
        if (tiltCardRef.current) {
          tiltCardRef.current.style.transform =
            targetTilt.current.rx === 0 && targetTilt.current.ry === 0
              ? "rotateX(0deg) rotateY(0deg)"
              : `rotateX(${targetTilt.current.rx.toFixed(2)}deg) rotateY(${targetTilt.current.ry.toFixed(2)}deg)`;
        }
        if (floatingChipRef.current) {
          floatingChipRef.current.style.transform = "translate3d(0px, 0px, 0px)";
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
    const el = tiltContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    targetTilt.current = {
      rx: -ny * 8.5,
      ry: nx * 10.5,
    };
    scheduleSpringStep();
  }

  function handlePointerLeave() {
    setIsPointerInside(false);
    targetTilt.current = { rx: 0, ry: 0 };
    scheduleSpringStep();
  }

  const selectedField =
    COMPLETENESS_ROWS.find((r) => r.id === selectedFieldId) ?? COMPLETENESS_ROWS[2];

  const activeTabIndex = Math.max(
    0,
    PHONE_TABS.findIndex((t) => t.id === activeTab),
  );
  const activePipelineIndex = Math.max(
    0,
    PIPELINE_STEPS.findIndex((s) => s.id === activePipeline),
  );

  return (
    <div
      onPointerEnter={() => setIsPointerInside(true)}
      onPointerLeave={handlePointerLeave}
      className="stage-card-elevated relative rounded-[16px] bg-[#181512] p-4 sm:p-6"
    >
      <CornerBrackets colorClass="border-[#F97316]" />

      {/* Live Animated 3-Step Motion Graphic Pipeline: Spec PDF Scan -> 71-Point Check -> QR Sticker */}
      <div className="mb-5 rounded-[12px] border border-[#332E28] bg-[#12100E] p-2.5 sm:p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11.5px]">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="status-pulse h-2 w-2 rounded-full bg-[#34D399]"
            />
            <span className="font-mono font-semibold tracking-tight text-[#F7F5F0]">
              LIVE PIPELINE · SPEC PDF → 71-POINT SCHEMA → QR PASSPORT
            </span>
          </div>
          <span className="font-mono text-[#A69E94]">
            Interactive 3D telemetry stage
          </span>
        </div>

        {/* 3 Pipeline Nodes with Sliding Highlight */}
        <div className="relative grid grid-cols-3 gap-1.5 rounded-[10px] border border-[#2B2621] bg-[#191613] p-1">
          <div
            aria-hidden="true"
            style={{
              transform: `translateX(${activePipelineIndex * 100}%)`,
            }}
            className="sliding-pill pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-[8px] border border-[#F97316]/50 bg-[#281C14]"
          />
          {PIPELINE_STEPS.map((step) => {
            const active = activePipeline === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActivePipeline(step.id);
                  if (step.id === "scan") {
                    setSelectedFieldId("voltage");
                    setActiveTab("passport");
                  } else if (step.id === "check") {
                    setSelectedFieldId("carbon");
                    setActiveTab("provenance");
                  } else {
                    setSelectedFieldId("repair");
                    setActiveTab("repair");
                  }
                }}
                className="pressable relative z-10 flex flex-col items-start justify-between rounded-[8px] px-2.5 py-2 text-left cursor-pointer"
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span
                    className={`font-mono text-[10.5px] font-bold ${
                      active ? "text-[#FB923C]" : "text-[#A69E94]"
                    }`}
                  >
                    {step.stepNum}
                  </span>
                  <span
                    className={`hidden rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold sm:inline-block ${
                      active
                        ? "bg-[#F97316]/20 text-[#FDBA8C]"
                        : "bg-[#231F1B] text-[#A69E94]"
                    }`}
                  >
                    {step.metric}
                  </span>
                </div>
                <span
                  className={`mt-0.5 text-[12px] font-bold leading-tight sm:text-[13px] ${
                    active ? "text-white" : "text-[#D6CFC7]"
                  }`}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 hidden truncate text-[11px] text-[#A69E94] sm:block">
                  {step.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-center">
        {/* Left Column: Interactive Completeness Check + QR Badge */}
        <div
          data-ui="completeness-inspector"
          className="space-y-4 xl:col-span-6"
        >
          <div className="rounded-[12px] border border-[#332E28] bg-[#1E1B17] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <div className="flex items-center gap-2.5">
                {/* Mini Animated PDF Document Scanner Graphic */}
                <div
                  aria-hidden="true"
                  className="relative flex h-10 w-8 shrink-0 flex-col justify-between overflow-hidden rounded-[5px] border border-[#494139] bg-[#12100E] p-1.5"
                >
                  <span className="h-1 w-4 rounded-sm bg-[#F97316]/80" />
                  <span className="h-0.5 w-full rounded-sm bg-[#A69E94]/50" />
                  <span className="h-0.5 w-3/4 rounded-sm bg-[#A69E94]/50" />
                  <span className="h-0.5 w-full rounded-sm bg-[#34D399]/70" />
                  <span className="pdf-scan-beam pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[#34D399]" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#F7F5F0]">
                    {title}
                  </p>
                  <code className="text-[11.5px] text-[#A69E94]">
                    battery-pack-spec.pdf · 71-pt Annex XIII schema
                  </code>
                </div>
              </div>
              <span className="rounded border border-[#F59E0B]/40 bg-[#2C1E0A] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#FCD34D]">
                {badgeLabel}
              </span>
            </div>

            {/* Animated 71-Point Schema Progress Bar */}
            <div className="mb-3 rounded-[8px] border border-[#2B2621] bg-[#141210] px-3 py-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-[#D6CFC7]">
                  LMT CATEGORY CHECK · 49 MANDATORY
                </span>
                <span className="num font-mono font-bold text-[#34D399]">
                  30 Public · 18 Legit · 1 Auth
                </span>
              </div>
              <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-[#26221E]">
                <div className="bar-fill-enter h-full w-[61%] bg-[#34D399]" />
                <div className="bar-fill-enter h-full w-[26%] bg-[#F97316]" />
              </div>
            </div>

            <div className="divide-y divide-[#2B2621] border-t border-[#2B2621]">
              {COMPLETENESS_ROWS.map((row) => {
                const isSelected = row.id === selectedFieldId;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setSelectedFieldId(row.id);
                      setActiveTab(row.targetTab);
                      setActivePipeline(row.pipelineStep);
                    }}
                    className={`pressable flex w-full items-center justify-between gap-3 px-2.5 py-2.5 text-left text-[13.5px] cursor-pointer ${
                      isSelected
                        ? "bg-[#2A231D]"
                        : "hover:bg-[#241F1A]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#FB923C]">
                          {row.pointRef}
                        </span>
                        <p className="font-semibold text-[#F7F5F0]">
                          {row.field}
                        </p>
                      </div>
                      <p className="num truncate text-[12px] text-[#A69E94]">
                        {row.value} · <span className="opacity-85">{row.source}</span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[11.5px] font-semibold ${
                        row.present
                          ? "border border-[#34D399]/40 bg-[#0A2921] text-[#6EE7B7]"
                          : "border border-[#F87171]/50 bg-[#2E1416] text-[#FCA5A5]"
                      }`}
                    >
                      {row.note}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live PDF Parser Readout for Selected Row */}
            <div className="mt-3 rounded-[8px] border border-[#332E28] bg-[#12100E] p-3 text-[12px]">
              <div className="flex items-center justify-between text-[#A69E94]">
                <span className="font-mono font-semibold text-[#FB923C]">
                  PARSER TRACE · {selectedField.source}
                </span>
                <span className="num font-mono text-[11px] font-semibold text-[#F7F5F0]">
                  Tier: {selectedField.tier}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11.5px] text-[#E6E1D8]">
                &ldquo;{selectedField.snippet}&rdquo;
              </p>
              <p className="mt-1.5 border-t border-[#26221E] pt-1.5 text-[11.5px] text-[#A69E94]">
                {WORKING_FIELD_LIST_NOTICE}
              </p>
            </div>
          </div>

          {/* Casing QR Code + Route Card */}
          <div
            className={`flex items-center gap-4 rounded-[12px] border bg-[#1E1B17] p-3.5 transition-colors duration-200 ${
              activePipeline === "qr"
                ? "border-[#F97316]"
                : "border-[#332E28]"
            }`}
          >
            <AnimatedQrSvg highlighted={activePipeline === "qr"} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="chamfer-sm bg-[#F97316] px-2 py-0.5 font-mono text-[10.5px] font-bold text-[#1A0902]">
                  SVG + PNG
                </span>
                <span className="text-[13px] font-bold text-[#F7F5F0]">
                  Pack Casing QR Label
                </span>
              </div>
              <code className="mt-1 block truncate font-mono text-[12.5px] text-[#6EE7B7]">
                https://passport.host/p/db-36v-pack
              </code>
              <p className="mt-1 text-[12px] leading-snug text-[#A69E94]">
                Scans directly to the mobile-first passport on the right with
                public-only field projection.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D / 2.5D Tilt Phone Hardware Mockup */}
        <div
          ref={tiltContainerRef}
          onPointerMove={handlePointerMove}
          data-ui="phone-passport-mockup"
          className="perspective-stage flex justify-center xl:col-span-6"
        >
          <div
            ref={tiltCardRef}
            className="preserve-3d relative w-full max-w-[364px] rounded-[32px] border-[3px] border-[#3D352E] bg-[#0E0C0A] p-3 text-[#F7F5F0] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)]"
          >
            {/* Floating 2.5D Isometric Battery Telemetry Chip */}
            <div
              ref={floatingChipRef}
              className="mb-2.5 flex items-center justify-between rounded-[12px] border border-[#332E28] bg-[#1A1613] px-3 py-2 text-[11px]"
            >
              <div className="flex items-center gap-2">
                {/* Isometric 3D Battery Pack Vector */}
                <svg
                  viewBox="0 0 36 28"
                  fill="none"
                  aria-hidden="true"
                  className="h-6 w-7 shrink-0"
                >
                  <polygon
                    points="4,9 18,3 32,9 18,15"
                    fill="#2A231D"
                    stroke="#F97316"
                    strokeWidth="1.4"
                  />
                  <polygon
                    points="4,9 18,15 18,25 4,19"
                    fill="#1D1915"
                    stroke="#A69E94"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="32,9 18,15 18,25 32,19"
                    fill="#14110E"
                    stroke="#34D399"
                    strokeWidth="1.2"
                  />
                  <circle cx="18" cy="9" r="2" fill="#34D399" />
                </svg>
                <div>
                  <span className="block font-mono text-[10px] font-bold text-[#FB923C]">
                    2.5D ENCLOSURE CAD
                  </span>
                  <span className="num font-semibold text-[#F7F5F0]">
                    10S4P · IP65 Sealed
                  </span>
                </div>
              </div>
              <span className="rounded border border-[#34D399]/40 bg-[#0A2921] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#6EE7B7]">
                QR LINKED
              </span>
            </div>

            {/* Speaker & Camera Pill */}
            <div className="mx-auto mb-2.5 flex w-24 items-center justify-center gap-2 rounded-full bg-[#1C1815] py-1">
              <span className="h-1.5 w-8 rounded-full bg-[#494139]" />
              <span className="h-2 w-2 rounded-full bg-[#F97316]" />
            </div>

            {/* Phone Identity Header */}
            <div className="rounded-[16px] border border-[#2E2924] bg-[#181512] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-[#A69E94]">
                    Demo Brand · Digital Product Passport
                  </p>
                  <p className="mt-0.5 text-[17px] font-bold tracking-tight text-white">
                    DB-36V Battery Pack
                  </p>
                </div>
                <span className="rounded border border-[#34D399]/40 bg-[#0A2921] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-[#6EE7B7]">
                  v1 LIVE
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[#E6E1D8]">
                <code className="rounded bg-[#100E0C] px-1.5 py-0.5 font-mono text-[#FB923C]">
                  /p/db-36v-pack
                </code>
                <span className="num font-medium">36 V · 14.5 Ah · 522 Wh</span>
              </div>

              <p className="mt-2.5 rounded border border-[#2B2621] bg-[#12100E] px-2.5 py-1.5 text-[11px] leading-snug text-[#A69E94]">
                Manufacturer-declared technical record · Concept demo preview
              </p>
            </div>

            {/* Interactive Tab Viewport inside Phone */}
            <div className="mt-2.5 min-h-[224px]">
              {activeTab === "passport" && (
                <div
                  key="passport"
                  className="tab-panel-enter space-y-2.5 rounded-[14px] border border-[#2E2924] bg-[#181512] p-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#2B2621] pb-2">
                    <span className="text-[12.5px] font-bold text-white">
                      Identity &amp; Material Impact
                    </span>
                    <span className="rounded bg-[#0A2921] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#6EE7B7]">
                      Public tier
                    </span>
                  </div>
                  <dl className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <dt className="text-[#A69E94]">Chemistry</dt>
                      <dd className="font-semibold text-white">Li-ion NMC 811</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#A69E94]">Pack mass</dt>
                      <dd className="num font-semibold text-white">3.18 kg</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#A69E94]">Carbon footprint</dt>
                      <dd className="num font-semibold text-[#6EE7B7]">
                        68.4 kg CO2e
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#A69E94]">Rated cycle life</dt>
                      <dd className="num font-semibold text-white">
                        800 cycles (80% SoH)
                      </dd>
                    </div>
                  </dl>
                  {/* Animated Carbon Bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-[#A69E94]">
                      <span>Raw materials &amp; cell mfg</span>
                      <span className="num text-white">76% of CO2e</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#100E0C]">
                      <div className="bar-fill-enter h-full w-[76%] rounded-full bg-[#F97316]" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "repair" && (
                <div
                  key="repair"
                  className="tab-panel-enter space-y-2 rounded-[14px] border border-[#2E2924] bg-[#181512] p-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#2B2621] pb-2">
                    <span className="text-[12.5px] font-bold text-white">
                      Care &amp; Repair Boundaries
                    </span>
                    <span className="font-mono text-[10.5px] text-[#A69E94]">
                      Safety-gated
                    </span>
                  </div>
                  <div className="rounded-[8px] border border-[#34D399]/30 bg-[#0A2921]/50 p-2.5 text-[11.5px]">
                    <p className="font-semibold text-[#6EE7B7]">
                      External Blade Fuse · User-Serviceable
                    </p>
                    <p className="mt-0.5 text-[#E6E1D8]">
                      30 A ATO fuse under weather cap (SKU: DB-FUSE-30A).
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-[#F59E0B]/40 bg-[#291D09]/70 p-2.5 text-[11.5px]">
                    <p className="font-semibold text-[#FCD34D]">
                      Cell Pack &amp; BMS Board
                    </p>
                    <p className="mt-0.5 text-[#FDE68A]/90">
                      Authorised service only – do not open the pack.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "supply" && (
                <div
                  key="supply"
                  className="tab-panel-enter space-y-2 rounded-[14px] border border-[#2E2924] bg-[#181512] p-3.5"
                >
                  <p className="border-b border-[#2B2621] pb-2 text-[12.5px] font-bold text-white">
                    Supply Chain Route
                  </p>
                  <ol className="space-y-2 text-[11.5px]">
                    <li className="flex items-center justify-between">
                      <span className="text-[#A69E94]">1. Raw Material Origin</span>
                      <span className="font-medium text-white">
                        Salton Basin &amp; Vaasa
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[#A69E94]">2. Cell Factory</span>
                      <span className="font-medium text-white">
                        Kraków Cell Works PL
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[#A69E94]">3. Assembly</span>
                      <span className="font-medium text-white">
                        Brno Mobility CZ
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[#A69E94]">4. EU Warehouse</span>
                      <span className="font-medium text-[#6EE7B7]">
                        Rotterdam Hub NL
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === "provenance" && (
                <div
                  key="provenance"
                  className="tab-panel-enter space-y-2.5 rounded-[14px] border border-[#2E2924] bg-[#181512] p-3.5"
                >
                  <p className="border-b border-[#2B2621] pb-2 text-[12.5px] font-bold text-white">
                    Provenance &amp; Recycling
                  </p>
                  <p className="text-[11.5px] leading-relaxed text-[#E6E1D8]">
                    Mandatory separate collection under EU Battery Regulation.
                    Return discharged pack to any authorised e-bike dealer or
                    municipal Li-ion collection point.
                  </p>
                  <div className="rounded bg-[#100E0C] p-2 font-mono text-[10.5px] text-[#A69E94]">
                    Status: DEMO – no real verification performed
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Phone Bottom Tab Bar with Sliding Active Pill */}
            <div
              role="tablist"
              aria-label="Interactive phone passport tabs"
              className="relative mt-2.5 grid grid-cols-4 gap-1 rounded-[14px] border border-[#2E2924] bg-[#181512] p-1"
            >
              <div
                aria-hidden="true"
                style={{
                  transform: `translateX(${activeTabIndex * 100}%)`,
                }}
                className="sliding-pill pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-[10px] bg-[#F97316]"
              />
              {PHONE_TABS.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pressable relative z-10 min-h-[42px] rounded-[10px] px-1.5 text-[11.5px] font-bold cursor-pointer ${
                      selected
                        ? "text-[#1A0902]"
                        : "text-[#A69E94] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
