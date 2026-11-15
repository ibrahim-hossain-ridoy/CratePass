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
    <div className="overflow-hidden rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)]">
      {/* Window chrome / route strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--well-soft)] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]"
          />
          <code className="text-[13px] font-medium text-[var(--ink)]">
            /demo · DB-36V Battery Pack
          </code>
        </div>
        <span className="rounded border border-[var(--notice-border)] bg-[var(--notice-bg)] px-2.5 py-0.5 text-[13px] font-medium text-[var(--notice-ink)]">
          Static preview of live UI
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[var(--border)] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Left: Static mockup of the 4-tab passport viewport */}
        <div data-ui="passport-preview" className="bg-[var(--ground)] p-4 sm:p-6 lg:col-span-8">
          <div className="overflow-hidden rounded-[10px] border border-[var(--border-strong)] bg-[var(--ground)]">
            {/* Mock Sticky Identity Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-7 w-7 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-[var(--muted)]">
                    Demo Brand · Digital Product Passport
                  </p>
                  <p className="text-[15px] font-semibold leading-tight text-[var(--ink)]">
                    DB-36V Battery Pack
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded border border-[var(--notice-border)] bg-[var(--notice-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--notice-ink)]">
                Concept demo – fictional data
              </span>
            </div>

            {/* Mock Desktop Tab Bar */}
            <div className="flex flex-wrap gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 text-[12px] font-medium text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5 border-b-2 border-[var(--accent)] py-2 text-[var(--ink)]">
                <PassportIcon className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                Passport data
              </span>
              <span className="inline-flex items-center gap-1.5 py-2">
                <RepairIcon className="h-3.5 w-3.5" />
                Interactive repair
              </span>
              <span className="inline-flex items-center gap-1.5 py-2">
                <JourneyIcon className="h-3.5 w-3.5" />
                Supply journey
              </span>
              <span className="inline-flex items-center gap-1.5 py-2">
                <AuthenticityIcon className="h-3.5 w-3.5" />
                Authenticity &amp; recycling
              </span>
            </div>

            {/* Mock Inner Passport Cards */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4">
              {/* Left mock card: Identity & Integrity rows */}
              <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-2">
                  <span className="text-[13px] font-semibold text-[var(--ink)]">
                    Identity
                  </span>
                  <span className="rounded border border-[var(--positive-border)] bg-[var(--positive-bg)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--positive)]">
                    Public
                  </span>
                </div>
                <dl className="mt-1 divide-y divide-[var(--rule)] text-[12px]">
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Passport ID</dt>
                    <dd className="num font-medium text-[var(--ink)]">
                      <code>DPP-DEMO-DB36V-00419</code>
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Electrical rating</dt>
                    <dd className="num font-medium text-[var(--ink)]">
                      36 V · 14.5 Ah (522 Wh)
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Chemistry</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      Li-ion NMC 811
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-[var(--muted)]">Carbon footprint</dt>
                    <dd className="num font-medium text-[var(--ink)]">
                      68.4 kg CO2e
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Right mock card: Mini 2.5D Repair diagram schematic */}
              <div className="flex flex-col justify-between rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-2">
                  <span className="text-[13px] font-semibold text-[var(--ink)]">
                    2.5D Repair Cutaway
                  </span>
                  <span className="rounded border border-[var(--border-strong)] bg-[var(--well)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--ink)]">
                    4 hotspots
                  </span>
                </div>

                <div className="relative my-2 aspect-[1376/768] w-full overflow-hidden rounded-md border border-[var(--border)] bg-[#ECEAE3]">
                  <Image
                    src="/images/battery-cutaway-25d.jpg"
                    alt="2.5D cutaway preview of the DB-36V battery pack showing cells, fuse, BMS board, and latch"
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 320px"
                    className="object-cover"
                  />
                  <span className="absolute left-[8%] top-[10%] rounded-full border border-[#9A3412] bg-[var(--accent)] px-2 py-0.5 text-[9.5px] font-semibold text-white">
                    Cells (Pro)
                  </span>
                  <span className="absolute bottom-[10%] left-[8%] rounded-full border border-[#0F5C2C] bg-[var(--positive)] px-2 py-0.5 text-[9.5px] font-semibold text-white">
                    Fuse
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>Fuse &amp; latch: User steps</span>
                  <span className="font-medium text-[var(--accent-ink)]">
                    Cells: Workshop only
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Studio hardware render, QR label & live demo entry */}
        <div className="flex flex-col justify-between gap-4 p-5 lg:col-span-4">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-[#F5F4F0]">
              <Image
                src="/images/battery-pack-studio.jpg"
                alt="Studio product render of an anodized charcoal e-bike battery pack with orange service tab and steel locking latch"
                width={1200}
                height={896}
                priority
                sizes="(max-width: 1024px) 100vw, 340px"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            <div>
              <p className="text-[13px] font-semibold text-[var(--muted)]">
                Phone-first QR delivery
              </p>
              <h3 className="mt-1 text-[18px] font-semibold leading-snug text-[var(--ink)]">
                Built to load cleanly off a battery casing scan
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--muted)]">
                Inspect all 4 interactive tabs — grouped product specifications,
                safety-bounded 2.5D repair pins, supply chain nodes, and
                end-of-life disposal instructions.
              </p>
            </div>

            {/* Static QR schematic label block (SVG only) */}
            <div className="flex items-center gap-3.5 rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] p-3">
              <svg
                viewBox="0 0 64 64"
                aria-hidden="true"
                className="h-14 w-14 shrink-0 rounded border border-[var(--border-strong)] bg-[var(--surface)] p-1.5 text-[var(--ink)]"
              >
                <rect
                  x="4"
                  y="4"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <rect x="9" y="9" width="8" height="8" fill="currentColor" />
                <rect
                  x="42"
                  y="4"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <rect x="47" y="9" width="8" height="8" fill="currentColor" />
                <rect
                  x="4"
                  y="42"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <rect x="9" y="47" width="8" height="8" fill="currentColor" />
                <rect x="27" y="6" width="5" height="5" fill="currentColor" />
                <rect x="27" y="16" width="5" height="5" fill="currentColor" />
                <rect x="27" y="27" width="10" height="10" fill="#EA580C" />
                <rect x="6" y="27" width="5" height="5" fill="currentColor" />
                <rect x="16" y="27" width="5" height="10" fill="currentColor" />
                <rect x="42" y="27" width="8" height="5" fill="currentColor" />
                <rect x="54" y="27" width="6" height="10" fill="currentColor" />
                <rect x="27" y="42" width="6" height="6" fill="currentColor" />
                <rect x="38" y="42" width="10" height="5" fill="currentColor" />
                <rect x="27" y="53" width="11" height="7" fill="currentColor" />
                <rect x="44" y="52" width="16" height="8" fill="currentColor" />
              </svg>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[var(--ink)]">
                  Pack QR Destination
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                  Illustrative label pairing spec sheet + mobile route
                </p>
                <code className="mt-1 inline-block text-[13px] font-medium text-[var(--ink)]">
                  /demo
                </code>
              </div>
            </div>
          </div>

          <Link
            href="/demo"
            className="pressable inline-flex min-h-[44px] w-full items-center justify-center rounded-[8px] bg-[var(--ink)] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#2A2927] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            Open interactive /demo
          </Link>
        </div>
      </div>
    </div>
  );
}
