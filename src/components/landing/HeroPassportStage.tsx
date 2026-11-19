"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon, QrGridIcon } from "@/components/Icons";

interface HeroPassportStageProps {
  title: string;
  badgeLabel: string;
}

export function HeroPassportStage({ title, badgeLabel }: HeroPassportStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = stageRef.current;
    const imgWrap = imageWrapRef.current;
    if (!container || !imgWrap || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);

    // Receding hero cinema frame on scroll
    const scrollTween = gsap.to(container, {
      yPercent: 4,
      scale: 0.978,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top 18%",
        end: "bottom top",
        scrub: true,
      },
    });

    const imgTween = gsap.fromTo(
      imgWrap,
      { scale: 1.05 },
      {
        scale: 1.0,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    return () => {
      scrollTween.kill();
      imgTween.kill();
    };
  }, []);

  return (
    <div ref={stageRef} className="hero-stage-rise w-full">
      {/* Full-Width Cinema-Scale Architectural Visual (No card folder, no nested SaaS boxes) */}
      <div className="overflow-hidden rounded-[22px] bg-[#101214]">
        <div className="hero-shutter-frame relative aspect-[16/10] w-full overflow-hidden bg-[#d8d6cf] sm:aspect-[16/8] lg:h-[420px] lg:aspect-auto">
          <div
            ref={imageWrapRef}
            className="hero-shutter-img absolute inset-0"
          >
            <Image
              src="/images/ebike-studio-europe.jpg"
              alt="Minimalist European commuter electric bicycle in an architectural travertine stone courtyard"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1240px"
              className="object-cover object-center"
            />
          </div>
        </div>

        {/* Single Horizontal Architectural Telemetry Ribbon */}
        <div className="flex flex-col justify-between gap-4 bg-[#101214] px-5 py-4 text-[#f4f3ef] sm:px-7 sm:py-5 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-white">
              <span
                aria-hidden="true"
                className="status-pulse h-2 w-2 rounded-full bg-[#34d399]"
              />
              <span>{title}</span>
            </span>
            <span className="rounded-md bg-[#2a2114] px-2.5 py-1 text-[14px] font-medium text-[#fbbf24]">
              {badgeLabel}
            </span>
            <span className="num text-[15px] text-[#c4c8d0]">
              71 Annex XIII points · 49 / 51 static fields populated · 3 access tiers
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white p-1 text-[#0f1114]">
                <QrGridIcon className="h-6 w-6" />
              </span>
              <span className="text-[15px] font-semibold text-[#3eb8cf]">
                /p/db-36v-pack
              </span>
            </div>

            <Link
              href="/demo"
              className="pressable inline-flex items-center gap-1.5 rounded-[9px] bg-[#1d2229] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#282e37]"
            >
              <span>Inspect specimen</span>
              <ArrowRightIcon className="btn-arrow h-4 w-4 text-[#3eb8cf]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
