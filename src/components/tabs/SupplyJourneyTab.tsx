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
      <div className="rounded-[12px] border border-[#233242] bg-[#0B1016] p-4 text-[#F1F5F9] sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-bold text-white">
              Static Supply Route Schematic
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#94A3B8]">
              Fictional four-stage material and assembly chain — static demo data, no map API
            </p>
          </div>
          <span className="chamfer-sm bg-[#121B24] px-2.5 py-1 font-mono text-[11.5px] font-bold text-[#6EE7B7] border border-[#233242]">
            4 fictional nodes
          </span>
        </div>

        {/* Horizontal schematic vector corridor (desktop & tablet) */}
        <div className="mt-5 hidden sm:block">
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
              stroke="#1E2C3A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="68"
              y1="30"
              x2="484"
              y2="30"
              stroke="#3B82F6"
              strokeWidth="2.2"
              strokeDasharray="6 4"
            />
            <line
              x1="484"
              y1="30"
              x2="692"
              y2="30"
              stroke="#34D399"
              strokeWidth="2.8"
            />

            {/* Directional midpoint chevrons */}
            {[172, 380, 588].map((mx) => (
              <polyline
                key={mx}
                points={`${mx - 4},25 ${mx + 3},30 ${mx - 4},35`}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.8"
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
                    r="17"
                    fill={isFinal ? "#34D399" : "#1D4ED8"}
                  />
                  <text
                    x={cx}
                    y="34"
                    textAnchor="middle"
                    fill={isFinal ? "#052E16" : "#FFFFFF"}
                    fontSize="11"
                    fontWeight="700"
                  >
                    {REGION_CODES[stage.step]}
                  </text>
                  <text
                    x={cx}
                    y="68"
                    textAnchor="middle"
                    fill="#F1F5F9"
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
              className="interactive-card relative rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <span
                    className={`num chamfer-sm flex h-7 w-7 shrink-0 items-center justify-center font-mono text-[13px] font-bold ${
                      isFinal
                        ? "bg-[var(--positive)] text-white"
                        : "bg-[var(--accent)] text-white"
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
