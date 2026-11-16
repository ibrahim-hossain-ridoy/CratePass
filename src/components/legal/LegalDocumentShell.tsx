import React from "react";
import Link from "next/link";
import { BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";

interface LegalDocumentShellProps {
  activePath: "/terms" | "/privacy" | "/disclaimer";
  title: string;
  subtitle: string;
  lastUpdatedLabel: string;
  children: React.ReactNode;
}

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy & GDPR" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

export function LegalDocumentShell({
  activePath,
  title,
  subtitle,
  lastUpdatedLabel,
  children,
}: LegalDocumentShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      <header className="border-b border-[#1E2C3A] bg-[#0B1016] text-white">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-h-[44px] items-center gap-2.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div>
              <span className="block text-[15px] font-bold tracking-tight text-white">
                {siteConfig.siteName}
              </span>
              <span className="block font-mono text-[11.5px] text-[#94A3B8]">
                DRAFT LEGAL DOCUMENTATION
              </span>
            </div>
          </Link>

          <nav aria-label="Legal documents" className="flex flex-wrap items-center gap-2">
            {LEGAL_LINKS.map((item) => {
              const active = item.href === activePath;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-[38px] items-center rounded-[8px] px-3 text-[13.5px] font-semibold transition-colors ${
                    active
                      ? "bg-[#34D399] text-[#052E16]"
                      : "text-[#CBD5E1] hover:bg-[#131D28] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/app"
              className="inline-flex min-h-[38px] items-center rounded-[8px] border border-[#233242] bg-[#131D28] px-3 text-[13.5px] font-semibold text-white hover:border-[#34D399]"
            >
              Workspace
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Draft legal review warning banner */}
        <div
          role="note"
          className="mb-6 rounded-[10px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-4 text-[14px] leading-relaxed text-[var(--notice-ink)]"
        >
          <p className="font-semibold">
            TODO: lawyer review — Draft template only
          </p>
          <p className="mt-1">
            This document is an internal placeholder draft prepared for pilot testing.
            Replace placeholder operator contact details and complete review with
            qualified EU legal counsel before commercial launch.
          </p>
        </div>

        <article className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <header className="border-b border-[var(--rule)] pb-5">
            <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink)] sm:text-[32px]">
              {title}
            </h1>
            <p className="mt-2 max-w-[66ch] text-[15px] leading-relaxed text-[var(--muted)]">
              {subtitle}
            </p>
            <p className="mt-2 text-[13px] font-medium text-[var(--muted)]">
              {lastUpdatedLabel}
            </p>
          </header>

          <div className="mt-6 max-w-[70ch] space-y-6 text-[15px] leading-[1.68] text-[var(--ink)]">
            {children}
          </div>
        </article>
      </main>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[960px] flex-col gap-3 px-4 py-5 text-[14px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-medium text-[var(--ink)]">
            Not legal advice. We provide technical hosting infrastructure, not
            compliance certification.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="hover:text-[var(--ink)] hover:underline">
              Home
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink)] hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--ink)] hover:underline">
              Privacy
            </Link>
            <Link href="/disclaimer" className="hover:text-[var(--ink)] hover:underline">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
