import Link from "next/link";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { BrandMark } from "@/components/Icons";

export function PublicFooter() {
  return (
    <footer
      data-chapter-theme="obsidian"
      className="mt-auto bg-[#0d0f12] py-14 text-[14px] text-[#c4c8d0] lg:py-16"
    >
      <div className="page-shell space-y-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 lg:gap-12">
          {/* Column 1: Brand & Operator */}
          <div className="space-y-3 md:col-span-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-white"
            >
              <BrandMark className="h-7 w-7 shrink-0" />
              <span className="font-display text-[17px] font-semibold tracking-tight text-white">
                {siteConfig.siteName}
              </span>
            </Link>
            <p className="max-w-[48ch] text-[14.5px] leading-relaxed text-[#c4c8d0]">
              {siteConfig.tagline} Technical hosting and completeness-check
              infrastructure for Regulation (EU) 2023/1542 Annex XIII passports.
              Zero vendor lock-in; open JSON export.
            </p>
            <p className="text-[13.5px] text-[#aeb3bc]">
              Operated by {siteConfig.legal.operatorName} ·{" "}
              {siteConfig.legal.shortLocation}
            </p>
            <p className="pt-0.5 text-[14px]">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="font-semibold text-[#7ce3f4] transition-colors hover:text-white hover:underline"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3 md:col-span-3">
            <p className="font-display text-[15px] font-semibold text-white">
              Product
            </p>
            <ul className="space-y-2.5 font-medium text-[#e4e6eb]">
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/checker"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Eligibility Checker
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Live Demo
                </Link>
              </li>
              <li>
                <Link
                  href="/app/new"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Start Free (3 Passports)
                </Link>
              </li>
              <li>
                <Link
                  href="/app"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/app/billing"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Plans &amp; Billing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div className="space-y-3 md:col-span-3">
            <p className="font-display text-[15px] font-semibold text-white">
              Legal &amp; Policies
            </p>
            <ul className="space-y-2.5 font-medium text-[#e4e6eb]">
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Refund &amp; Cancellation Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  Regulatory Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/app/privacy"
                  className="transition-colors hover:text-[#7ce3f4]"
                >
                  GDPR Export &amp; Delete
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Required Legal & Regulation Notices + Copyright */}
        <div className="flex flex-col justify-between gap-4 rounded-[14px] bg-[#14171c] px-5 py-4 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <p className="font-medium text-[#e4e6eb]">
              Not legal advice. We provide technical hosting infrastructure, not
              compliance certification.
            </p>
            <p className="text-[13.5px] text-[#b6bac2]">
              {WORKING_FIELD_LIST_NOTICE} Payments processed by Paddle as
              Merchant of Record.
            </p>
          </div>
          <p className="shrink-0 text-[13.5px] font-medium text-[#c4c8d0]">
            © 2026 {siteConfig.siteName} · {siteConfig.legal.operatorName}
          </p>
        </div>
      </div>
    </footer>
  );
}
