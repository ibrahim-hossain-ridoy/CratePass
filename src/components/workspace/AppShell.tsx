"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface AppShellProps {
  orgName: string;
  userEmail?: string;
  billingLabel?: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/app", label: "Passports" },
  { href: "/app/new", label: "New passport" },
  { href: "/app/billing", label: "Plan & billing" },
  { href: "/app/privacy", label: "Privacy & GDPR" },
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

  return (
    <div className="min-h-svh bg-[#141210] text-[var(--ink)] md:flex">
      {/* Desktop Deep Espresso Rail (framed-sheet) */}
      <aside className="hidden w-[240px] shrink-0 flex-col justify-between p-4 text-[#F7F5F0] md:flex">
        <div>
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-[14.5px] font-bold tracking-tight text-white">
                {siteConfig.siteName}
              </span>
              <span className="block truncate font-mono text-[11.5px] text-[#A69E94]">
                {orgName}
              </span>
            </div>
          </Link>

          <nav aria-label="Workspace navigation" className="mt-7 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app" || pathname.startsWith("/app/passports")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pressable flex min-h-[42px] items-center rounded-r-[8px] border-l-2 px-3 py-2 text-[14px] ${
                    active
                      ? "border-[#F97316] bg-[#241E19] font-bold text-white"
                      : "border-transparent font-medium text-[#A69E94] hover:bg-[#1D1915] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/demo"
              className="pressable flex min-h-[42px] items-center rounded-r-[8px] border-l-2 border-transparent px-3 py-2 text-[13.5px] font-medium text-[#A69E94] hover:bg-[#1D1915] hover:text-white"
            >
              Sample passport (/demo)
            </Link>
          </nav>
        </div>

        <div className="space-y-2 border-t border-[#2E2924] pt-3.5 text-[12.5px]">
          {billingLabel && (
            <p className="px-2 font-mono text-[11.5px] font-semibold text-[#FB923C]">
              {billingLabel}
            </p>
          )}
          {userEmail && (
            <p className="truncate px-2 font-mono text-[11.5px] text-[#A69E94]">
              {userEmail}
            </p>
          )}
          {userEmail && (
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="pressable flex min-h-[38px] w-full items-center rounded-[6px] px-2 text-left text-[13px] font-medium text-[#A69E94] hover:bg-[#241E19] hover:text-white cursor-pointer"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile compact 52px chrome top bar */}
      <header className="border-b border-[#2E2924] bg-[#141210] text-white md:hidden">
        <div className="flex h-13 items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle workspace menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="pressable inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#332E28] bg-[#1E1B17] text-[15px] font-bold text-white cursor-pointer"
            >
              {mobileMenuOpen ? "×" : "≡"}
            </button>
            <div className="min-w-0">
              <span className="block truncate text-[14px] font-bold text-white">
                {orgName}
              </span>
            </div>
          </div>

          <Link
            href="/app/new"
            className="pressable chamfer-sm inline-flex min-h-[38px] shrink-0 items-center bg-[#F97316] px-3.5 text-[13px] font-bold text-[#1A0902]"
          >
            New passport
          </Link>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Mobile workspace links"
            className="tab-panel-enter space-y-1 border-t border-[#2E2924] bg-[#1A1714] px-3 py-2.5 text-[14px]"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[42px] items-center rounded-[6px] px-2.5 font-semibold text-white hover:bg-[#26211C]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[42px] items-center rounded-[6px] px-2.5 text-[#A69E94] hover:bg-[#26211C] hover:text-white"
            >
              Concept demo (/demo)
            </Link>
            {userEmail && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[42px] w-full items-center rounded-[6px] px-2.5 text-left text-[#A69E94] hover:bg-[#26211C] hover:text-white cursor-pointer"
              >
                Sign out ({userEmail})
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Main Warm Stone / Crisp White Framed Workspace Sheet */}
      <div className="min-w-0 flex-1 md:p-2.5 md:pl-0">
        <main className="min-h-[calc(100svh-3.25rem)] bg-[var(--surface)] px-4 py-6 text-[var(--ink)] shadow-[0_12px_36px_rgba(0,0,0,0.32)] sm:px-6 md:min-h-[calc(100svh-1.25rem)] md:rounded-[16px] md:border md:border-[#332E28] md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
