import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/Icons";
import { PublicFooter } from "@/components/PublicFooter";
import { PricingSection } from "@/components/landing/PricingSection";
import {
  PLAN_COMPARISON_ROWS,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
} from "@/config/plans";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Pricing · ${siteConfig.siteName}`,
  description: `Transparent self-serve pricing for ${siteConfig.siteName}: Free Plan (3 live battery passports, 25 serialized units) and Pro (€${PRO_MONTHLY_EUR}/month or €${PRO_YEARLY_EUR}/year) processed by Paddle with a 14-day refund policy.`,
};

export default function PricingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[#e8e7e3] text-[#0f1114]">
      <header className="bg-[#101214] text-white">
        <div className="page-shell flex h-[72px] items-center justify-between gap-4">
          <Link
            href="/"
            className="pressable inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-white"
          >
            <BrandMark className="h-8 w-8 shrink-0" />
            <span className="font-display text-[16px] font-semibold tracking-tight text-white">
              {siteConfig.brandName}
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 text-[15px] font-medium text-[#c4c8d0] md:flex"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/pricing" className="font-semibold text-white">
              Pricing
            </Link>
            <Link href="/checker" className="transition-colors hover:text-white">
              Eligibility checker
            </Link>
            <Link href="/demo" className="transition-colors hover:text-white">
              Live demo
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="/login"
              className="pressable inline-flex items-center justify-center rounded-[10px] bg-[#1d2229] px-4 py-2 text-[14px] font-semibold text-[#f4f3ef] transition-colors hover:bg-[#282e37]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="pressable inline-flex items-center justify-center rounded-[10px] bg-[#3eb8cf] px-4 py-2 text-[14px] font-semibold text-[#08181d] transition-colors hover:bg-[#5ec8dc]"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Pricing Section (Free vs Pro + Billing Toggle) */}
        <PricingSection />

        {/* Full Capability Comparison Table */}
        <section className="bg-[#f3f1ed] py-16 text-[#0f1114] lg:py-20">
          <div className="page-shell space-y-8">
            <div className="rounded-[20px] bg-white p-6 sm:p-8">
              <h2 className="font-display text-[22px] font-semibold text-[#0f1114]">
                Compare Free vs. Pro capabilities
              </h2>
              <p className="mt-1.5 text-[14.5px] text-[#505660]">
                All prices in EUR. Applicable EU VAT or sales tax is calculated
                and collected at checkout by Paddle as Merchant of Record.
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-[#dcdad4] text-[13px] font-semibold text-[#4b4f57]">
                      <th className="py-3 pr-4">Capability</th>
                      <th className="py-3 pr-4">Free (€0/mo)</th>
                      <th className="py-3 text-[#0b3c49]">
                        Pro (€{PRO_MONTHLY_EUR}/mo · €{PRO_YEARLY_EUR}/yr)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e4de]">
                    {PLAN_COMPARISON_ROWS.map((row) => (
                      <tr key={row.feature}>
                        <td className="py-3.5 pr-4 font-medium text-[#0f1114]">
                          {row.feature}
                        </td>
                        <td className="py-3.5 pr-4 text-[#505660]">
                          {row.free}
                        </td>
                        <td className="py-3.5 font-semibold text-[#145b6e]">
                          {row.pro}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing Transparency & Buyer Protection Summary */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-[16px] bg-white p-5">
                <h3 className="font-display text-[16px] font-semibold text-[#0f1114]">
                  Paddle Merchant of Record
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#505660]">
                  Paid subscriptions are billed and invoiced securely by Paddle,
                  handling EU VAT and local tax invoices automatically.
                </p>
              </div>
              <div className="rounded-[16px] bg-white p-5">
                <h3 className="font-display text-[16px] font-semibold text-[#0f1114]">
                  Cancel Anytime · 14-Day Refunds
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#505660]">
                  Cancel anytime from your workspace billing settings. Initial
                  Pro purchases and duplicate charges carry a 14-day refund
                  policy. See our{" "}
                  <Link
                    href="/refund"
                    className="font-semibold text-[#145b6e] underline underline-offset-4"
                  >
                    Refund Policy
                  </Link>
                  .
                </p>
              </div>
              <div className="rounded-[16px] bg-white p-5">
                <h3 className="font-display text-[16px] font-semibold text-[#0f1114]">
                  Open Data &amp; Zero Lock-In
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#505660]">
                  Export all passports as open JSON or CSV anytime. We commit to
                  30 days&rsquo; notice for pricing changes and 90 days&rsquo;
                  notice before any service sunset.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
