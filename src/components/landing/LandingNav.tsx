"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";

type NavTheme = "putty" | "obsidian" | "chalk" | "petrol";

const THEME_STYLES: Record<
  NavTheme,
  {
    headerBg: string;
    text: string;
    navLink: string;
    signInBtn: string;
    demoBtn: string;
    progressColor: string;
  }
> = {
  putty: {
    headerBg: "bg-[#e8e7e3]",
    text: "text-[#0f1114]",
    navLink: "text-[#22252a] hover:text-[#145b6e]",
    signInBtn: "bg-[#dcdad4] text-[#0f1114] hover:bg-[#cfccc4]",
    demoBtn: "bg-[#145b6e] text-white hover:bg-[#0e4656]",
    progressColor: "bg-[#145b6e]",
  },
  obsidian: {
    headerBg: "bg-[#101214]",
    text: "text-[#f4f3ef]",
    navLink: "text-[#c4c8d0] hover:text-white",
    signInBtn: "bg-[#1d2229] text-[#f4f3ef] hover:bg-[#282e37]",
    demoBtn: "bg-[#3eb8cf] text-[#08181d] hover:bg-[#5ec8dc]",
    progressColor: "bg-[#3eb8cf]",
  },
  chalk: {
    headerBg: "bg-white",
    text: "text-[#0f1114]",
    navLink: "text-[#22252a] hover:text-[#145b6e]",
    signInBtn: "bg-[#f4f4f2] text-[#0f1114] hover:bg-[#e8e7e3]",
    demoBtn: "bg-[#145b6e] text-white hover:bg-[#0e4656]",
    progressColor: "bg-[#145b6e]",
  },
  petrol: {
    headerBg: "bg-[#0c262e]",
    text: "text-[#f4f7f8]",
    navLink: "text-[#d9e7ea] hover:text-white",
    signInBtn: "bg-[#16404d] text-white hover:bg-[#1e5262]",
    demoBtn: "bg-white text-[#0c262e] hover:bg-[#e6f2f5]",
    progressColor: "bg-[#7ce3f4]",
  },
};

export function LandingNav() {
  const [theme, setTheme] = useState<NavTheme>("putty");
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;

    const updateNavOnScroll = () => {
      rafId = null;

      // Update GPU scroll progress bar without React state re-render
      if (progressRef.current) {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const ratio =
          docHeight > 0
            ? Math.min(1, Math.max(0, window.scrollY / docHeight))
            : 0;
        progressRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }

      // Detect chapter directly beneath the 72px header
      const chapters = document.querySelectorAll<HTMLElement>(
        "[data-chapter-theme]",
      );
      const probeY = 44;
      let matched: NavTheme = "putty";

      for (const el of chapters) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom > probeY) {
          const attr = el.dataset.chapterTheme as NavTheme | undefined;
          if (attr && attr in THEME_STYLES) {
            matched = attr;
          }
          break;
        }
      }

      setTheme((prev) => (prev === matched ? prev : matched));
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateNavOnScroll);
      }
    };

    updateNavOnScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const current = THEME_STYLES[theme];

  return (
    <header
      className={`chapter-nav sticky top-0 z-40 ${current.headerBg} ${current.text}`}
    >
      <div className="page-shell flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          className="pressable inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-inherit"
        >
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="font-display whitespace-nowrap text-[16px] font-semibold tracking-tight text-inherit">
            {siteConfig.brandName}
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 whitespace-nowrap text-[15px] font-medium lg:flex"
        >
          <a
            href="#workflow"
            className={`whitespace-nowrap transition-colors duration-150 ${current.navLink}`}
          >
            Workflow
          </a>
          <a
            href="#audiences"
            className={`whitespace-nowrap transition-colors duration-150 ${current.navLink}`}
          >
            Who it is for
          </a>
          <a
            href="#preview"
            className={`whitespace-nowrap transition-colors duration-150 ${current.navLink}`}
          >
            Preview
          </a>
          <Link
            href="/pricing"
            className={`whitespace-nowrap transition-colors duration-150 ${current.navLink}`}
          >
            Pricing
          </Link>
          <Link
            href="/checker"
            className={`whitespace-nowrap transition-colors duration-150 ${current.navLink}`}
          >
            Eligibility checker
          </Link>
          <Link
            href="/demo"
            className={`whitespace-nowrap transition-colors duration-150 ${current.navLink}`}
          >
            Live demo
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/login"
            className={`pressable inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[14px] font-semibold transition-colors sm:px-4 sm:text-[15px] ${current.signInBtn}`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={`pressable inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[14px] font-semibold transition-colors sm:px-4.5 sm:text-[15px] ${current.demoBtn}`}
          >
            Sign up
          </Link>
        </div>
      </div>

      {/* Subtle GPU-composited scroll progress bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none h-[2px] w-full overflow-hidden bg-transparent"
      >
        <div
          ref={progressRef}
          style={{ transform: "scaleX(0)" }}
          className={`h-full w-full origin-left ${current.progressColor}`}
        />
      </div>
    </header>
  );
}
