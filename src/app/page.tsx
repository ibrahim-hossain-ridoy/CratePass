import Link from "next/link";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { BrandMark } from "@/components/Icons";
import {
  CornerBrackets,
  HeroPassportStage,
} from "@/components/landing/HeroPassportStage";
import { PassportPreview } from "@/components/landing/PassportPreview";

const STEPS = [
  {
    number: "1",
    code: "INGEST SPEC",
    title: "Upload spec",
    detail:
      "Send your existing OEM battery datasheet or technical spec PDF without reformatting into custom spreadsheets.",
    badge: "PDF magic-byte + 10 MB check",
  },
  {
    number: "2",
    code: "COMPLETENESS CHECK",
    title: "Check missing fields",
    detail:
      "Run an automated completeness check that flags empty, ambiguous, or inconsistent product and safety attributes.",
    badge: "Found · Missing · Uncertain",
  },
  {
    number: "3",
    code: "HOST & QR",
    title: "Get passport + QR",
    detail:
      "Publish a fast, mobile-first hosted Digital Product Passport paired with a print-ready QR destination link.",
    badge: "Immutable v1/v2 + SVG/PNG QR",
  },
] as const;

const WHO_ITS_FOR = [
  {
    role: "EU E-Bike & LMT Brands",
    title: "Turn supplier PDFs into scannable battery passports",
    description:
      "See which working attributes your pack supplier populated and which are still missing before printing casing QR labels.",
    bullets: [
      "Hosted mobile pages at /p/[slug] with fast first paint",
      "Public rider view vs restricted authority/repairer tier",
      "Downloadable vector SVG and PNG QR codes",
    ],
  },
  {
    role: "Battery Pack Assemblers",
    title: "Deliver structured passport packages with every batch",
    description:
      "Standardize technical handoffs across 36 V and 48 V battery lines with versioned snapshots when cell lots change.",
    bullets: [
      "31 editable fields across Identity, Integrity, Care, and Impact",
      "Immutable version history (v1, v2) anchored to declarations",
      "Portable organization JSON export anytime",
    ],
  },
  {
    role: "Importers & EU Representatives",
    title: "Maintain one technical ledger across product lines",
    description:
      "Keep source datasheets, completeness checks, and manufacturer responsibility declarations organized per organization.",
    bullets: [
      "Clear user-safe fuse/latch care vs workshop-only cell warnings",
      "Explicit WEEE & EU battery take-back instructions",
      "Append-only audit trail for every published snapshot",
    ],
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      {/* Sticky Dark Obsidian Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#1E2C3A] bg-[#0B1016]/95 text-[#F1F5F9] backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-2 px-3.5 py-3 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-0 items-center gap-2 focus-visible:outline-2 focus-visible:outline-[#2FD99B] sm:gap-2.5"
          >
            <BrandMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
            <div className="min-w-0 leading-tight">
              <span className="block whitespace-nowrap text-[13.5px] font-bold tracking-tight text-white sm:text-[16px]">
                {siteConfig.siteName}
              </span>
              <span className="hidden font-mono text-[11.5px] text-[#94A3B8] sm:block">
                EU DPP TECHNICAL HOSTING
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary sections"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] font-medium sm:gap-5 sm:text-[14px]"
          >
            <a
              href="#how-it-works"
              className="hidden text-[#94A3B8] transition-colors hover:text-white md:inline-block"
            >
              How it works
            </a>
            <a
              href="#who-its-for"
              className="hidden text-[#94A3B8] transition-colors hover:text-white md:inline-block"
            >
              Who it&rsquo;s for
            </a>
            <a
              href="#preview"
              className="hidden text-[#94A3B8] transition-colors hover:text-white md:inline-block"
            >
              Preview
            </a>
            <a
              href="#contact"
              className="hidden text-[#94A3B8] transition-colors hover:text-white md:inline-block"
            >
              Contact
            </a>
            <Link
              href="/app"
              className="inline-flex min-h-[44px] items-center px-1.5 text-[13px] font-medium text-[#CBD5E1] transition-colors hover:text-white sm:px-2 sm:text-[14px]"
            >
              Sign in
            </Link>
            <Link
              href="/demo"
              className="pressable chamfer-sm inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap bg-[#2FD99B] px-2.5 text-[13px] font-bold text-[#052E16] hover:bg-[#6EE7B7] sm:px-4 sm:text-[14px]"
            >
              <span className="sm:hidden">Live demo</span>
              <span className="hidden sm:inline">See live demo</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Stage: Obsidian Dark Telemetry & Interactive Phone + QR */}
      <section
        aria-labelledby="hero-heading"
        className="border-b border-[var(--border-strong)] bg-[#0B1016] text-[#F1F5F9]"
      >
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-12 lg:items-center">
          <div className="hero-enter lg:col-span-5">
            <h1
              id="hero-heading"
              className="max-w-[16ch] text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[50px]"
            >
              EU Battery Passport from your spec PDF
            </h1>

            <p className="mt-4 max-w-[50ch] text-[16.5px] leading-[1.6] text-[#94A3B8]">
              Turn battery technical datasheets into structured Digital Product
              Passports built to open fast from a casing QR scan — with a clear
              completeness check showing which fields are populated and which need
              attention.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/demo"
                className="pressable chamfer-sm inline-flex min-h-[48px] items-center justify-center bg-[#34D399] px-6 py-2.5 text-[15px] font-bold text-[#052E16] hover:bg-[#6EE7B7]"
              >
                See live demo
              </Link>
              <a
                href="#contact"
                className="pressable inline-flex min-h-[48px] items-center justify-center rounded-[8px] border border-[#2A3C4F] bg-[#131D28] px-6 py-2.5 text-[15px] font-semibold text-white hover:border-[#34D399]"
              >
                Send your spec PDF
              </a>
            </div>

            {/* Key Architecture Counters */}
            <dl className="relative mt-9 grid grid-cols-3 gap-2.5 border border-[#1E2C3A] bg-[#0F1720] p-3.5 font-mono text-[11.5px] sm:gap-3 sm:p-4 sm:text-[12px]">
              <CornerBrackets colorClass="border-[#2FD99B]" />
              <div>
                <dt className="text-[#94A3B8]">SCHEMA</dt>
                <dd className="num mt-0.5 text-[14px] font-bold text-white sm:text-[16px]">
                  31 fields
                </dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">TIERS</dt>
                <dd className="mt-0.5 text-[14px] font-bold text-[#6EE7B7] sm:text-[16px]">
                  Public + Auth
                </dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">ROUTE</dt>
                <dd className="mt-0.5 text-[14px] font-bold text-white sm:text-[16px]">
                  /p/[slug]
                </dd>
              </div>
            </dl>
          </div>

          <div className="hero-enter-delay-1 lg:col-span-7">
            <HeroPassportStage
              title="Completeness check"
              badgeLabel="Sample output – illustrative"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] flex-1 space-y-16 px-4 py-12 sm:px-6 sm:py-16">
        {/* 3 Steps: How It Works */}
        <section id="how-it-works" aria-labelledby="steps-heading">
          <div className="mb-6 flex flex-col justify-between gap-2 border-b border-[var(--border-strong)] pb-4 sm:flex-row sm:items-end">
            <div>
              <h2
                id="steps-heading"
                className="text-[26px] font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-[32px]"
              >
                Three-step intake workflow
              </h2>
              <p className="mt-1 text-[16px] text-[var(--muted)]">
                From engineering datasheet PDF to a live mobile QR passport page.
              </p>
            </div>
            <p className="font-mono text-[12.5px] font-medium text-[var(--accent)]">
              {WORKING_FIELD_LIST_NOTICE}
            </p>
          </div>

          <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="interactive-card relative flex flex-col justify-between rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] p-6"
              >
                <CornerBrackets colorClass="border-[var(--accent)]" />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="chamfer-sm bg-[var(--accent)] px-2.5 py-1 font-mono text-[12px] font-bold text-white">
                      {step.number} · {step.code}
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-mono text-[14px] font-bold text-[var(--accent)]"
                    >
                      +
                    </span>
                  </div>
                  <h3 className="mt-4 text-[20px] font-bold text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                    {step.detail}
                  </p>
                </div>

                <p className="mt-6 border-t border-[var(--rule)] pt-3 font-mono text-[12px] font-medium text-[var(--muted)]">
                  {step.badge}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Who It's For */}
        <section id="who-its-for" aria-labelledby="who-heading">
          <div className="mb-6 border-b border-[var(--border-strong)] pb-4">
            <h2
              id="who-heading"
              className="text-[26px] font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-[32px]"
            >
              Who it&rsquo;s for
            </h2>
            <p className="mt-1 text-[16px] text-[var(--muted)]">
              Built for B2B battery and e-mobility teams preparing structured
              technical product passports.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {WHO_ITS_FOR.map((item) => (
              <div
                key={item.role}
                className="interactive-card chamfer-card flex flex-col justify-between border border-[var(--border-strong)] bg-[var(--surface)] p-6"
              >
                <div>
                  <span className="inline-block rounded bg-[var(--accent-soft)] px-2.5 py-1 text-[13px] font-bold text-[var(--accent)]">
                    {item.role}
                  </span>
                  <h3 className="mt-3 text-[20px] font-bold leading-snug text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </p>

                  <ul className="mt-4 space-y-2 border-t border-[var(--rule)] pt-4 text-[14px] text-[var(--ink)]">
                    {item.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-2 w-2 shrink-0 bg-[var(--positive)]"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3">
                  <Link
                    href="/app/new"
                    className="inline-flex items-center font-mono text-[13px] font-bold text-[var(--accent)] hover:underline"
                  >
                    Try PDF completeness check →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Embedded Demo UI Preview */}
        <section id="preview" aria-labelledby="preview-heading">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2
                id="preview-heading"
                className="text-[26px] font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-[32px]"
              >
                Passport interface preview
              </h2>
              <p className="mt-1 text-[16px] text-[var(--muted)]">
                4-tab fictional concept passport with interactive 2.5D repair
                cutaway and supply route.
              </p>
            </div>
            <Link
              href="/demo"
              className="font-mono text-[14px] font-bold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Launch full /demo view →
            </Link>
          </div>

          <PassportPreview />
        </section>

        {/* Contact / Intake CTA */}
        <section
          id="contact"
          aria-labelledby="contact-heading"
          className="relative overflow-hidden rounded-[14px] border border-[#233242] bg-[#0B1016] p-6 text-[#F1F5F9] sm:p-9"
        >
          <CornerBrackets colorClass="border-[#34D399]" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <h2
                id="contact-heading"
                className="text-[26px] font-bold tracking-[-0.02em] text-white sm:text-[32px]"
              >
                Send your battery spec PDF
              </h2>
              <p className="mt-3 max-w-[54ch] text-[16px] leading-relaxed text-[#94A3B8]">
                <strong className="font-bold text-[#6EE7B7]">
                  Free pilot for the first few brands.
                </strong>{" "}
                Share an example e-bike or light-EV battery spec sheet. We run a
                structured missing-field completeness check and return a hosted
                mobile preview alongside QR routing links.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[12px] border border-[#233242] bg-[#121B24] p-5 md:col-span-5">
              <a
                href={siteConfig.formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable chamfer-sm inline-flex min-h-[46px] w-full items-center justify-center bg-[#34D399] px-4 py-2.5 text-[15px] font-bold text-[#052E16] hover:bg-[#6EE7B7]"
              >
                Open spec intake form
              </a>

              <div className="border-t border-[#1E2C3A] pt-3 text-[14.5px]">
                <p className="text-[#94A3B8]">Or email your spec PDF to</p>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="mt-0.5 inline-flex min-h-[44px] items-center font-mono font-bold text-white underline decoration-[#34D399] underline-offset-4"
                >
                  <code>{siteConfig.contactEmail}</code>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1E2C3A] bg-[#0B1016] text-[#94A3B8]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-6 text-[14.5px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-medium text-white">
            Not legal advice. We provide technical hosting infrastructure, not
            compliance certification.
          </p>
          <div className="flex flex-wrap shrink-0 items-center gap-5">
            <Link
              href="/demo"
              className="font-medium text-[#CBD5E1] underline-offset-4 hover:text-white hover:underline"
            >
              Live demo (/demo)
            </Link>
            <a
              href="#contact"
              className="font-medium text-[#CBD5E1] underline-offset-4 hover:text-white hover:underline"
            >
              Send spec PDF
            </a>
            <Link
              href="/terms"
              className="text-[#94A3B8] underline-offset-4 hover:text-white hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[#94A3B8] underline-offset-4 hover:text-white hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/disclaimer"
              className="text-[#94A3B8] underline-offset-4 hover:text-white hover:underline"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
