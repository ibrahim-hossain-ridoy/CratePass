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
    <div className="min-h-svh bg-[#0B1016] text-[var(--ink)] md:flex">
      {/* Desktop Obsidian Rail (framed-sheet) */}
      <aside className="hidden w-[236px] shrink-0 flex-col justify-between p-4 text-[#F1F5F9] md:flex">
        <div>
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-[14.5px] font-bold tracking-tight text-white">
                {siteConfig.siteName}
              </span>
              <span className="block truncate font-mono text-[11.5px] text-[#94A3B8]">
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
                  className={`flex min-h-[42px] items-center border-l-2 px-3 py-2 text-[14px] transition-colors ${
                    active
                      ? "border-[#34D399] bg-[#131D28] font-bold text-white"
                      : "border-transparent font-medium text-[#94A3B8] hover:bg-[#111923] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/demo"
              className="flex min-h-[42px] items-center border-l-2 border-transparent px-3 py-2 text-[13.5px] font-medium text-[#94A3B8] hover:bg-[#111923] hover:text-white"
            >
              Sample passport (/demo)
            </Link>
          </nav>
        </div>

        <div className="space-y-2 border-t border-[#1E2C3A] pt-3.5 text-[12.5px]">
          {billingLabel && (
            <p className="px-2 font-mono text-[11.5px] font-semibold text-[#6EE7B7]">
              {billingLabel}
            </p>
          )}
          {userEmail && (
            <p className="truncate px-2 font-mono text-[11.5px] text-[#94A3B8]">
              {userEmail}
            </p>
          )}
          {userEmail && (
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex min-h-[38px] w-full items-center rounded-[6px] px-2 text-left text-[13px] font-medium text-[#94A3B8] hover:bg-[#131D28] hover:text-white cursor-pointer"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile compact 52px chrome top bar */}
      <header className="border-b border-[#1E2C3A] bg-[#0B1016] text-white md:hidden">
        <div className="flex h-13 items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle workspace menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#233242] bg-[#131D28] text-[15px] font-bold text-white cursor-pointer"
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
            className="pressable chamfer-sm inline-flex min-h-[38px] shrink-0 items-center bg-[#34D399] px-3.5 text-[13px] font-bold text-[#052E16]"
          >
            New passport
          </Link>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Mobile workspace links"
            className="space-y-1 border-t border-[#1E2C3A] bg-[#111923] px-3 py-2.5 text-[14px]"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[42px] items-center rounded-[6px] px-2.5 font-semibold text-white hover:bg-[#1A2634]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[42px] items-center rounded-[6px] px-2.5 text-[#94A3B8] hover:bg-[#1A2634] hover:text-white"
            >
              Concept demo (/demo)
            </Link>
            {userEmail && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[42px] w-full items-center rounded-[6px] px-2.5 text-left text-[#94A3B8] hover:bg-[#1A2634] hover:text-white cursor-pointer"
              >
                Sign out ({userEmail})
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Main White Framed Workspace Sheet */}
      <div className="min-w-0 flex-1 md:p-2.5 md:pl-0">
        <main className="min-h-[calc(100svh-3.25rem)] bg-[var(--surface)] px-4 py-6 text-[var(--ink)] sm:px-6 md:min-h-[calc(100svh-1.25rem)] md:rounded-[14px] md:border md:border-[#233242] md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
