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
    <div className="min-h-svh bg-[var(--ground)] text-[var(--ink)] md:flex">
      {/* Desktop tinted rail (framed-sheet) */}
      <aside className="hidden w-[228px] shrink-0 flex-col justify-between p-4 md:flex">
        <div>
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1.5">
            <BrandMark className="h-7 w-7 shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-[14px] font-semibold tracking-tight text-[var(--ink)]">
                {siteConfig.siteName}
              </span>
              <span className="block truncate text-[12px] text-[var(--muted)]">
                {orgName}
              </span>
            </div>
          </Link>

          <nav aria-label="Workspace navigation" className="mt-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app" || pathname.startsWith("/app/passports")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-[40px] items-center border-l-2 px-3 py-2 text-[14px] transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-[var(--well)] font-semibold text-[var(--ink)]"
                      : "border-transparent font-medium text-[var(--muted)] hover:bg-[var(--well-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/demo"
              className="flex min-h-[40px] items-center border-l-2 border-transparent px-3 py-2 text-[13.5px] font-medium text-[var(--muted)] hover:bg-[var(--well-soft)] hover:text-[var(--ink)]"
            >
              Sample passport (/demo)
            </Link>
          </nav>
        </div>

        <div className="space-y-2 border-t border-[var(--border)] pt-3 text-[12.5px]">
          {billingLabel && (
            <p className="px-2 font-medium text-[var(--muted)]">{billingLabel}</p>
          )}
          {userEmail && (
            <p className="truncate px-2 font-mono text-[11.5px] text-[var(--muted)]">
              {userEmail}
            </p>
          )}
          {userEmail && (
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex min-h-[38px] w-full items-center rounded-[6px] px-2 text-left text-[13px] font-medium text-[var(--muted)] hover:bg-[var(--well)] hover:text-[var(--ink)] cursor-pointer"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile compact 48px chrome top bar */}
      <header className="border-b border-[var(--border)] bg-[var(--ground)] md:hidden">
        <div className="flex h-12 items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle workspace menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] text-[14px] font-semibold cursor-pointer"
            >
              {mobileMenuOpen ? "×" : "≡"}
            </button>
            <div className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-[var(--ink)]">
                {orgName}
              </span>
            </div>
          </div>

          <Link
            href="/app/new"
            className="pressable inline-flex min-h-[36px] shrink-0 items-center rounded-[6px] bg-[var(--accent-ink)] px-3 text-[13px] font-semibold text-white"
          >
            New passport
          </Link>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Mobile workspace links"
            className="space-y-1 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[14px]"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[40px] items-center rounded-[6px] px-2.5 font-medium text-[var(--ink)] hover:bg-[var(--well-soft)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[40px] items-center rounded-[6px] px-2.5 text-[var(--muted)] hover:bg-[var(--well-soft)]"
            >
              Concept demo (/demo)
            </Link>
            {userEmail && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[40px] w-full items-center rounded-[6px] px-2.5 text-left text-[var(--muted)] hover:bg-[var(--well-soft)] cursor-pointer"
              >
                Sign out ({userEmail})
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Main white framed sheet */}
      <div className="min-w-0 flex-1 md:p-2 md:pl-0">
        <main className="min-h-[calc(100svh-3rem)] bg-[var(--surface)] px-4 py-5 sm:px-6 md:min-h-[calc(100svh-1rem)] md:rounded-[14px] md:border md:border-[var(--border)] md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
