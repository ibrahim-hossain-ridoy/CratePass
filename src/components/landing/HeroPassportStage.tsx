"use client";

import React, { useState } from "react";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";

type PhoneTabId = "passport" | "repair" | "supply" | "provenance";

const COMPLETENESS_ROWS = [
  {
    id: "voltage",
    field: "Rated voltage & energy",
    value: "36 V · 14.5 Ah · 522 Wh",
    source: "p. 2 · Electrical Table 1.1",
    snippet: "Nominal Voltage: 36.0 V DC | Rated Capacity: 14.5 Ah (522 Wh)",
    present: true,
    note: "Matched",
    targetTab: "passport" as PhoneTabId,
  },
  {
    id: "chemistry",
    field: "Cathode chemistry",
    value: "Li-ion NMC 811",
    source: "p. 3 · Cell Spec Sheet",
    snippet: "Cell Chemistry: Lithium Nickel Manganese Cobalt Oxide (NMC 811)",
    present: true,
    note: "Matched",
    targetTab: "passport" as PhoneTabId,
  },
  {
    id: "carbon",
    field: "Lifecycle CO2e breakdown",
    value: "Not found in PDF",
    source: "Annex XIII §4 · Flagged",
    snippet: "No lifecycle carbon footprint (kg CO2e/kWh) table detected in PDF.",
    present: false,
    note: "Missing",
    targetTab: "provenance" as PhoneTabId,
  },
  {
    id: "repair",
    field: "External fuse & latch SKUs",
    value: "Part codes omitted",
    source: "Care & repair · Flagged",
    snippet: "Fuse rating 30 A noted, but replacement spare-part SKU is absent.",
    present: false,
    note: "Missing",
    targetTab: "repair" as PhoneTabId,
  },
] as const;

