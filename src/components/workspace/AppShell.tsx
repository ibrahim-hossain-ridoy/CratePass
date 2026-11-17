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
    <div className="min-h-svh bg-[#e8e7e3] text-[#0f1114] md:flex">
      {/* Desktop Tinted Frame L-Rail (framed-sheet) */}
      <aside className="hidden w-[240px] shrink-0 flex-col justify-between p-4 text-[#0f1114] md:flex">
        <div>
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <span className="font-display block truncate text-[15px] font-semibold tracking-tight text-[#0f1114]">
                {siteConfig.siteName}
              </span>
              <span className="block truncate text-[13px] text-[#52565e]">
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
                  className={`pressable flex min-h-[42px] items-center rounded-[10px] px-3 py-2 text-[14px] ${
                    active
                      ? "bg-white font-semibold text-[#145b6e]"
                      : "font-medium text-[#26292e] hover:bg-[#dedad1] hover:text-[#0f1114]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/demo"
              className="pressable flex min-h-[42px] items-center rounded-[10px] px-3 py-2 text-[14px] font-medium text-[#52565e] hover:bg-[#dedad1] hover:text-[#0f1114]"
            >
              Sample passport (/demo)
            </Link>
          </nav>
        </div>

        <div className="space-y-2 pt-3.5 text-[13px]">
          {billingLabel && (
            <p className="px-2 text-[13px] font-semibold text-[#145b6e]">
              {billingLabel}
            </p>
          )}
          {userEmail && (
            <p className="truncate px-2 text-[13px] text-[#52565e]">
              {userEmail}
            </p>
          )}
          {userEmail && (
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="pressable flex min-h-[38px] w-full items-center rounded-[8px] px-2 text-left text-[13.5px] font-medium text-[#26292e] hover:bg-[#dedad1] cursor-pointer"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile compact 52px chrome top bar */}
      <header className="bg-[#eae7e0] text-[#0f1114] md:hidden">
        <div className="flex h-13 items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle workspace menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="pressable inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-[16px] font-bold text-[#0f1114] cursor-pointer"
            >
              {mobileMenuOpen ? "×" : "≡"}
            </button>
            <div className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-[#0f1114]">
                {orgName}
              </span>
            </div>
          </div>

          <Link
            href="/app/new"
            className="pressable inline-flex min-h-[38px] shrink-0 items-center rounded-[8px] bg-[#145b6e] px-3.5 text-[13px] font-semibold text-white"
          >
            New passport
          </Link>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Mobile workspace links"
            className="tab-panel-enter space-y-1 bg-[#eae7e0] px-3 py-2.5 text-[14px]"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[42px] items-center rounded-[8px] px-2.5 font-semibold text-[#0f1114] hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[42px] items-center rounded-[8px] px-2.5 text-[#52565e] hover:bg-white hover:text-[#0f1114]"
            >
              Concept demo (/demo)
            </Link>
            {userEmail && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[42px] w-full items-center rounded-[8px] px-2.5 text-left text-[#52565e] hover:bg-white hover:text-[#0f1114] cursor-pointer"
              >
                Sign out ({userEmail})
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Main Crisp White Framed Workspace Sheet */}
      <div className="min-w-0 flex-1 md:p-2 md:pl-0">
        <main className="framed-workspace-sheet min-h-[calc(100svh-3.25rem)] px-4 py-6 text-[#0f1114] sm:px-6 md:min-h-[calc(100svh-1rem)] md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
