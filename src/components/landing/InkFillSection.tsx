"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon } from "@/components/Icons";
import { RollingNumber } from "@/components/landing/RollingNumber";

const STATEMENT_WORDS =
  "Every battery placed on the European market carries seventy-one technical disclosures. We turn engineering datasheets into fast, permanent casing records.".split(
    " ",
  );

export function InkFillSection() {
  const statementRef = useRef<HTMLParagraphElement>(null);
  const openingRootRef = useRef<HTMLElement>(null);
  const openingWindowRef = useRef<HTMLDivElement>(null);
  const openingImageRef = useRef<HTMLDivElement>(null);
  const openingCaptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Word-by-word Ink Fill scrub (45% floor -> 100% white ink)
    const statementEl = statementRef.current;
    let inkCtx: gsap.Context | null = null;
    if (statementEl) {
      inkCtx = gsap.context(() => {
        const words = statementEl.querySelectorAll(".ink-word");
        gsap.fromTo(
          words,
          { opacity: 0.45 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: {
              trigger: statementEl,
              start: "top 82%",
              end: "bottom 42%",
              scrub: true,
            },
          },
        );
      }, statementEl);
    }

    // 2. Scene 2: Opening Window (Inset hardware window -> Full-bleed showcase)
    const root = openingRootRef.current;
    const win = openingWindowRef.current;
    const img = openingImageRef.current;
    const cap = openingCaptionRef.current;

    const mm = gsap.matchMedia();
    if (root && win && img && cap) {
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          root.classList.add("is-live");
          root.style.setProperty("--hold", "1.3");

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });

          tl.fromTo(
            win,
            { clipPath: "inset(14% 16% round 24px)" },
            { clipPath: "inset(0% 0% round 0px)", duration: 0.72 },
            0,
          )
            .fromTo(
              img,
              { scale: 1.14 },
              { scale: 1.0, duration: 0.78 },
              0,
            )
            .fromTo(
              cap,
              { y: 28, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.35 },
              0.48,
            );

          return () => {
            tl.kill();
            root.classList.remove("is-live");
            root.style.removeProperty("--hold");
          };
        },
      );
    }

    return () => {
      inkCtx?.revert();
      mm.revert();
    };
  }, []);

  return (
    <>
      {/* Quiet Editorial Interlude: Ink-Fill Statement + Rolling Figures */}
      <section
        data-chapter-theme="obsidian"
        aria-label="Annex XIII scope statement"
        className="bg-[#101214] py-24 text-[#f4f3ef] lg:py-32"
      >
        <div className="page-shell">
          <h2 className="text-display-section max-w-[20ch] text-white">
            Structured across every Annex XIII tier
          </h2>

          <p
            ref={statementRef}
            className="font-display mt-6 max-w-[42ch] text-[22px] font-medium leading-[1.34] tracking-[-0.02em] text-white sm:text-[26px] lg:text-[32px]"
          >
            {STATEMENT_WORDS.map((word, idx) => (
              <span key={idx} className="ink-word inline-block">
                {word}
                {idx < STATEMENT_WORDS.length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </p>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:max-w-[920px]">
            <div>
              <p className="font-display whitespace-nowrap text-[32px] font-semibold leading-none tracking-tight text-[#3eb8cf] sm:text-[42px]">
                <RollingNumber value={71} suffix=" points" />
              </p>
              <p className="mt-2.5 text-[17px] font-medium text-white">
                Official Annex XIII schema
              </p>
              <p className="mt-1 text-[14px] text-[#c4c8d0]">
                Structured across identity, materials, carbon, and serviceability
              </p>
            </div>

            <div>
              <p className="font-display whitespace-nowrap text-[32px] font-semibold leading-none tracking-tight text-white sm:text-[42px]">
                <RollingNumber value={51} suffix=" static" />
              </p>
              <p className="mt-2.5 text-[17px] font-medium text-white">
                Datasheet specification fields
              </p>
              <p className="mt-1 text-[14px] text-[#c4c8d0]">
                Extracted directly from OEM specification PDFs at intake
              </p>
            </div>

            <div>
              <p className="font-display whitespace-nowrap text-[32px] font-semibold leading-none tracking-tight text-[#34d399] sm:text-[42px]">
                <RollingNumber value={21} suffix=" live" />
              </p>
              <p className="mt-2.5 text-[17px] font-medium text-white">
                Dynamic BMS telemetry keys
              </p>
              <p className="mt-1 text-[14px] text-[#c4c8d0]">
                Reserved for state-of-health, cycle counters, and thermal events
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scene 2: Opening Window Hardware Showcase (Inset frame -> Full-bleed screen) */}
      <section
        ref={openingRootRef}
        data-chapter-theme="obsidian"
        aria-label="Physical battery casing showcase"
        className="scene bg-[#101214] text-[#f4f3ef]"
      >
        <div className="scene-stage flex min-h-[580px] items-end lg:min-h-svh">
          <div
            ref={openingWindowRef}
            className="relative min-h-[580px] w-full overflow-clip bg-[#e8e7e3] lg:h-svh"
          >
            <div ref={openingImageRef} className="absolute inset-0 h-full w-full">
              <Image
                src="/images/battery-pack-studio.jpg"
                alt="Anodized DB-36V lithium battery pack housing engineered for QR casing identification"
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            {/* Flat high-contrast caption block docked bottom-left inside page margins */}
            <div className="page-shell relative z-10 flex min-h-[580px] items-end pb-10 pt-24 lg:min-h-svh lg:pb-14">
              <div
                ref={openingCaptionRef}
                className="max-w-[540px] rounded-[20px] bg-[#101214] p-6 text-[#f4f3ef] sm:p-8"
              >
                <h2 className="text-display-section text-white">
                  Built for the physical casing
                </h2>
                <p className="mt-3 text-[17px] leading-relaxed text-[#e2e5ea]">
                  Every published passport resolves to a permanent{" "}
                  <span className="font-semibold text-[#3eb8cf]">/p/[slug]</span>{" "}
                  mobile route designed to open cleanly from a laser-etched or
                  thermal-printed pack label.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link
                    href="/demo"
                    className="pressable inline-flex items-center gap-2 rounded-[10px] bg-[#3eb8cf] px-5 py-2.5 text-[15px] font-semibold text-[#08181d] transition-colors hover:bg-[#5ec8dc]"
                  >
                    <span>Explore 2.5D hardware demo</span>
                    <ArrowRightIcon className="btn-arrow h-4 w-4" />
                  </Link>
                  <span className="text-[14px] font-medium text-[#c4c8d0]">
                    SVG &amp; PNG print plates included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
