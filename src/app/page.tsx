import Image from "next/image";
import Link from "next/link";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { BrandMark } from "@/components/Icons";
import { PassportPreview } from "@/components/landing/PassportPreview";

const STEPS = [
  {
    number: "1",
    title: "Upload spec",
    detail:
      "Send your existing OEM battery datasheet or technical spec PDF without reformatting into custom spreadsheets.",
  },
  {
    number: "2",
    title: "Check missing fields",
    detail:
      "Run an automated completeness check that flags empty, ambiguous, or inconsistent product and safety attributes.",
  },
  {
    number: "3",
    title: "Get passport + QR",
    detail:
      "Publish a fast, mobile-first hosted Digital Product Passport paired with a print-ready QR destination link.",
  },
] as const;

const ILLUSTRATIVE_FIELDS = [
  {
    field: "Rated voltage & energy",
    value: "36 V · 522 Wh",
    present: true,
    note: "Matched",
  },
  {
    field: "Cathode chemistry",
    value: "Li-ion NMC 811",
    present: true,
    note: "Matched",
  },
  {
    field: "Lifecycle CO2e breakdown",
    value: "Not found in PDF",
    present: false,
    note: "Missing",
  },
  {
    field: "External fuse & latch SKUs",
    value: "Part codes omitted",
    present: false,
    note: "Missing",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      {/* Top sticky header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <BrandMark className="h-8 w-8 shrink-0" />
            <div className="leading-tight">
              <span className="block text-[16px] font-semibold tracking-tight text-[var(--ink)]">
                {siteConfig.siteName}
              </span>
              <span className="block text-[13px] text-[var(--muted)]">
                Technical DPP hosting
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary sections"
            className="flex shrink-0 items-center gap-5 text-[15px] font-medium"
          >
            <a
              href="#how-it-works"
              className="hidden text-[var(--muted)] transition-colors hover:text-[var(--ink)] md:inline-block"
            >
              How it works
            </a>
            <a
              href="#preview"
              className="hidden text-[var(--muted)] transition-colors hover:text-[var(--ink)] md:inline-block"
            >
              Preview
            </a>
            <a
              href="#contact"
              className="hidden text-[var(--muted)] transition-colors hover:text-[var(--ink)] md:inline-block"
            >
              Contact
            </a>
            <Link
              href="/demo"
              className="pressable inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] border border-[var(--border-strong)] bg-[var(--well-soft)] px-3.5 text-[14px] font-semibold text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--well)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:px-4 sm:text-[15px]"
            >
              See live demo
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1040px] flex-1 space-y-12 px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center"
        >
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[13px] font-medium text-[var(--muted)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]"
              />
              Technical hosting · Completeness check
            </p>

            <h1
              id="hero-heading"
              className="mt-4 max-w-[18ch] text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--ink)] sm:text-[44px]"
            >
              EU Battery Passport from your spec PDF
            </h1>

            <p className="mt-4 max-w-[54ch] text-[16px] leading-relaxed text-[var(--muted)]">
              Turn battery technical datasheets into structured Digital Product
              Passports built to open fast from a casing QR scan — with a clear
              completeness check showing which fields are populated and which need
              attention.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/demo"
                className="pressable inline-flex min-h-[44px] items-center justify-center rounded-[8px] bg-[var(--accent-ink)] px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-[#963103] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                See live demo
              </Link>
              <a
                href="#contact"
                className="pressable inline-flex min-h-[44px] items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-2.5 text-[15px] font-semibold text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--well-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Send your spec PDF
              </a>
            </div>
          </div>

          {/* Illustrative Completeness Check Card */}
          <aside
            aria-label="Sample completeness check output"
            className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] lg:col-span-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--well-soft)] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-14 shrink-0 overflow-hidden rounded border border-[var(--border-strong)] bg-[#F5F4F0]">
                  <Image
                    src="/images/battery-pack-studio.jpg"
                    alt="Studio render of the anodized e-bike battery pack referenced by the sample spec sheet"
                    width={1200}
                    height={896}
                    sizes="56px"
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[var(--ink)]">
                    Completeness check
                  </p>
                  <code className="text-[13px] text-[var(--muted)]">
                    battery-pack-spec.pdf
                  </code>
                </div>
              </div>
              <span className="rounded border border-[var(--notice-border)] bg-[var(--notice-bg)] px-2.5 py-0.5 text-[13px] font-medium text-[var(--notice-ink)]">
                Sample output – illustrative
              </span>
            </div>

            <dl className="divide-y divide-[var(--rule)] px-4 py-1">
              {ILLUSTRATIVE_FIELDS.map((row) => (
                <div
                  key={row.field}
                  className="flex items-center justify-between gap-3 py-2.5 text-[15px]"
                >
                  <div className="min-w-0">
                    <dt className="font-medium text-[var(--ink)]">
                      {row.field}
                    </dt>
                    <dd className="num text-[13px] text-[var(--muted)]">
                      {row.value}
                    </dd>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-[13px] font-medium ${
                      row.present
                        ? "border border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]"
                        : "border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                    }`}
                  >
                    {row.note}
                  </span>
                </div>
              ))}
            </dl>

            <div className="space-y-1 border-t border-[var(--border)] bg-[var(--well-soft)] px-4 py-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Field status summary</span>
                <span className="num font-semibold text-[var(--ink)]">
                  2 populated · 2 flagged
                </span>
              </div>
              <p className="text-[12px] text-[var(--muted)]">
                {WORKING_FIELD_LIST_NOTICE}
              </p>
            </div>
          </aside>
        </section>

        {/* 3 Steps */}
        <section id="how-it-works" aria-labelledby="steps-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="steps-heading"
              className="text-[22px] font-semibold tracking-tight text-[var(--ink)] sm:text-[24px]"
            >
              Three-step intake workflow
            </h2>
            <p className="text-[15px] text-[var(--muted)]">
              Spec sheet to hosted mobile QR page
            </p>
          </div>

          <ol className="grid grid-cols-1 divide-y divide-[var(--border)] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] md:grid-cols-3 md:divide-x md:divide-y-0">
            {STEPS.map((step) => (
              <li key={step.number} className="p-5">
                <div className="flex items-center gap-2.5">
                  <span className="num inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--well)] text-[13px] font-semibold text-[var(--ink)]">
                    {step.number}
                  </span>
                  <h3 className="text-[16px] font-semibold text-[var(--ink)]">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--muted)]">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Embedded Demo UI Preview */}
        <section id="preview" aria-labelledby="preview-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="preview-heading"
              className="text-[22px] font-semibold tracking-tight text-[var(--ink)] sm:text-[24px]"
            >
              Passport interface preview
            </h2>
            <Link
              href="/demo"
              className="text-[15px] font-semibold text-[var(--accent-ink)] underline-offset-4 hover:underline"
            >
              Launch full /demo view
            </Link>
          </div>

          <PassportPreview />
        </section>

        {/* Contact / Intake CTA */}
        <section
          id="contact"
          aria-labelledby="contact-heading"
          className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-7"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <h2
                id="contact-heading"
                className="text-[22px] font-semibold tracking-tight text-[var(--ink)] sm:text-[24px]"
              >
                Send your battery spec PDF
              </h2>
              <p className="mt-2.5 max-w-[52ch] text-[16px] leading-relaxed text-[var(--muted)]">
                <strong className="font-semibold text-[var(--positive)]">
                  Free pilot for the first few brands.
                </strong>{" "}
                Share an example e-bike or light-EV battery spec sheet. We run a
                structured missing-field completeness check and return a hosted
                mobile preview alongside QR routing links.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] p-4 md:col-span-5">
              <a
                href={siteConfig.formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex min-h-[44px] w-full items-center justify-center rounded-[8px] bg-[var(--accent-ink)] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#963103] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Open spec intake form
              </a>

              <div className="border-t border-[var(--border)] pt-3 text-[15px]">
                <p className="text-[var(--muted)]">Or email your spec PDF to</p>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="mt-0.5 inline-block min-h-[44px] py-2 font-medium text-[var(--ink)] underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-[var(--ink)]"
                >
                  <code>{siteConfig.contactEmail}</code>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-3 px-4 py-5 text-[15px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-medium text-[var(--ink)]">
            Not legal advice. We provide technical hosting infrastructure, not
            compliance certification.
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/demo"
              className="font-medium text-[var(--ink)] underline-offset-4 hover:underline"
            >
              Live demo (/demo)
            </Link>
            <a
              href="#contact"
              className="font-medium text-[var(--ink)] underline-offset-4 hover:underline"
            >
              Send spec PDF
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
