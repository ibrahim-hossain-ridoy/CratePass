"use client";

import React from "react";
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
  return (
    <>
      {/* Sticky Desktop horizontal tab bar */}
      <nav
        aria-label="Passport sections"
        className="sticky top-0 z-30 hidden border-b border-[var(--border-strong)] bg-[var(--surface)]/95 backdrop-blur md:block"
      >
        <div
          role="tablist"
          aria-label="Passport sections"
          className="mx-auto flex max-w-[1040px] items-center gap-2 px-6"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-desktop-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onChange(tab.id)}
                className={`pressable relative inline-flex min-h-[48px] items-center gap-2 border-b-2 px-4 py-2.5 text-[14.5px] font-bold whitespace-nowrap cursor-pointer ${
                  selected
                    ? "border-[var(--accent)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile fixed bottom navigation bar */}
      <nav
        aria-label="Passport sections mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1E2C3A] bg-[#0B1016]/95 text-[#F1F5F9] backdrop-blur md:hidden"
        style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      >
        <div
          role="tablist"
          aria-label="Passport sections"
          className="grid grid-cols-4 gap-1.5 px-2 pt-1.5"
        >
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
                className={`pressable flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[10px] px-1 py-1.5 text-[11.5px] font-bold leading-none cursor-pointer ${
                  selected
                    ? "bg-[#34D399] text-[#052E16]"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    selected ? "text-[#052E16]" : "text-[#94A3B8]"
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
