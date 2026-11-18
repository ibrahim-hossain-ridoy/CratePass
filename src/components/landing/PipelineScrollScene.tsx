"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QrGridIcon } from "@/components/Icons";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";

interface StepItem {
  id: string;
  title: string;
  summary: string;
  metric: string;
}

const STEPS: StepItem[] = [
  {
    id: "ingest",
    title: "First, drop your OEM spec PDF",
    summary:
      "Send an existing cell or battery pack technical datasheet without converting tables into custom spreadsheets.",
    metric: "51 static fields parsed",
  },
  {
    id: "check",
    title: "Second, inspect missing fields by tier",
    summary:
      "Run a structured Annex XIII completeness check that separates populated metrics, missing disclosures, and role permissions.",
    metric: "3 access tiers mapped",
  },
  {
    id: "publish",
    title: "Third, publish your casing QR passport",
    summary:
      "Generate a mobile-fast hosted record and download SVG or PNG casing stickers backed by append-only v1/v2 snapshots.",
    metric: "SVG & PNG export",
  },
];

export function PipelineScrollScene() {
  const rootRef = useRef<HTMLElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewTier, setPreviewTier] = useState<"public" | "legit" | "auth">(
    "public",
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        root.classList.add("is-live");
        root.style.setProperty("--hold", "2.2");

        const trigger = ScrollTrigger.create({
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            root.style.setProperty("--p", p.toFixed(4));
            if (progressFillRef.current) {
              progressFillRef.current.style.transform = `scaleY(${Math.max(0.08, p).toFixed(3)})`;
            }
            const next = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
            setActiveIndex((prev) => (prev === next ? prev : next));
          },
        });

        ScrollTrigger.refresh();

        return () => {
          trigger.kill();
          root.classList.remove("is-live");
          root.style.removeProperty("--hold");
          root.style.removeProperty("--p");
        };
      },
    );

    return () => {
      mm.revert();
    };
  }, []);

  const handleStepClick = (idx: number) => {
    setActiveIndex(idx);
    const root = rootRef.current;
    if (!root || !root.classList.contains("is-live")) return;
    const rect = root.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top;
    const scrollable = Math.max(0, root.offsetHeight - window.innerHeight);
    const targetY =
      scrollTop + scrollable * (idx === 0 ? 0.08 : idx === 1 ? 0.5 : 0.9);
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <section
      id="workflow"
      ref={rootRef}
      data-chapter-theme="obsidian"
      className="scene relative z-10 bg-[#101214] text-[#f4f3ef]"
    >
      <div className="scene-stage flex min-h-[720px] items-center pb-16 pt-24 lg:min-h-svh lg:pb-12 lg:pt-28">
        <div className="page-shell grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Narrative Scrubber with Live Progress Spine */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-display-section text-white">
                One pipeline from PDF to QR
              </h2>
              <span className="shrink-0 rounded-full bg-[#171a1e] px-3 py-1 text-[14px] font-medium text-[#3eb8cf]">
                Step {activeIndex + 1} of {STEPS.length}
              </span>
            </div>

            <p className="mt-3 max-w-[44ch] text-[17px] leading-relaxed text-[#e2e5ea]">
              Each step resolves raw battery specifications into structured public
              and restricted disclosures before printing a casing label.
            </p>

            <div className="relative mt-6 flex gap-4">
              {/* Vertical Scrub Spine */}
              <div
                aria-hidden="true"
                className="hidden w-1 shrink-0 overflow-hidden rounded-full bg-[#1d2228] lg:block"
              >
                <div
                  ref={progressFillRef}
                  style={{ transform: "scaleY(0.33)" }}
                  className="h-full w-full origin-top rounded-full bg-[#3eb8cf] transition-transform duration-150"
                />
              </div>

              <div
                className="flex-1 space-y-2.5"
                role="tablist"
                aria-label="Workflow stages"
              >
                {STEPS.map((step, idx) => {
                  const active = activeIndex === idx;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleStepClick(idx)}
                      className={`w-full cursor-pointer rounded-[14px] px-4.5 py-4 text-left transition-colors duration-200 ${
                        active
                          ? "bg-[#1d2228] text-white"
                          : "bg-[#15181c] text-[#c4c8d0] hover:bg-[#1a1e23] hover:text-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display text-[19px] font-semibold leading-snug text-inherit">
                          {step.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-3 py-0.5 text-[14px] font-medium ${
                            active
                              ? "bg-[#3eb8cf] text-[#08181d]"
                              : "bg-[#232830] text-[#e2e5ea]"
                          }`}
                        >
                          {step.metric}
                        </span>
                      </div>
                      <p
                        className={`mt-1.5 text-[16px] leading-relaxed ${
                          active ? "text-[#f4f3ef]" : "text-[#b6bac2]"
                        }`}
                      >
                        {step.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Pinned Interactive Fragment & Studio Imagery */}
          <div className="lg:col-span-7">
            <div
              data-ui="pipeline-stage"
              className="relative overflow-hidden rounded-[22px] bg-[#171a1e] p-4 sm:p-6"
            >
              {/* Stage 0: BMS & 21700 Cell Hardware Extraction */}
              {activeIndex === 0 && (
                <div className="tab-panel-enter space-y-5">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[14px] bg-[#101214]">
                    <Image
                      src="/images/bms-cells-obsidian.jpg"
                      alt="Lithium-ion 21700 cell module with spot-welded nickel tabs and matte black BMS circuit board"
                      fill
                      sizes="(max-width: 1024px) 100vw, 720px"
                      className="object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="pdf-scan-beam pointer-events-none absolute inset-x-0 top-6 h-0.5 bg-[#3eb8cf]"
                    />
                  </div>
                  <dl className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#101214] px-5 py-4">
                    <div>
                      <dt className="text-[14px] text-[#c4c8d0]">Cell array</dt>
                      <dd className="num mt-0.5 text-[17px] font-semibold text-white">
                        10S4P · 21700
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[14px] text-[#c4c8d0]">BMS protocol</dt>
                      <dd className="mt-0.5 text-[17px] font-semibold text-white">
                        Dynamic SoH + cycles
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[14px] text-[#c4c8d0]">Intake check</dt>
                      <dd className="mt-0.5 text-[17px] font-semibold text-[#34d399]">
                        PDF bytes valid
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Stage 1: 71-Point Tier & Completeness Inspector */}
              {activeIndex === 1 && (
                <div className="tab-panel-enter space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-[20px] font-semibold text-white">
                        Annex XIII Access Tier Filter
                      </p>
                      <p className="mt-0.5 text-[14px] text-[#c4c8d0]">
                        {WORKING_FIELD_LIST_NOTICE}
                      </p>
                    </div>
                    <div className="inline-flex rounded-[10px] bg-[#20242a] p-1">
                      {(
                        [
                          { id: "public", label: "Public" },
                          { id: "legit", label: "Legitimate" },
                          { id: "auth", label: "Authorities" },
                        ] as const
                      ).map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setPreviewTier(tier.id)}
                          className={`cursor-pointer rounded-[8px] px-3 py-1.5 text-[14px] font-semibold transition-colors ${
                            previewTier === tier.id
                              ? "bg-[#3eb8cf] text-[#08181d]"
                              : "text-[#c4c8d0] hover:text-white"
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5 rounded-[14px] bg-[#101214] p-4 text-[17px]">
                    {previewTier === "public" && (
                      <>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Unique battery identifier</span>
                          <span className="font-semibold text-[#34d399]">Populated</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Carbon footprint declaration</span>
                          <span className="num font-semibold text-[#34d399]">68.4 kg CO2e</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">External fuse &amp; latch part SKU</span>
                          <span className="font-semibold text-[#fbbf24]">Flagged gap</span>
                        </div>
                      </>
                    )}

                    {previewTier === "legit" && (
                      <>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Detailed bill of materials</span>
                          <span className="font-semibold text-[#34d399]">Role scoped</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Disassembly sequence &amp; tools</span>
                          <span className="font-semibold text-[#34d399]">Linked</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Cell-level supplier batch code</span>
                          <span className="font-semibold text-[#fbbf24]">Needs review</span>
                        </div>
                      </>
                    )}

                    {previewTier === "auth" && (
                      <>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Full conformity test reports</span>
                          <span className="font-semibold text-[#3eb8cf]">Authorities tier</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Due-diligence supply audit ref</span>
                          <span className="font-semibold text-[#3eb8cf]">Authorities tier</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#171a1e] px-4 py-3">
                          <span className="text-[#f4f3ef]">Append-only publish ledger</span>
                          <span className="font-semibold text-[#34d399]">Immutable v1</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Stage 2: Exploded Cutaway + Print-Ready QR Label */}
              {activeIndex === 2 && (
                <div className="tab-panel-enter space-y-5">
                  <div className="overflow-hidden rounded-[14px] bg-[#e8e7e3] p-2">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px]">
                      <Image
                        src="/images/battery-cutaway-25d.jpg"
                        alt="Exploded 2.5D battery enclosure view mapping external fuse, cell pack, and BMS board"
                        fill
                        sizes="(max-width: 1024px) 100vw, 720px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-between gap-4 rounded-[14px] bg-[#101214] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 text-[#0f1114]">
                        <QrGridIcon className="h-12 w-12" />
                      </div>
                      <div>
                        <p className="font-display text-[18px] font-semibold text-white">
                          Ready for battery casing laser mark or label
                        </p>
                        <p className="mt-1 text-[14px] text-[#3eb8cf]">
                          passport.host/p/db-36v-pack
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-lg bg-[#145b6e] px-4 py-2 text-[14px] font-semibold text-white">
                      SVG + PNG downloads
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
