import React, { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { BrandMark } from "@/components/Icons";
import { PublicFooter } from "@/components/PublicFooter";
import { getConfiguredSiteUrl, siteConfig } from "@/config/site";

interface LegalDocumentShellProps {
  activePath: "/terms" | "/privacy" | "/refund" | "/disclaimer";
  title: string;
  subtitle: string;
  effectiveDate?: string;
  children: React.ReactNode;
}

const LEGAL_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refunds" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

async function LiveSiteOrigin() {
  const hdrs = await headers();
  const forwardedHost = hdrs.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || hdrs.get("host")?.trim();
  const proto =
    hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) ? "http" : "https");

  if (host) {
    return <span className="font-mono text-[#0f1114]">{`${proto}://${host}`}</span>;
  }

  return <span className="font-mono text-[#0f1114]">{getConfiguredSiteUrl()}</span>;
}

export function LegalDocumentShell({
  activePath,
  title,
  subtitle,
  effectiveDate = siteConfig.legal.effectiveDate,
  children,
}: LegalDocumentShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-[#f3f1ed] text-[#0f1114]">
      <header className="bg-[#101214] text-white">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <Link href="/" className="flex min-h-[44px] items-center gap-2.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div>
              <span className="font-display block text-[15.5px] font-semibold tracking-tight text-white">
                {siteConfig.siteName}
              </span>
              <span className="block text-[13px] text-[#c4c8d0]">
                Policies &amp; Legal Information
              </span>
            </div>
          </Link>

          <nav
            aria-label="Legal and pricing navigation"
            className="flex flex-wrap items-center gap-2"
          >
            {LEGAL_LINKS.map((item) => {
              const active = item.href === activePath;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pressable inline-flex min-h-[38px] items-center rounded-[8px] px-3 text-[14px] font-semibold ${
                    active
                      ? "bg-[#145b6e] text-white"
                      : "text-[#e2e5ea] hover:bg-[#1d2229] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/app"
              className="pressable inline-flex min-h-[38px] items-center rounded-[8px] bg-[#1d2229] px-3 text-[14px] font-semibold text-white hover:bg-[#2c3139]"
            >
              Workspace
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <article className="rounded-[18px] bg-white p-6 sm:p-8">
          <header className="border-b border-[#e4e3dd] pb-5">
            <h1 className="text-display-section font-bold text-[#0f1114]">
              {title}
            </h1>
            <p className="mt-2 max-w-[66ch] text-[15px] leading-relaxed text-[#505660]">
              {subtitle}
            </p>

            {/* Operator & Effective Date Summary */}
            <dl className="mt-5 grid grid-cols-1 gap-3 rounded-[12px] bg-[#f4f4f2] p-4 text-[13px] sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-[#505660]">Service &amp; Domain</dt>
                <dd className="mt-0.5 font-medium text-[#0f1114]">
                  {siteConfig.siteName} ·{" "}
                  <Suspense
                    fallback={
                      <span className="font-mono text-[#0f1114]">
                        {getConfiguredSiteUrl()}
                      </span>
                    }
                  >
                    <LiveSiteOrigin />
                  </Suspense>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#505660]">Effective Date</dt>
                <dd className="mt-0.5 font-medium text-[#0f1114]">
                  {effectiveDate}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#505660]">Legal Operator</dt>
                <dd className="mt-0.5 font-medium text-[#0f1114]">
                  {siteConfig.legal.operatorName}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#505660]">
                  Contact &amp; Privacy Email
                </dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${siteConfig.legal.contactEmail}`}
                    className="font-medium text-[#145b6e] underline underline-offset-4 hover:text-[#0e4656]"
                  >
                    {siteConfig.legal.contactEmail}
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-[#505660]">
                  Registered / Correspondence Address
                </dt>
                <dd className="mt-0.5 text-[#0f1114]">
                  {siteConfig.legal.registeredAddress}
                </dd>
              </div>
            </dl>
          </header>

          <div className="mt-6 max-w-[70ch] space-y-6 text-[15px] leading-[1.68] text-[#0f1114]">
            {children}
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
