import Link from "next/link";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { ArrowRightIcon, BrandMark } from "@/components/Icons";
import { AudienceIndexSection } from "@/components/landing/AudienceIndexSection";
import { HeroPassportStage } from "@/components/landing/HeroPassportStage";
import { InkFillSection } from "@/components/landing/InkFillSection";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingSmoothScroll } from "@/components/landing/LandingSmoothScroll";
import { PassportPreview } from "@/components/landing/PassportPreview";
import { PipelineScrollScene } from "@/components/landing/PipelineScrollScene";

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-[#e8e7e3] text-[#0f1114]">
      <LandingSmoothScroll />
      <LandingNav />

      <main>
        {/* Act 1: Full-Width Architectural Poster Masthead + Widescreen Cinema Stage (#e8e7e3) */}
        <section
          data-chapter-theme="putty"
          className="pb-16 pt-6 sm:pt-8 lg:pb-20 lg:pt-8"
        >
          <div className="page-shell">
            {/* Top Editorial Masthead: 2-Line Poster Headline Left + Lead & Actions Right */}
            <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <div className="overflow-hidden">
                  <h1 className="text-display-hero hero-line-inner max-w-[19ch] text-[#0f1114]">
                    EU Battery Passport from your spec PDF
                  </h1>
                </div>
              </div>

              <div className="lg:col-span-5">
                <p className="hero-fade-rise max-w-[46ch] text-[17px] leading-relaxed text-[#22252a]">
                  Turn battery technical datasheets into structured Digital Product
                  Passports built to open fast from a casing QR scan, showing every
                  populated attribute and flagged disclosure gap.
                </p>

                <div className="hero-fade-rise mt-6 flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/demo"
                    className="pressable inline-flex items-center gap-2 rounded-[10px] bg-[#145b6e] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0e4656]"
                  >
                    <span>See live demo</span>
                    <ArrowRightIcon className="btn-arrow h-4 w-4" />
                  </Link>
                  <a
                    href="#contact"
                    className="pressable inline-flex items-center justify-center rounded-[10px] bg-[#dad8d1] px-6 py-3.5 text-[15px] font-semibold text-[#0f1114] transition-colors hover:bg-[#cfccc4]"
                  >
                    Send your spec PDF
                  </a>
                </div>
              </div>
            </div>

            {/* Full-Width Widescreen Hero Stage (Zero Card Folder) */}
            <div className="mt-8 lg:mt-9">
              <HeroPassportStage
                title="Completeness check"
                badgeLabel="Sample output – illustrative"
              />
            </div>
          </div>
        </section>

        {/* Act 2 (Scene 1): Held Sticky Obsidian Scroll Scene (#101214) */}
        <PipelineScrollScene />

        {/* Act 3 (Quiet Editorial Section): Asymmetric Chalk Audience Index (#ffffff) */}
        <AudienceIndexSection />

        {/* Act 3.5: Ink-Fill Statement + Rolling Figures + Scene 2 Opening Window (#101214) */}
        <InkFillSection />

        {/* Act 4: Live Interactive Specimen Stage (#e8e7e3 studio putty) */}
        <section
          id="preview"
          data-chapter-theme="putty"
          className="bg-[#e8e7e3] py-20 text-[#0f1114] lg:py-28"
        >
          <div className="page-shell">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-display-section max-w-[20ch] text-[#0f1114]">
                  Passport interface preview
                </h2>
                <p className="mt-3 max-w-[54ch] text-[17px] leading-relaxed text-[#22252a]">
                  Four interactive views matching the hosted mobile route, with{" "}
                  {WORKING_FIELD_LIST_NOTICE.toLowerCase()}
                </p>
              </div>
              <Link
                href="/demo"
                className="pressable inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[15px] font-semibold text-[#145b6e] transition-colors hover:text-[#0e4656]"
              >
                <span>Launch full demo view</span>
                <ArrowRightIcon className="btn-arrow h-4 w-4" />
              </Link>
            </div>

            <PassportPreview />
          </div>
        </section>

        {/* Act 5: Deep Baltic Petrol Closing Invitation (#0c262e) */}
        <section
          id="contact"
          data-chapter-theme="petrol"
          className="bg-[#0c262e] py-24 text-[#f4f7f8] lg:py-32"
        >
          <div className="page-shell grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h2 className="text-display-hero max-w-[16ch] text-white">
                Send your battery spec PDF
              </h2>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[#e6f0f3]">
                Free pilot for the first few brands. Share an example e-bike or
                light-EV battery specification sheet. We run a structured
                missing-field completeness check and return a hosted preview alongside
                QR routing links.
              </p>
            </div>

            <div className="flex flex-col items-start gap-5 lg:col-span-4 lg:items-end">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/app/new"
                  className="pressable inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#0c262e] transition-colors hover:bg-[#e6f2f5]"
                >
                  <span>Start free pilot</span>
                  <ArrowRightIcon className="btn-arrow h-4 w-4" />
                </Link>
                <Link
                  href="/app"
                  className="pressable inline-flex items-center justify-center whitespace-nowrap rounded-[10px] bg-[#16404d] px-5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1c4f5f]"
                >
                  Open workspace
                </Link>
              </div>
              <p className="text-[15px] text-[#d9e7ea]">
                Direct email:{" "}
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="font-semibold text-[#7ce3f4] underline"
                >
                  {siteConfig.contactEmail}
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Act 6: Multi-Column B2B SaaS Architectural Footer (#0d0f12) */}
      <footer
        data-chapter-theme="obsidian"
        className="bg-[#0d0f12] py-14 text-[14px] text-[#c4c8d0] lg:py-16"
      >
        <div className="page-shell space-y-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 lg:gap-12">
            {/* Column 1: Brand */}
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
                Technical hosting infrastructure for EU Battery Regulation (EU)
                2023/1542 Annex XIII passports. Zero vendor lock-in; open JSON
                export.
              </p>
              <p className="pt-1 text-[14px]">
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
                    Start Free Pilot
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

            {/* Column 3: Legal & Data Control */}
            <div className="space-y-3 md:col-span-3">
              <p className="font-display text-[15px] font-semibold text-white">
                Legal &amp; Data Control
              </p>
              <ul className="space-y-2.5 font-medium text-[#e4e6eb]">
                <li>
                  <Link
                    href="/terms"
                    className="transition-colors hover:text-[#7ce3f4]"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="transition-colors hover:text-[#7ce3f4]"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/disclaimer"
                    className="transition-colors hover:text-[#7ce3f4]"
                  >
                    Disclaimer
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
                {WORKING_FIELD_LIST_NOTICE}
              </p>
            </div>
            <p className="shrink-0 text-[13.5px] font-medium text-[#c4c8d0]">
              © 2026 {siteConfig.siteName}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
