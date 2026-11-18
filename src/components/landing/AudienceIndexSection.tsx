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
        { yPercent: -5 },
        {
          yPercent: 5,
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
        {/* Sticky Left Column: Title + Real Hardware Studio Visual */}
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

          <div className="mt-8 overflow-hidden rounded-[20px] bg-[#e8e7e3]">
            <div ref={photoRef} className="relative aspect-[4/3] w-full">
              <Image
                src={
                  selectedId === "brands"
                    ? "/images/ebike-studio-europe.jpg"
                    : selectedId === "assemblers"
                      ? "/images/spec-datasheet-studio.jpg"
                      : "/images/qr-mobile-scan-studio.jpg"
                }
                alt={
                  selectedId === "brands"
                    ? "Minimalist European commuter e-bike photographed against a travertine architectural wall"
                    : selectedId === "assemblers"
                      ? "Engineering specification datasheets and caliper on a limestone studio desk"
                      : "Smartphone scanning a laser-etched QR code plate to open the public Digital Product Passport"
                }
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform:
                    selectedId === "brands"
                      ? "scale(1.0)"
                      : selectedId === "assemblers"
                        ? "scale(1.04)"
                        : "scale(1.04)",
                }}
              />
            </div>
            <div className="flex items-center justify-between px-5 py-4 text-[14px] font-medium text-[#0f1114]">
              <span>{active.group}</span>
              <span className="text-[#145b6e]">{active.tag}</span>
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
