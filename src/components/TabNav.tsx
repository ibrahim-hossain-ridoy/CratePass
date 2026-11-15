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
      {/* Desktop horizontal tab bar */}
      <nav
        aria-label="Passport sections"
        className="hidden border-b border-[var(--border)] bg-[var(--surface)] md:block"
      >
        <div
          role="tablist"
          aria-label="Passport sections"
          className="mx-auto flex max-w-[960px] items-center gap-1 px-6"
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
                className={`pressable relative inline-flex min-h-[44px] items-center gap-2 border-b-2 px-3.5 py-2.5 text-[14px] font-medium whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                  selected
                    ? "border-[var(--accent)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? "text-[var(--accent-ink)]" : "text-[var(--muted)]"
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] shadow-[0_-4px_16px_rgba(20,20,19,0.06)] md:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      >
        <div
          role="tablist"
          aria-label="Passport sections"
          className="grid grid-cols-4 gap-1 px-1.5 pt-1"
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
                className={`pressable flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11.5px] font-medium leading-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                  selected
                    ? "bg-[var(--well)] text-[var(--ink)]"
                    : "text-[var(--muted)]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    selected ? "text-[var(--accent-ink)]" : "text-[var(--muted)]"
                  }`}
                />
                <span className="truncate max-w-full">{tab.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
