"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon } from "@/components/Icons";

interface AudienceEntry {
  id: string;
  group: string;
  headline: string;
  summary: string;
  highlights: string[];
  tag: string;
  deliverableTitle: string;
  deliverableMetric: string;
  deliverableRows: { label: string; value: string; tone: "ok" | "warn" | "info" }[];
}

const AUDIENCES: AudienceEntry[] = [
  {
    id: "brands",
    group: "EU E-Bike & LMT Brands",
    headline: "Turn supplier PDFs into scannable battery passports",
    summary:
      "See which mandatory attributes your supplier populated and which entries are still missing before printing casing QR labels.",
    highlights: [
      "Hosted mobile pages at /p/[slug] with fast first paint",
      "3-tier access: Public, Legitimate Interest, and Authorities Only",
      "Downloadable vector SVG and PNG QR codes",
    ],
    tag: "LMT & Light EV fleets",
    deliverableTitle: "Brand Supplier Completeness Scorecard",
    deliverableMetric: "49 / 51 LMT static pts",
    deliverableRows: [
      { label: "Public QR route (/p/urban-36v)", value: "30 public fields ready", tone: "ok" },
      { label: "External fuse & latch SKU", value: "Missing in supplier PDF", tone: "warn" },
      { label: "Print-ready casing QR sticker", value: "SVG + 300 DPI PNG", tone: "info" },
    ],
  },
  {
    id: "assemblers",
    group: "Battery Pack Assemblers",
    headline: "Deliver structured passport packages with every batch",
    summary:
      "Standardize technical handoffs across LMT, EV, and Industrial battery lines with versioned snapshots when cell lots change.",
    highlights: [
      "71 Annex XIII points across static specification and dynamic BMS fields",
      "Immutable version history (v1, v2) anchored to published declarations",
      "Portable organization JSON export anytime",
    ],
    tag: "Contract assembly batches",
    deliverableTitle: "Batch & Cell-Lot Snapshot Ledger",
    deliverableMetric: "Immutable v1 / v2",
    deliverableRows: [
      { label: "Snapshot v2 · Cell lot LT-2026-09", value: "Current live", tone: "ok" },
      { label: "Snapshot v1 · Cell lot LT-2026-04", value: "Archived immutable", tone: "info" },
      { label: "Dynamic BMS telemetry schema", value: "21 keys reserved", tone: "ok" },
    ],
  },
  {
    id: "importers",
    group: "Importers & EU Representatives",
    headline: "Maintain one technical ledger across product lines",
    summary:
      "Keep source datasheets, completeness checks, and manufacturer responsibility declarations organized per organization.",
    highlights: [
      "Clear user-safe fuse/latch care instructions vs workshop-only cell warnings",
      "Explicit WEEE and EU battery take-back recycling notices",
      "Append-only audit trail for every published snapshot",
    ],
    tag: "Multi-SKU portfolios",
    deliverableTitle: "Multi-SKU Organization Portfolio",
    deliverableMetric: "GDPR JSON portable",
    deliverableRows: [
      { label: "Restricted authority disclosures", value: "Omitted from public /p/", tone: "ok" },
      { label: "WEEE & separate collection notice", value: "Displayed on mobile scan", tone: "ok" },
      { label: "Full organization archive", value: "1-click JSON export", tone: "info" },
    ],
  },
];

export function AudienceIndexSection() {
  const [selectedId, setSelectedId] = useState<string>("brands");
  const active = AUDIENCES.find((item) => item.id === selectedId) ?? AUDIENCES[0];
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const photo = photoRef.current;
    if (!section || !photo || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from(".audience-heading-reveal", {
        yPercent: 105,
        duration: 0.85,
        ease: "expo.out",
        clearProps: "transform",
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          once: true,
        },
      });

      gsap.from(".audience-row", {
        y: 26,
        opacity: 0,
        duration: 0.72,
        stagger: 0.11,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
      });

      gsap.fromTo(
        photo,
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="audiences"
      ref={sectionRef}
      data-chapter-theme="chalk"
      className="bg-white py-24 text-[#0f1114] lg:py-32"
    >
      <div className="page-shell grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Sticky Left Column: Title + Unique Hardware Photo (#4) + Interactive Stakeholder Deliverable Card */}
        <div className="lg:sticky lg:top-24 lg:col-span-5">
          <div className="overflow-hidden pb-1">
            <h2 className="text-display-section audience-heading-reveal text-[#0f1114]">
              Built for battery teams across the EU market
            </h2>
          </div>
          <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-[#22252a]">
            One structured data schema tailored for engineering teams, contract
            pack builders, and EU market representatives.
          </p>

          <div
            data-ui="audience-deliverable"
            className="mt-8 overflow-hidden rounded-[20px] bg-[#101214] p-4 text-[#f4f3ef] sm:p-5"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[12px] bg-[#171a1e]">
              <div ref={photoRef} className="relative h-full w-full">
                <Image
                  src="/images/bms-cells-obsidian.jpg"
                  alt="21700 cylindrical lithium cell array and matte black BMS circuit board with copper busbars"
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex items-center justify-between rounded-lg bg-[#101214]/90 px-3 py-1.5 text-[12.5px]">
                <span className="font-semibold text-white">{active.group}</span>
                <span className="font-semibold text-[#3eb8cf]">{active.tag}</span>
              </div>
            </div>

            {/* Dynamic Deliverable Breakdown for the Selected Audience */}
            <div className="mt-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-[16px] font-semibold text-white">
                  {active.deliverableTitle}
                </span>
                <span className="num rounded-md bg-[#173038] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#7dd3e8]">
                  {active.deliverableMetric}
                </span>
              </div>

              <div className="space-y-1.5 text-[13.5px]">
                {active.deliverableRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[#171a1e] px-3.5 py-2.5"
                  >
                    <span className="text-[#e2e5ea]">{row.label}</span>
                    <span
                      className={`shrink-0 font-semibold ${
                        row.tone === "ok"
                          ? "text-[#34d399]"
                          : row.tone === "warn"
                            ? "text-[#fbbf24]"
                            : "text-[#3eb8cf]"
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Index Rows */}
        <div className="space-y-3 lg:col-span-7">
          {AUDIENCES.map((item) => {
            const isActive = item.id === selectedId;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setSelectedId(item.id)}
                className={`audience-row rounded-[18px] transition-colors duration-200 ${
                  isActive ? "bg-[#f4f4f2]" : "bg-transparent hover:bg-[#f4f4f2]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-expanded={isActive}
                  className="w-full cursor-pointer p-6 text-left sm:p-7"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14px] font-semibold text-[#145b6e]">
                      {item.group}
                    </span>
                    <span className="text-[14px] font-medium text-[#4b4f57]">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-display mt-2.5 text-[22px] font-semibold leading-snug tracking-tight text-[#0f1114]">
                    {item.headline}
                  </h3>

                  <p className="mt-2.5 text-[17px] leading-relaxed text-[#22252a]">
                    {item.summary}
                  </p>

                  <ul className="mt-5 space-y-2 text-[17px] text-[#0f1114]">
                    {item.highlights.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              </div>
            );
          })}

          <div className="pt-4">
            <Link
              href="/app/new"
              className="pressable inline-flex items-center gap-2 rounded-[10px] bg-[#145b6e] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0e4656]"
            >
              <span>Try PDF completeness check</span>
              <ArrowRightIcon className="btn-arrow h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
