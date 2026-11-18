"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon, PdfFileIcon, QrGridIcon } from "@/components/Icons";

interface HeroPassportStageProps {
  title: string;
  badgeLabel: string;
}

type StageId = "pdf" | "check" | "qr";

const STAGES: { id: StageId; label: string }[] = [
  { id: "pdf", label: "1. Spec PDF" },
  { id: "check", label: "2. Completeness check" },
  { id: "qr", label: "3. QR sticker" },
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
    if (!container || !hardware || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);

    // Receding hero scroll-out effect (motion.md §6 Receding hero)
    const scrollTween = gsap.to(container, {
      yPercent: 5,
      scale: 0.968,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top 18%",
        end: "bottom top",
        scrub: true,
      },
    });

    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (!canHover) {
      return () => {
        scrollTween.kill();
      };
    }

    const rotX = gsap.quickTo(hardware, "rotationX", {
      duration: 0.5,
      ease: "power3.out",
    });
    const rotY = gsap.quickTo(hardware, "rotationY", {
      duration: 0.5,
      ease: "power3.out",
    });

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rotY(x * 7.5);
      rotX(-y * 5.5);
    };

    const handleLeave = () => {
      rotX(0);
      rotY(0);
    };

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);

    return () => {
      scrollTween.kill();
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
        {/* Dedicated Hero Studio Photograph (used ONLY here on the landing page) */}
        <div className="hero-shutter-frame relative aspect-[16/10] w-full overflow-hidden bg-[#e8e7e3]">
          <div className="hero-shutter-img relative h-full w-full">
            <Image
              src="/images/ebike-studio-europe.jpg"
              alt="Minimalist European commuter electric bicycle in an architectural travertine courtyard"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 660px"
              className="object-cover object-center"
            />
          </div>

          {/* Live Hardware-to-Passport Overlay Pills */}
          <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-[#101214]/90 px-3 py-1 text-[12.5px] font-semibold text-white">
              EU Regulation 2023/1542 · Annex XIII
            </span>
            <span className="num rounded-full bg-[#145b6e] px-3 py-1 text-[12.5px] font-semibold text-white">
              LMT · EV · Industrial
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-4 bottom-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#101214]/92 px-3.5 py-2 text-[12.5px] text-white">
            <span className="font-medium text-[#e2e5ea]">
              DB-36V Commuter Pack · 36 V · 522 Wh
            </span>
            <span className="font-semibold text-[#3eb8cf]">
              QR route: /p/db-36v-pack
            </span>
          </div>
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
                  className={`relative z-10 cursor-pointer rounded-[8px] px-2 py-2 text-center text-[13.5px] font-semibold transition-colors duration-200 ${
                    isSelected
                      ? "bg-[#145b6e] text-white"
                      : "text-[#c4c8d0] hover:text-white"
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 min-h-[168px]">
            {activeStage === "pdf" && (
              <div className="tab-panel-enter space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d2229] text-[#3eb8cf]">
                      <PdfFileIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold text-white">
                        battery-pack-spec.pdf
                      </p>
                      <p className="text-[13px] text-[#c4c8d0]">
                        Magic-byte check passed · 51 static fields scanned
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-[#0a2921] px-2.5 py-1 text-[12px] font-semibold text-[#6ee7b7]">
                    Parsed in 2.4s
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[13px]">
                  <div className="rounded-lg bg-[#171a1e] px-3 py-2">
                    <span className="block text-[11.5px] text-[#c4c8d0]">
                      #14 Nominal voltage &amp; energy
                    </span>
                    <span className="num font-semibold text-white">
                      36.0 V · 14.5 Ah (522 Wh)
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#171a1e] px-3 py-2">
                    <span className="block text-[11.5px] text-[#c4c8d0]">
                      #28 Chemistry &amp; cell array
                    </span>
                    <span className="font-semibold text-white">
                      Li-ion NMC 811 · 10S4P
                    </span>
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
                    <span className="rounded-md bg-[#2a2114] px-2.5 py-0.5 text-[13px] font-medium text-[#fbbf24]">
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

                <div className="grid grid-cols-2 gap-2 pt-0.5 text-[12.5px] sm:grid-cols-4">
                  <div className="rounded-lg bg-[#171a1e] px-2.5 py-1.5">
                    <span className="block text-[#c4c8d0]">Identity</span>
                    <span className="num font-semibold text-[#34d399]">16 / 16</span>
                  </div>
                  <div className="rounded-lg bg-[#171a1e] px-2.5 py-1.5">
                    <span className="block text-[#c4c8d0]">Health</span>
                    <span className="num font-semibold text-[#34d399]">12 / 12</span>
                  </div>
                  <div className="rounded-lg bg-[#171a1e] px-2.5 py-1.5">
                    <span className="block text-[#c4c8d0]">Repair</span>
                    <span className="num font-semibold text-[#fbbf24]">10 / 12</span>
                  </div>
                  <div className="rounded-lg bg-[#171a1e] px-2.5 py-1.5">
                    <span className="block text-[#c4c8d0]">Impact</span>
                    <span className="num font-semibold text-[#34d399]">11 / 11</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#e2e5ea]">
                  <span>Carbon footprint declaration: Populated</span>
                  <span className="font-semibold text-[#fbbf24]">
                    2 missing: External fuse &amp; latch SKUs
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
                    <p className="text-[13px] text-[#c4c8d0]">
                      Public (30) · Legitimate (27) · Authorities (14)
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
