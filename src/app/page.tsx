import Link from "next/link";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { ArrowRightIcon } from "@/components/Icons";
import { AudienceIndexSection } from "@/components/landing/AudienceIndexSection";
import { HeroPassportStage } from "@/components/landing/HeroPassportStage";
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
        {/* Act 1: Studio Hardware & Poster-Scale Hero (#e8e7e3 neutral putty) */}
        <section className="pb-16 pt-8 sm:pt-12 lg:pb-24 lg:pt-16">
          <div className="page-shell grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Copy & Actions */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden">
                <h1 className="text-display-hero hero-line-inner max-w-[19ch] text-[#0f1114]">
                  EU Battery Passport from your spec PDF
                </h1>
              </div>

              <p className="hero-fade-rise mt-6 max-w-[46ch] text-[17px] leading-relaxed text-[#22252a]">
                Turn battery technical datasheets into structured Digital Product
                Passports built to open fast from a casing QR scan, showing every
                populated attribute and flagged disclosure gap.
              </p>

              <div className="hero-fade-rise mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/demo"
                  className="pressable inline-flex items-center gap-2 rounded-[10px] bg-[#145b6e] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0e4656]"
                >
                  <span>See live demo</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <a
                  href="#contact"
                  className="pressable inline-flex items-center justify-center rounded-[10px] bg-[#dad8d1] px-6 py-3.5 text-[15px] font-semibold text-[#0f1114] transition-colors hover:bg-[#cfccc4]"
                >
                  Send your spec PDF
                </a>
              </div>

              <p className="hero-fade-rise num mt-9 text-[15px] font-medium text-[#22252a]">
                71 Annex XIII points · 3 access tiers · Hosted QR route (/p/[slug])
              </p>
            </div>

            {/* Right Interactive 3D Hardware & Pipeline Switcher */}
            <div className="lg:col-span-6">
              <HeroPassportStage
                title="Completeness check"
                badgeLabel="Sample output – illustrative"
              />
            </div>
          </div>
        </section>

        {/* Act 2: Held Sticky Obsidian Scroll Scene (#101214) */}
        <PipelineScrollScene />

        {/* Act 3: Asymmetric Chalk Audience Index (#ffffff) */}
        <AudienceIndexSection />

        {/* Act 4: Live Embedded Specimen Stage (#e8e7e3 studio putty) */}
        <section id="preview" className="bg-[#e8e7e3] py-20 text-[#0f1114] lg:py-28">
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
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <PassportPreview />
          </div>
        </section>

        {/* Act 5: Deep Baltic Petrol Closing Invitation (#0c262e) */}
        <section id="contact" className="bg-[#0c262e] py-24 text-[#f4f7f8] lg:py-32">
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
                <a
                  href={siteConfig.formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#0c262e] transition-colors hover:bg-[#e6f2f5]"
                >
                  <span>Open spec intake form</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
                <Link
                  href="/app/new"
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

      {/* Act 6: Single Calm Architectural Footer (#0d0f12) */}
      <footer className="bg-[#0d0f12] py-10 text-[14px] text-[#c4c8d0]">
        <div className="page-shell flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-1.5">
            <p className="font-medium text-[#e4e6eb]">
              Not legal advice. We provide technical hosting infrastructure, not
              compliance certification.
            </p>
            <p className="text-[14px] text-[#b6bac2]">{WORKING_FIELD_LIST_NOTICE}</p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-6 font-medium text-[#f4f3ef]"
          >
            <Link href="/demo" className="transition-colors hover:text-[#7ce3f4]">
              Live demo
            </Link>
            <Link href="/login" className="transition-colors hover:text-[#7ce3f4]">
              Workspace
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#7ce3f4]">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[#7ce3f4]">
              Privacy
            </Link>
            <Link href="/disclaimer" className="transition-colors hover:text-[#7ce3f4]">
              Disclaimer
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
