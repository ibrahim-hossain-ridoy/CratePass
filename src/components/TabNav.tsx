"use client";

import React, { useEffect, useRef, useState } from "react";
import type { TabId } from "@/types/passport";
import {
  AuthenticityIcon,
  JourneyIcon,
  PassportIcon,
  RepairIcon,
} from "@/components/Icons";

interface TabDef {
  id: TabId;
  label: string;
  mobileLabel: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

export const TABS: TabDef[] = [
  {
    id: "passport",
    label: "Passport data",
    mobileLabel: "Passport",
    icon: PassportIcon,
  },
  {
    id: "repair",
    label: "Interactive repair",
    mobileLabel: "Repair",
    icon: RepairIcon,
  },
  {
    id: "journey",
    label: "Supply journey",
    mobileLabel: "Journey",
    icon: JourneyIcon,
  },
  {
    id: "authenticity",
    label: "Authenticity & recycling",
    mobileLabel: "Authenticity",
    icon: AuthenticityIcon,
  },
];

interface TabNavProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNav({ activeTab, onChange }: TabNavProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    ready: boolean;
  }>({ left: 0, width: 0, ready: false });

  useEffect(() => {
    function syncUnderline() {
      const activeEl = buttonRefs.current[activeTab];
      if (!activeEl) return;
      setIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
    syncUnderline();
    window.addEventListener("resize", syncUnderline);
    return () => window.removeEventListener("resize", syncUnderline);
  }, [activeTab]);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab),
  );

  return (
    <>
      {/* Sticky Desktop horizontal tab bar with sliding underline transition */}
      <nav
        aria-label="Passport sections"
        className="sticky top-0 z-30 hidden border-b border-[var(--border-strong)] bg-[var(--surface)]/95 backdrop-blur md:block"
      >
        <div
          role="tablist"
          aria-label="Passport sections"
          className="relative mx-auto flex max-w-[1040px] items-center gap-2 px-6"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  buttonRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={`tab-desktop-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onChange(tab.id)}
                className={`pressable relative inline-flex min-h-[48px] items-center gap-2 border-b-2 px-4 py-2.5 text-[14.5px] font-bold whitespace-nowrap cursor-pointer ${
                  selected
                    ? indicator.ready
                      ? "border-transparent text-[var(--ink)]"
                      : "border-[var(--accent)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                    selected ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Sliding active-tab underline indicator */}
          {indicator.ready && (
            <span
              aria-hidden="true"
              style={{
                width: `${indicator.width}px`,
                transform: `translateX(${indicator.left}px)`,
              }}
              className="sliding-pill pointer-events-none absolute bottom-0 left-0 h-[2.5px] rounded-full bg-[var(--accent)]"
            />
          )}
        </div>
      </nav>

      {/* Mobile fixed bottom navigation bar with sliding pill transition */}
      <nav
        aria-label="Passport sections mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2E2924] bg-[#141210]/95 text-[#F7F5F0] backdrop-blur md:hidden"
        style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      >
        <div
          role="tablist"
          aria-label="Passport sections"
          className="relative grid grid-cols-4 gap-1 px-2 pt-1.5"
        >
          <span
            aria-hidden="true"
            style={{
              transform: `translateX(${activeIndex * 100}%)`,
            }}
            className="sliding-pill pointer-events-none absolute inset-y-1.5 left-2 w-[calc((100%-1rem)/4)] rounded-[10px] bg-[#F97316]"
          />
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-mobile-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onChange(tab.id)}
                className={`pressable relative z-10 flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[10px] px-1 py-1.5 text-[11.5px] font-bold leading-none cursor-pointer ${
                  selected
                    ? "text-[#1A0902]"
                    : "text-[#A69E94] hover:text-white"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    selected ? "text-[#1A0902]" : "text-[#A69E94]"
                  }`}
                />
                <span>{tab.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