export function CornerBrackets({
  colorClass = "border-[#34D399]",
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

function AnimatedQrSvg() {
  return (
    <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[8px] border border-[#233242] bg-white p-2">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        aria-label="QR code linking to /p/db-36v-pack"
        className="h-full w-full"
      >
        <rect x="8" y="8" width="30" height="30" stroke="#0B1017" strokeWidth="5" />
        <rect x="16" y="16" width="14" height="14" fill="#1D4ED8" />
        <rect x="82" y="8" width="30" height="30" stroke="#0B1017" strokeWidth="5" />
        <rect x="90" y="16" width="14" height="14" fill="#0B1017" />
        <rect x="8" y="82" width="30" height="30" stroke="#0B1017" strokeWidth="5" />
        <rect x="16" y="90" width="14" height="14" fill="#059669" />

        <g fill="#0B1017">
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
        className="qr-scan-line pointer-events-none absolute inset-x-1 top-1 h-[2px] bg-[#10B981]"
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

  const selectedField =
    COMPLETENESS_ROWS.find((r) => r.id === selectedFieldId) ?? COMPLETENESS_ROWS[2];

  return (
    <div className="relative rounded-[14px] border border-[#233242] bg-[#0F1720] p-4 sm:p-6">
      <CornerBrackets colorClass="border-[#34D399]" />

      {/* Stage Top Telemetry Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2C3A] pb-3.5 text-[12px]">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="status-pulse h-2 w-2 rounded-full bg-[#34D399]"
          />
          <span className="font-mono font-semibold text-[#F1F5F9]">
            Interactive Spec-to-Passport Stage
          </span>
        </div>
        <span className="font-mono text-[#94A3B8]">
          Click any field or phone tab to inspect
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-center">
        {/* Left Column: Interactive Completeness Check + QR Badge */}
        <div data-ui="completeness-inspector" className="space-y-4 xl:col-span-6">
          <div className="rounded-[12px] border border-[#233242] bg-[#131D28] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <div>
                <p className="text-[15px] font-bold text-[#F1F5F9]">
                  {title}
                </p>
                <code className="text-[12px] text-[#94A3B8]">
                  battery-pack-spec.pdf · 31 working fields
                </code>
              </div>
              <span className="rounded border border-[#F59E0B]/40 bg-[#291D09] px-2.5 py-0.5 text-[12px] font-semibold text-[#FCD34D]">
                {badgeLabel}
              </span>
            </div>

            <div className="divide-y divide-[#1E2C3A] border-t border-[#1E2C3A]">
              {COMPLETENESS_ROWS.map((row) => {
                const isSelected = row.id === selectedFieldId;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setSelectedFieldId(row.id);
                      setActiveTab(row.targetTab);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left text-[13.5px] transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#1A2837]"
                        : "hover:bg-[#17222F]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#F1F5F9]">{row.field}</p>
                      <p className="num truncate text-[12px] text-[#94A3B8]">
                        {row.value} · <span className="opacity-80">{row.source}</span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[11.5px] font-semibold ${
                        row.present
                          ? "border border-[#34D399]/40 bg-[#0A2921] text-[#6EE7B7]"
                          : "border border-[#F87171]/50 bg-[#2C1317] text-[#FCA5A5]"
                      }`}
                    >
                      {row.note}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live PDF Parser Readout for Selected Row */}
            <div className="mt-3 rounded-[8px] border border-[#233242] bg-[#0B1016] p-3 text-[12px]">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="font-mono font-semibold text-[#6EE7B7]">
                  PARSER TRACE · {selectedField.source}
                </span>
                <span className="num font-semibold text-[#F1F5F9]">
                  2 populated · 2 flagged
                </span>
              </div>
              <p className="mt-1 font-mono text-[11.5px] text-[#CBD5E1]">
                &ldquo;{selectedField.snippet}&rdquo;
              </p>
              <p className="mt-1.5 border-t border-[#1E2C3A] pt-1.5 text-[11.5px] text-[#94A3B8]">
                {WORKING_FIELD_LIST_NOTICE}
              </p>
            </div>
          </div>

          {/* Casing QR Code + Route Card */}
          <div className="flex items-center gap-4 rounded-[12px] border border-[#233242] bg-[#131D28] p-3.5">
            <AnimatedQrSvg />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="chamfer-sm bg-[#34D399] px-2 py-0.5 font-mono text-[10.5px] font-bold text-[#052E16]">
                  SVG + PNG
                </span>
                <span className="text-[13px] font-bold text-[#F1F5F9]">
                  Pack Casing QR Label
                </span>
              </div>
              <code className="mt-1 block truncate font-mono text-[12.5px] text-[#6EE7B7]">
                https://passport.host/p/db-36v-pack
              </code>
              <p className="mt-1 text-[12px] leading-snug text-[#94A3B8]">
                Scans directly to the mobile-first passport on the right with
                public-only field projection.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 2.5D Phone Hardware Mockup */}
        <div data-ui="phone-passport-mockup" className="flex justify-center xl:col-span-6">
          <div className="w-full max-w-[356px] rounded-[30px] border-[3px] border-[#2A3C4F] bg-[#090D12] p-3 text-[#F1F5F9]">
            {/* Speaker & Camera Pill */}
            <div className="mx-auto mb-2.5 flex w-24 items-center justify-center gap-2 rounded-full bg-[#131C26] py-1">
              <span className="h-1.5 w-8 rounded-full bg-[#334155]" />
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
            </div>

            {/* Phone Identity Header */}
            <div className="rounded-[16px] border border-[#1E2D3D] bg-[#111923] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-[#94A3B8]">
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

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[#CBD5E1]">
                <code className="rounded bg-[#0B1016] px-1.5 py-0.5 font-mono text-[#6EE7B7]">
                  /p/db-36v-pack
                </code>
                <span className="num font-medium">36 V · 14.5 Ah · 522 Wh</span>
              </div>

              <p className="mt-2.5 rounded border border-[#1E2D3D] bg-[#0B1016] px-2.5 py-1.5 text-[11px] leading-snug text-[#94A3B8]">
                Manufacturer-declared technical record · Concept demo preview
              </p>
            </div>

            {/* Interactive Tab Viewport inside Phone */}
            <div className="mt-2.5 min-h-[226px]">
              {activeTab === "passport" && (
                <div
                  key="passport"
                  className="tab-panel-enter space-y-2.5 rounded-[14px] border border-[#1E2D3D] bg-[#111923] p-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#1E2D3D] pb-2">
                    <span className="text-[12.5px] font-bold text-white">
                      Identity &amp; Material Impact
                    </span>
                    <span className="rounded bg-[#0A2921] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#6EE7B7]">
                      Public tier
                    </span>
                  </div>
                  <dl className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <dt className="text-[#94A3B8]">Chemistry</dt>
                      <dd className="font-semibold text-white">Li-ion NMC 811</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#94A3B8]">Pack mass</dt>
                      <dd className="num font-semibold text-white">3.18 kg</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#94A3B8]">Carbon footprint</dt>
                      <dd className="num font-semibold text-[#6EE7B7]">
                        68.4 kg CO2e
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#94A3B8]">Rated cycle life</dt>
                      <dd className="num font-semibold text-white">
                        800 cycles (80% SoH)
                      </dd>
                    </div>
                  </dl>
                  {/* Animated Carbon Bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-[#94A3B8]">
                      <span>Raw materials &amp; cell mfg</span>
                      <span className="num text-white">76% of CO2e</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#0B1016]">
                      <div className="bar-fill-enter h-full w-[76%] rounded-full bg-[#34D399]" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "repair" && (
                <div
                  key="repair"
                  className="tab-panel-enter space-y-2 rounded-[14px] border border-[#1E2D3D] bg-[#111923] p-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#1E2D3D] pb-2">
                    <span className="text-[12.5px] font-bold text-white">
                      Care &amp; Repair Boundaries
                    </span>
                    <span className="font-mono text-[10.5px] text-[#94A3B8]">
                      Safety-gated
                    </span>
                  </div>
                  <div className="rounded-[8px] border border-[#34D399]/30 bg-[#0A2921]/50 p-2.5 text-[11.5px]">
                    <p className="font-semibold text-[#6EE7B7]">
                      External Blade Fuse · User-Serviceable
                    </p>
                    <p className="mt-0.5 text-[#CBD5E1]">
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
                  className="tab-panel-enter space-y-2 rounded-[14px] border border-[#1E2D3D] bg-[#111923] p-3.5"
                >
                  <p className="border-b border-[#1E2D3D] pb-2 text-[12.5px] font-bold text-white">
                    Supply Chain Route
                  </p>
                  <ol className="space-y-2 text-[11.5px]">
                    <li className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">1. Raw Material Origin</span>
                      <span className="font-medium text-white">
                        Salton Basin &amp; Vaasa
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">2. Cell Factory</span>
                      <span className="font-medium text-white">
                        Kraków Cell Works PL
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">3. Assembly</span>
                      <span className="font-medium text-white">
                        Brno Mobility CZ
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">4. EU Warehouse</span>
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
                  className="tab-panel-enter space-y-2.5 rounded-[14px] border border-[#1E2D3D] bg-[#111923] p-3.5"
                >
                  <p className="border-b border-[#1E2D3D] pb-2 text-[12.5px] font-bold text-white">
                    Provenance &amp; Recycling
                  </p>
                  <p className="text-[11.5px] leading-relaxed text-[#CBD5E1]">
                    Mandatory separate collection under EU Battery Regulation.
                    Return discharged pack to any authorised e-bike dealer or
                    municipal Li-ion collection point.
                  </p>
                  <div className="rounded bg-[#0B1016] p-2 font-mono text-[10.5px] text-[#94A3B8]">
                    Status: DEMO – no real verification performed
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Phone Bottom Tab Bar */}
            <div
              role="tablist"
              aria-label="Interactive phone passport tabs"
              className="mt-2.5 grid grid-cols-4 gap-1 rounded-[14px] border border-[#1E2D3D] bg-[#111923] p-1"
            >
              {(
                [
                  { id: "passport", label: "Passport" },
                  { id: "repair", label: "Repair" },
                  { id: "supply", label: "Supply" },
                  { id: "provenance", label: "Recycle" },
                ] as const
              ).map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[38px] rounded-[10px] px-1.5 text-[11.5px] font-semibold transition-colors cursor-pointer ${
                      selected
                        ? "bg-[#34D399] text-[#052E16]"
                        : "text-[#94A3B8] hover:text-white"
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
