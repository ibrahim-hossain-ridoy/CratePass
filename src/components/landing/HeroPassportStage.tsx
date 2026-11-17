"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowRightIcon, PdfFileIcon, QrGridIcon } from "@/components/Icons";

interface HeroPassportStageProps {
  title: string;
  badgeLabel: string;
}

type StageId = "pdf" | "check" | "qr";

const STAGES: { id: StageId; label: string }[] = [
  { id: "pdf", label: "Spec PDF" },
  { id: "check", label: "Completeness check" },
  { id: "qr", label: "QR sticker" },
];

export function HeroPassportStage({ title, badgeLabel }: HeroPassportStageProps) {
  const [activeStage, setActiveStage] = useState<StageId>("check");
  const [autoCycle, setAutoCycle] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoCycle) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStage((prev) =>
        prev === "pdf" ? "check" : prev === "check" ? "qr" : "pdf",
      );
    }, 4400);

    return () => window.clearInterval(timer);
  }, [autoCycle]);

  useEffect(() => {
    const container = stageRef.current;
    const hardware = cardRef.current;
    if (!container || !hardware) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (prefersReduced || !canHover) return;

    const rotX = gsap.quickTo(hardware, "rotationX", {
      duration: 0.55,
      ease: "power3.out",
    });
    const rotY = gsap.quickTo(hardware, "rotationY", {
      duration: 0.55,
      ease: "power3.out",
    });

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rotY(x * 7);
      rotX(-y * 5);
    };

    const handleLeave = () => {
      rotX(0);
      rotY(0);
    };

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);

    return () => {
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const activeIndex = STAGES.findIndex((s) => s.id === activeStage);

  const selectStage = (id: StageId) => {
    setAutoCycle(false);
    setActiveStage(id);
  };

  return (
    <div
      ref={stageRef}
      className="perspective-stage hero-stage-rise relative w-full"
    >
      <div
        ref={cardRef}
        className="preserve-3d relative overflow-hidden rounded-[22px] bg-[#dcdad4]"
      >
        {/* Full-bleed Studio Product Macro */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e8e7e3]">
          <Image
            src="/images/casing-qr-macro.jpg"
            alt="Brushed aluminum DB-36V battery enclosure with recessed laser-etched QR data badge"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 660px"
            className="object-cover object-center"
          />

          {activeStage !== "check" && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[24%] top-[36%] h-[120px] w-[140px] rounded-xl"
            >
              <div className="qr-scan-line h-0.5 w-full rounded-full bg-[#3eb8cf]" />
            </div>
          )}
        </div>

        {/* Cropped Software Instrument (`data-ui` fragment) */}
        <div
          data-ui="hero-pipeline"
          className="relative bg-[#101214] p-4 text-[#f4f3ef] sm:p-5"
        >
          <div className="relative grid grid-cols-3 rounded-[10px] bg-[#1a1d22] p-1">
            <div
              aria-hidden="true"
              className="sliding-pill pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-[8px] bg-[#145b6e]"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
            {STAGES.map((stage) => {
              const isSelected = activeStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => selectStage(stage.id)}
                  className={`relative z-10 cursor-pointer rounded-[8px] px-2 py-2 text-center text-[14px] font-semibold transition-colors duration-200 ${
                    isSelected ? "text-white" : "text-[#c4c8d0] hover:text-white"
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 min-h-[150px]">
            {activeStage === "pdf" && (
              <div className="tab-panel-enter flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d2229] text-[#3eb8cf]">
                      <PdfFileIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold text-white">
                        battery-pack-spec.pdf
                      </p>
                      <p className="text-[14px] text-[#c4c8d0]">
                        Magic-byte check passed · 4.2 MB LMT datasheet
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 pt-1 text-[14px]">
                    <div>
                      <span className="text-[#c4c8d0]">Electrical rating: </span>
                      <span className="num font-semibold text-white">36 V · 522 Wh</span>
                    </div>
                    <div>
                      <span className="text-[#c4c8d0]">Chemistry: </span>
                      <span className="font-semibold text-white">Li-ion NMC 811</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStage === "check" && (
              <div className="tab-panel-enter space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-semibold text-white">
                      {title}
                    </span>
                    <span className="rounded-md bg-[#2a2114] px-2.5 py-0.5 text-[14px] font-medium text-[#fbbf24]">
                      {badgeLabel}
                    </span>
                  </div>
                  <span className="num text-[14px] font-semibold text-[#34d399]">
                    49 / 51 static fields
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[#20242a]">
                  <div className="bar-fill-enter h-full w-[92%] rounded-full bg-[#34d399]" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[14px] text-[#e2e5ea]">
                  <span>Carbon footprint declaration: Flagged missing</span>
                  <span className="font-semibold text-[#fbbf24]">
                    External fuse &amp; latch SKUs missing
                  </span>
                </div>
              </div>
            )}

            {activeStage === "qr" && (
              <div className="tab-panel-enter flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 text-[#0f1114]">
                    <QrGridIcon className="h-12 w-12" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[15px] font-semibold text-white">
                      Hosted mobile QR passport ready
                    </p>
                    <p className="text-[14px] text-[#3eb8cf]">/p/db-36v-pack</p>
                    <p className="text-[14px] text-[#c4c8d0]">
                      3 access tiers · SVG &amp; PNG casing export
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#171a1e] px-3 py-2 text-[14px] font-semibold text-[#34d399]">
                  Snapshot v1 live
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
