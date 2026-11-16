import Image from "next/image";
import Link from "next/link";
import {
  AuthenticityIcon,
  BrandMark,
  JourneyIcon,
  PassportIcon,
  RepairIcon,
} from "@/components/Icons";

/** Static CSS + SVG facsimile of the /demo 4-tab mobile passport view. */
export function PassportPreview() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#233242] bg-[#0B1016] text-[#F1F5F9]">
      {/* Window chrome / route strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2C3A] bg-[#111923] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="status-pulse h-2.5 w-2.5 rounded-full bg-[#34D399]"
          />
          <code className="font-mono text-[13px] font-semibold text-[#F1F5F9]">
            /demo · DB-36V Battery Pack
          </code>
        </div>
        <span className="rounded border border-[#F59E0B]/40 bg-[#291D09] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#FCD34D]">
          Static preview of live UI
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#1E2C3A] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Left: Static mockup of the 4-tab passport viewport */}
        <div
          data-ui="passport-preview"
          className="bg-[#0F1720] p-4 sm:p-6 lg:col-span-8"
        >
          <div className="overflow-hidden rounded-[12px] border border-[var(--border-strong)] bg-[var(--ground)] text-[var(--ink)]">
            {/* Mock Sticky Identity Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-7 w-7 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-[var(--muted)]">
                    Demo Brand · Digital Product Passport
                  </p>
                  <p className="text-[15px] font-bold leading-tight text-[var(--ink)]">
                    DB-36V Battery Pack
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded border border-[var(--notice-border)] bg-[var(--notice-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--notice-ink)]">
                Concept demo – fictional data
              </span>
            </div>

            {/* Mock Desktop Tab Bar */}
            <div className="flex flex-wrap gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 text-[12px] font-semibold text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5 border-b-2 border-[var(--accent)] py-2.5 text-[var(--ink)]">
                <PassportIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
                Passport data
              </span>
              <span className="inline-flex items-center gap-1.5 py-2.5">
                <RepairIcon className="h-3.5 w-3.5" />
                Interactive repair
              </span>
              <span className="inline-flex items-center gap-1.5 py-2.5">
                <JourneyIcon className="h-3.5 w-3.5" />
                Supply journey
              </span>
              <span className="inline-flex items-center gap-1.5 py-2.5">
                <AuthenticityIcon className="h-3.5 w-3.5" />
                Authenticity &amp; recycling
              </span>
            </div>

            {/* Mock Inner Passport Cards */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4">
              {/* Left mock card: Identity & Integrity rows */}
              <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-2">
                  <span className="text-[13px] font-bold text-[var(--ink)]">
                    Identity
                  </span>
                  <span className="rounded border border-[var(--positive-border)] bg-[var(--positive-bg)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--positive)]">
                    Public
                  </span>
                </div>
                <dl className="mt-1 divide-y divide-[var(--rule)] text-[12px]">
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Passport ID</dt>
                    <dd className="num font-semibold text-[var(--ink)]">
                      <code>DPP-DEMO-DB36V-00419</code>
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Electrical rating</dt>
                    <dd className="num font-semibold text-[var(--ink)]">
                      36 V · 14.5 Ah (522 Wh)
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Chemistry</dt>
                    <dd className="font-semibold text-[var(--ink)]">
                      Li-ion NMC 811
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Carbon footprint</dt>
                    <dd className="num font-semibold text-[var(--positive)]">
                      68.4 kg CO2e
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Right mock card: Mini 2.5D Repair diagram schematic */}
              <div className="flex flex-col justify-between rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-2">
                  <span className="text-[13px] font-bold text-[var(--ink)]">
                    2.5D Repair Cutaway
                  </span>
                  <span className="rounded border border-[var(--border-strong)] bg-[var(--well)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--ink)]">
                    4 hotspots
                  </span>
                </div>

                <div className="relative my-2 aspect-[1376/768] w-full overflow-hidden rounded-md border border-[var(--border)] bg-[#0F1720]">
                  <Image
                    src="/images/battery-cutaway-25d.jpg"
                    alt="2.5D cutaway preview of the DB-36V battery pack showing cells, fuse, BMS board, and latch"
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 320px"
                    className="object-cover"
                  />
                  <span className="absolute left-[8%] top-[10%] rounded-full border border-amber-400/50 bg-[#0B1016]/90 px-2 py-0.5 text-[9.5px] font-bold text-[#FCD34D]">
                    Cells (Pro)
                  </span>
                  <span className="absolute bottom-[10%] left-[8%] rounded-full border border-[#34D399]/60 bg-[#052E16]/90 px-2 py-0.5 text-[9.5px] font-bold text-[#6EE7B7]">
                    Fuse
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[var(--positive)]">
                    Fuse &amp; latch: User steps
                  </span>
                  <span className="font-semibold text-[var(--accent)]">
                    Cells: Workshop only
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: QR + Mobile-first callout */}
        <div className="flex flex-col justify-between gap-5 bg-[#0B1016] p-5 sm:p-6 lg:col-span-4">
          <div className="space-y-4">
            <div className="relative aspect-[1200/896] w-full overflow-hidden rounded-[10px] border border-[#233242] bg-[#131D28]">
              <Image
                src="/images/battery-pack-studio.jpg"
                alt="DB-36V e-bike battery pack product render"
                fill
                sizes="(max-width: 1024px) 90vw, 300px"
                className="object-cover"
              />
            </div>

            <div>
              <p className="text-[13px] font-bold text-[#34D399]">
                Phone-first QR delivery
              </p>
              <h3 className="mt-1 text-[19px] font-bold text-white">
                Built to load cleanly off a battery casing scan
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#94A3B8]">
                Inspect all 4 interactive tabs — grouped product specifications,
                safety-bounded 2.5D repair pins, supply chain nodes, and
                end-of-life disposal instructions.
              </p>
            </div>
          </div>

          <Link
            href="/demo"
            className="pressable chamfer-sm inline-flex min-h-[46px] w-full items-center justify-center bg-[#34D399] px-4 py-2.5 text-[14.5px] font-bold text-[#052E16] hover:bg-[#6EE7B7]"
          >
            Open interactive /demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
