import type { SupplyStage } from "@/types/passport";

interface SupplyJourneyTabProps {
  stages: SupplyStage[];
}

const REGION_CODES: Record<SupplyStage["step"], string> = {
  1: "CL",
  2: "LT",
  3: "DE",
  4: "DE",
};

export function SupplyJourneyTab({ stages }: SupplyJourneyTabProps) {
  return (
    <section
      id="panel-journey"
      role="tabpanel"
      aria-labelledby="tab-desktop-journey"
      className="tab-panel-enter space-y-4"
    >
      {/* Static schematic route overview */}
      <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--ink)]">
              Static Supply Route Schematic
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              Fictional four-stage material and assembly chain — static demo data, no map API
            </p>
          </div>
          <span className="rounded bg-[var(--well)] px-2 py-0.5 text-[12px] font-medium text-[var(--ink)]">
            4 fictional nodes
          </span>
        </div>

        {/* Horizontal schematic vector corridor (desktop & tablet) */}
        <div className="mt-4 hidden sm:block">
          <svg
            viewBox="0 0 760 88"
            className="h-auto w-full"
            role="img"
            aria-label="Schematic supply route from Raw Material Origin to Cell Factory, Assembly, and EU Warehouse"
          >
            {/* Base connector track */}
            <line
              x1="68"
              y1="30"
              x2="692"
              y2="30"
              stroke="#DDD9CE"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="68"
              y1="30"
              x2="484"
              y2="30"
              stroke="#141413"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <line
              x1="484"
              y1="30"
              x2="692"
              y2="30"
              stroke="#EA580C"
              strokeWidth="2.5"
            />

            {/* Directional midpoint chevrons */}
            {[172, 380, 588].map((mx) => (
              <polyline
                key={mx}
                points={`${mx - 4},25 ${mx + 3},30 ${mx - 4},35`}
                fill="none"
                stroke="#57534E"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {stages.map((stage, idx) => {
              const cx = 68 + idx * 208;
              const isFinal = idx === stages.length - 1;
              return (
                <g key={stage.step}>
                  <circle
                    cx={cx}
                    cy="30"
                    r="16"
                    fill={isFinal ? "#EA580C" : "#141413"}
                  />
                  <text
                    x={cx}
                    y="34"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {REGION_CODES[stage.step]}
                  </text>
                  <text
                    x={cx}
                    y="66"
                    textAnchor="middle"
                    fill="#141413"
                    fontSize="12.5"
                    fontWeight="600"
                  >
                    {stage.stage}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Connected 4-stage route list */}
      <ol className="relative space-y-3">
        {stages.map((stage, idx) => {
          const isFinal = idx === stages.length - 1;
          return (
            <li
              key={stage.step}
              className="relative rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span
                    className={`num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                      isFinal
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--ink)] text-white"
                    }`}
                  >
                    {stage.step}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15.5px] font-semibold text-[var(--ink)]">
                        {stage.stage}
                      </h3>
                      <span className="rounded bg-[var(--well)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--muted)]">
                        {REGION_CODES[stage.step]} · {stage.location}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] font-medium text-[var(--ink)]">
                      {stage.facility}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">
                      {stage.detail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--rule)] pt-2.5 text-[12.5px] text-[var(--muted)] sm:shrink-0 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 sm:text-right">
                  <span className="num font-medium text-[var(--ink)]">
                    {stage.dateWindow}
                  </span>
                  <span>{stage.transportMode}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
