import type { AuthenticityData } from "@/types/passport";
import { InfoIcon, WheeledBinIcon } from "@/components/Icons";

interface AuthenticityTabProps {
  authenticity: AuthenticityData;
}

export function AuthenticityTab({ authenticity }: AuthenticityTabProps) {
  const { recycling } = authenticity;

  return (
    <section
      id="panel-authenticity"
      role="tabpanel"
      aria-labelledby="tab-desktop-authenticity"
      className="tab-panel-enter grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start"
    >
      {/* Certificate-style demo record card */}
      <article className="surface-elevated relative overflow-hidden rounded-[12px] lg:col-span-7">
        {/* Top banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2924] bg-[#141210] px-4 py-4 text-white sm:px-5">
          <div>
            <h2 className="text-[17px] font-bold text-white">
              Passport Record Snapshot
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#A69E94]">
              Reference{" "}
              <code className="font-mono text-[12px] text-[#FB923C]">
                {authenticity.certificateId}
              </code>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#F59E0B]/40 bg-[#2C1E0A] px-2.5 py-1 text-[12px] font-semibold text-[#FCD34D]">
            <InfoIcon className="h-3.5 w-3.5 shrink-0 text-[#FBBF24]" />
            <span>DEMO – no real verification performed</span>
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Geometric certificate corner seal & notice */}
          <div className="flex items-start gap-3 rounded-[8px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-3.5">
            <svg
              viewBox="0 0 40 40"
              aria-hidden="true"
              className="h-10 w-10 shrink-0 text-[var(--notice-ink)]"
            >
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <circle
                cx="20"
                cy="20"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <text
                x="20"
                y="23"
                textAnchor="middle"
                fill="currentColor"
                fontSize="8.5"
                fontWeight="700"
              >
                DEMO
              </text>
            </svg>
            <p className="text-[13px] leading-relaxed text-[var(--notice-ink)]">
              {authenticity.demoNote}
            </p>
          </div>

          {/* Labeled status, timestamp, and digest fields */}
          <dl className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
            <div className="py-3">
              <dt className="text-[12.5px] text-[var(--muted)]">
                Record status
              </dt>
              <dd className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
                {authenticity.statusValue}
              </dd>
            </div>
            <div className="py-3">
              <dt className="text-[12.5px] text-[var(--muted)]">
                Check timestamp
              </dt>
              <dd className="mt-1 break-words">
                <code className="font-mono text-[13px] font-medium text-[var(--ink)]">
                  {authenticity.timestampValue}
                </code>
              </dd>
            </div>
            <div className="py-3">
              <dt className="text-[12.5px] text-[var(--muted)]">
                Record digest
              </dt>
              <dd className="mt-1">
                {authenticity.digestValue.includes(" (DEMO") ? (
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-mono text-[12.5px] text-[var(--ink)]">
                    <code className="break-all">
                      {authenticity.digestValue.slice(
                        0,
                        authenticity.digestValue.indexOf(" (DEMO")
                      )}
                    </code>
                    <span className="break-normal">
                      {authenticity.digestValue.slice(
                        authenticity.digestValue.indexOf("(DEMO")
                      )}
                    </span>
                  </div>
                ) : (
                  <code className="font-mono text-[12.5px] text-[var(--ink)] break-all">
                    {authenticity.digestValue}
                  </code>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </article>

      {/* End-of-life recycling instructions card */}
      <article className="surface-elevated overflow-hidden rounded-[12px] lg:col-span-5">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--well-soft)] px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--ink)]">
              {recycling.schemeTitle}
            </h2>
            <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--positive)]">
              {recycling.collectionCode}
            </p>
          </div>
          <WheeledBinIcon className="h-10 w-10 shrink-0 text-[var(--ink)]" />
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-[13.5px] leading-relaxed text-[var(--ink)]">
            {recycling.takeBackInstruction}
          </p>

          <div className="border-t border-[var(--rule)] pt-3.5">
            <p className="text-[13px] font-bold text-[var(--ink)]">
              Preparation before drop-off
            </p>
            <ol className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-[var(--muted)]">
              {recycling.prepSteps.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--positive-bg)] text-[11.5px] font-bold text-[var(--positive)]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </article>
    </section>
  );
}
