"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRightIcon, BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface AppShellProps {
  orgName: string;
  userEmail?: string;
  billingLabel?: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/app", label: "Passports", tag: "Ledger" },
  { href: "/app/settings/branding", label: "Branding & Service", tag: "Pro" },
  { href: "/app/billing", label: "Plan & billing", tag: "Plans" },
  { href: "/app/privacy", label: "Privacy & GDPR", tag: "JSON" },
] as const;

export function AppShell({
  orgName,
  userEmail,
  billingLabel,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  }

  const currentSectionLabel =
    pathname === "/app"
      ? "Passports ledger"
      : pathname.startsWith("/app/new")
        ? "New battery passport"
        : pathname.startsWith("/app/passports")
          ? "Review & publish"
          : pathname.startsWith("/app/settings/branding")
            ? "Branding & Service"
            : pathname.startsWith("/app/billing")
              ? "Plan & billing"
              : pathname.startsWith("/app/privacy")
                ? "Privacy & GDPR"
                : "Workspace";

  const avatarInitial = (userEmail?.trim()?.[0] || orgName?.[0] || "B").toUpperCase();

  return (
    <div className="min-h-svh bg-[#e8e7e3] text-[#0f1114] md:flex">
      {/* Desktop L-Frame Left Rail (framed-sheet architecture) */}
      <aside className="hidden w-[256px] shrink-0 flex-col justify-between p-4 text-[#0f1114] md:flex">
        <div className="space-y-6">
          <Link
            href="/"
            className="pressable flex items-center gap-3 rounded-[12px] px-2.5 py-2 transition-colors hover:bg-[#dedcd6]"
          >
            <BrandMark className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <span className="font-display block truncate text-[15px] font-semibold tracking-tight text-[#0f1114]">
                {siteConfig.siteName}
              </span>
              <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-[#4b4f57]">
                <span
                  aria-hidden="true"
                  className="status-pulse h-2 w-2 shrink-0 rounded-full bg-[#156d49]"
                />
                <span className="truncate">{orgName}</span>
              </span>
            </div>
          </Link>

          <nav aria-label="Workspace navigation" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app" || pathname.startsWith("/app/passports")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pressable relative flex min-h-[44px] items-center justify-between rounded-[11px] px-3.5 py-2 text-[14px] transition-colors ${
                    active
                      ? "bg-white font-semibold text-[#145b6e]"
                      : "font-medium text-[#22252a] hover:bg-[#dedcd6] hover:text-[#0f1114]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {active && (
                      <span
                        aria-hidden="true"
                        className="h-4 w-1 rounded-full bg-[#145b6e]"
                      />
                    )}
                    <span>{item.label}</span>
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${
                      active
                        ? "bg-[#e6f2f5] text-[#0b3c49]"
                        : "text-[#4b4f57]"
                    }`}
                  >
                    {item.tag}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Compact Annex XIII Schema Reference Card (No redundant battery photo in sidebar) */}
          <div className="rounded-[14px] bg-[#101214] p-3.5 text-[#f4f3ef]">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-[#173038] px-2 py-0.5 text-[11px] font-semibold text-[#7dd3e8]">
                Annex XIII
              </span>
              <span className="num text-[12px] font-semibold text-[#34d399]">
                71 points
              </span>
            </div>
            <p className="font-display mt-2.5 text-[14px] font-semibold text-white">
              Reference DB-36V Specimen
            </p>
            <p className="mt-0.5 text-[12.5px] text-[#c4c8d0]">
              50 static · 21 dynamic BMS · 3 tiers
            </p>
            <Link
              href="/demo"
              className="pressable mt-3 inline-flex w-full items-center justify-between rounded-[8px] bg-[#1d2229] px-3 py-2 text-[13px] font-semibold text-[#3eb8cf] transition-colors hover:bg-[#282e37]"
            >
              <span>Inspect live /demo</span>
              <ArrowRightIcon className="btn-arrow h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="space-y-3 pt-4 text-[13px]">
          {billingLabel && (
            <div className="rounded-[10px] bg-[#dedcd6] px-3 py-2 font-semibold text-[#0b3c49]">
              {billingLabel}
            </div>
          )}

          {userEmail && (
            <div className="flex items-center gap-2.5 px-2">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#145b6e] text-[12px] font-bold text-white"
              >
                {avatarInitial}
              </span>
              <span className="truncate text-[13px] font-medium text-[#22252a]">
                {userEmail}
              </span>
            </div>
          )}

          {userEmail && (
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="pressable flex min-h-[38px] w-full cursor-pointer items-center rounded-[9px] px-3 text-left text-[13.5px] font-medium text-[#4b4f57] transition-colors hover:bg-[#dedcd6] hover:text-[#0f1114]"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Compact Top Bar */}
      <header className="bg-[#e8e7e3] text-[#0f1114] md:hidden">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle workspace menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="pressable inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-white text-[16px] font-bold text-[#0f1114]"
            >
              {mobileMenuOpen ? "×" : "≡"}
            </button>
            <div className="min-w-0">
              <span className="font-display block truncate text-[14.5px] font-semibold text-[#0f1114]">
                {orgName}
              </span>
            </div>
          </div>

          <span className="text-[12.5px] font-medium text-[#4b4f57]">
            {currentSectionLabel}
          </span>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Mobile workspace links"
            className="tab-panel-enter space-y-1 bg-[#e8e7e3] px-4 pb-3 pt-1 text-[14px]"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[42px] items-center justify-between rounded-[9px] px-3 font-semibold text-[#0f1114] hover:bg-white"
              >
                <span>{item.label}</span>
                <span className="text-[12px] text-[#4b4f57]">{item.tag}</span>
              </Link>
            ))}
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[42px] items-center rounded-[9px] px-3 text-[#4b4f57] hover:bg-white hover:text-[#0f1114]"
            >
              Concept demo (/demo)
            </Link>
            {userEmail && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[42px] w-full cursor-pointer items-center rounded-[9px] px-3 text-left text-[#4b4f57] hover:bg-white hover:text-[#0f1114]"
              >
                Sign out ({userEmail})
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Main Framed Workspace Column (48px Top Bar + Crisp White Inset Sheet) */}
      <div className="flex min-w-0 flex-1 flex-col md:p-2.5 md:pl-0">
        {/* Desktop 46px Top Breadcrumb Bar on the Tinted Frame */}
        <div className="hidden h-[46px] items-center justify-between px-4 text-[13.5px] md:flex">
          <div className="flex items-center gap-2 text-[#4b4f57]">
            <span className="font-medium text-[#0f1114]">{currentSectionLabel}</span>
          </div>

          <Link
            href="/demo"
            className="text-[13px] font-medium text-[#4b4f57] transition-colors hover:text-[#145b6e]"
          >
            Live demo ↗
          </Link>
        </div>

        {/* Crisp White Framed Workspace Sheet */}
        <main className="framed-workspace-sheet min-h-[calc(100svh-3.5rem)] flex-1 px-4 py-6 text-[#0f1114] sm:px-7 md:min-h-[calc(100svh-4.25rem)] md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
