"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  AuthenticityIcon,
  BrandMark,
  JourneyIcon,
  PassportIcon,
  QrGridIcon,
  RepairIcon,
  WheeledBinIcon,
} from "@/components/Icons";

type PreviewTabId = "passport" | "repair" | "journey" | "authenticity";

const PREVIEW_TABS: {
  id: PreviewTabId;
  label: string;
  icon: typeof PassportIcon;
}[] = [
  { id: "passport", label: "Passport data", icon: PassportIcon },
  { id: "repair", label: "Interactive repair", icon: RepairIcon },
  { id: "journey", label: "Supply journey", icon: JourneyIcon },
  {
    id: "authenticity",
    label: "Authenticity & recycling",
    icon: AuthenticityIcon,
  },
];

/** Interactive 4-tab preview of the /demo mobile passport and QR casing card. */
export function PassportPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTabId>("passport");

  return (
    <div className="overflow-hidden rounded-[22px] bg-[#101214] text-[#f4f3ef]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#171a1e] px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="status-pulse h-2.5 w-2.5 rounded-full bg-[#34d399]"
          />
          <span className="text-[14px] font-medium text-[#f4f3ef]">
            /demo · DB-36V Battery Pack
          </span>
        </div>
        <span className="rounded-md bg-[#2a2114] px-3 py-1 text-[14px] font-medium text-[#fbbf24]">
          Static preview of live UI
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="p-5 sm:p-7 lg:col-span-8">
          <div
            data-ui="passport-sheet"
            className="overflow-hidden rounded-[14px] bg-[#f4f4f2] text-[#0f1114]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <BrandMark className="h-8 w-8 shrink-0" />
                <div>
                  <p className="text-[14px] font-medium text-[#4b4f57]">
                    Demo Brand · Digital Product Passport
                  </p>
                  <p className="font-display text-[17px] font-semibold leading-tight text-[#0f1114]">
                    DB-36V Battery Pack
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-md bg-[#fdf6ec] px-2.5 py-1 text-[14px] font-semibold text-[#7c380b]">
                Concept demo – fictional data
              </span>
            </div>

            {/* Interactive Tab Switcher inside Specimen Preview */}
            <div
              role="tablist"
              aria-label="Passport preview tabs"
              className="flex flex-wrap gap-2 bg-[#f9f9f7] px-4 py-2 text-[14px] font-semibold"
            >
              {PREVIEW_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pressable inline-flex cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 transition-colors ${
                      isSelected
                        ? "bg-[#145b6e] text-white"
                        : "text-[#4b4f57] hover:bg-[#e8e7e3] hover:text-[#0f1114]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? "text-white" : "text-[#145b6e]"
                      }`}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Passport Data + Cutaway Summary */}
            {activeTab === "passport" && (
              <div className="tab-panel-enter grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <div className="rounded-[12px] bg-white p-4">
                  <div className="flex items-center justify-between gap-2 pb-2.5">
                    <span className="font-display text-[17px] font-semibold text-[#0f1114]">
                      Identity &amp; rating
                    </span>
                    <span className="rounded-md bg-[#edf8f2] px-2.5 py-0.5 text-[14px] font-semibold text-[#156d49]">
                      Public
                    </span>
                  </div>
                  <dl className="space-y-2.5 text-[14px]">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-[#4b4f57]">Passport ID</dt>
                      <dd className="num font-semibold text-[#0f1114]">
                        DPP-DEMO-DB36V-00419
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-[#4b4f57]">Electrical rating</dt>
                      <dd className="num font-semibold text-[#0f1114]">
                        36 V · 14.5 Ah (522 Wh)
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-[#4b4f57]">Chemistry</dt>
                      <dd className="font-semibold text-[#0f1114]">
                        Li-ion NMC 811
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-[#4b4f57]">Carbon footprint</dt>
                      <dd className="num font-semibold text-[#156d49]">
                        68.4 kg CO2e
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col justify-between rounded-[12px] bg-white p-4">
                  <div className="flex items-center justify-between gap-2 pb-2.5">
                    <span className="font-display text-[17px] font-semibold text-[#0f1114]">
                      2.5D Repair Cutaway
                    </span>
                    <span className="rounded-md bg-[#f4f4f2] px-2.5 py-0.5 text-[14px] font-semibold text-[#0f1114]">
                      4 hotspots
                    </span>
                  </div>

                  <div className="relative my-2 aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#e8e7e3]">
                    <Image
                      src="/images/battery-cutaway-25d.jpg"
                      alt="Exploded 2.5D battery cutaway showing external fuse, latch, 21700 cells, and BMS"
                      fill
                      sizes="(max-width: 768px) 90vw, 340px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[14px] font-semibold">
                    <span className="text-[#156d49]">
                      Fuse &amp; latch: User steps
                    </span>
                    <span className="text-[#9a440c]">Cells: Workshop only</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Interactive 2.5D Repair Boundary Preview */}
            {activeTab === "repair" && (
              <div className="tab-panel-enter grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] bg-[#e8e7e3]">
                  <Image
                    src="/images/battery-cutaway-25d.jpg"
                    alt="2.5D battery pack repair diagram highlighting user-serviceable fuse and latch"
                    fill
                    sizes="(max-width: 768px) 90vw, 360px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between rounded-[12px] bg-white p-4">
                  <div>
                    <span className="rounded-md bg-[#edf8f2] px-2.5 py-0.5 text-[14px] font-semibold text-[#156d49]">
                      User-serviceable boundary
                    </span>
                    <p className="font-display mt-2 text-[17px] font-semibold text-[#0f1114]">
                      External 30A fuse &amp; mounting latch
                    </p>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-[#22252a]">
                      Step-by-step tool and spare part references for external
                      components, while internal 21700 cells and BMS carry
                      authorised workshop warnings.
                    </p>
                  </div>
                  <p className="mt-3 text-[14px] font-semibold text-[#145b6e]">
                    Spare SKU: DB36-FUSE-30A · Torque 1.2 Nm
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Supply Journey Preview */}
            {activeTab === "journey" && (
              <div className="tab-panel-enter p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {[
                    { code: "CL", stage: "Raw Material Origin", place: "Antofagasta" },
                    { code: "LT", stage: "Cell Factory", place: "Vilnius" },
                    { code: "DE", stage: "Assembly", place: "Nuremberg" },
                    { code: "DE", stage: "EU Warehouse", place: "Rotterdam / DE" },
                  ].map((node) => (
                    <div key={node.stage} className="rounded-[12px] bg-white p-3.5">
                      <span className="inline-block rounded-md bg-[#e6f2f5] px-2 py-0.5 text-[14px] font-semibold text-[#0b3c49]">
                        {node.code}
                      </span>
                      <p className="font-display mt-2 text-[16px] font-semibold text-[#0f1114]">
                        {node.stage}
                      </p>
                      <p className="mt-0.5 text-[14px] text-[#4b4f57]">
                        {node.place}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Authenticity & Recycling Preview */}
            {activeTab === "authenticity" && (
              <div className="tab-panel-enter grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <div className="rounded-[12px] bg-white p-4">
                  <p className="font-display text-[17px] font-semibold text-[#0f1114]">
                    Snapshot provenance
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#22252a]">
                    Append-only version history anchored to manufacturer
                    declarations (`DEMO – no real verification performed`).
                  </p>
                  <p className="mt-3 text-[14px] font-semibold text-[#145b6e]">
                    Record ID: DPP-CERT-2026-00419
                  </p>
                </div>
                <div className="flex items-start gap-3.5 rounded-[12px] bg-white p-4">
                  <WheeledBinIcon className="h-10 w-10 shrink-0 text-[#0f1114]" />
                  <div>
                    <p className="font-display text-[17px] font-semibold text-[#0f1114]">
                      WEEE &amp; EU battery take-back
                    </p>
                    <p className="mt-1 text-[14px] leading-relaxed text-[#22252a]">
                      Separate Li-ion collection symbol and terminal insulation
                      steps before drop-off.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 bg-[#171a1e] p-6 lg:col-span-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 text-[#0f1114]">
                <QrGridIcon className="h-12 w-12" />
              </div>
              <div>
                <p className="font-display text-[17px] font-semibold text-white">
                  Phone-first QR delivery
                </p>
                <p className="mt-1 text-[14px] text-[#c4c8d0]">
                  Zero heavy script payload on scan routes.
                </p>
              </div>
            </div>

            <p className="text-[17px] leading-relaxed text-[#e2e5ea]">
              Inspect all 4 interactive tabs: grouped product attributes,
              safety-bounded 2.5D repair pins, supply chain origins, and
              end-of-life recycling notices.
            </p>
          </div>

          <Link
            href="/demo"
            className="pressable inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#3eb8cf] px-5 py-3 text-[15px] font-semibold text-[#08181d] transition-colors hover:bg-[#5ec8dc]"
          >
            <span>Open interactive /demo</span>
            <ArrowRightIcon className="btn-arrow h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
