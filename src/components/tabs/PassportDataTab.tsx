import type { AccessTier, PassportDocument } from "@/types/passport";
import { GlobeIcon, LockIcon } from "@/components/Icons";

interface PassportDataTabProps {
  data: PassportDocument["passportData"];
}

function AccessBadge({ tier }: { tier: AccessTier }) {
  const isPublic = tier === "Public";
  return (
    <span
      className={`inline-flex flex-none items-center gap-1.5 rounded-md whitespace-nowrap px-2.5 py-1 text-[12px] font-semibold leading-5 ${
        isPublic
          ? "bg-[#edf8f2] text-[#156d49]"
          : "bg-[#e8f3f6] text-[#0b3c49]"
      }`}
    >
      {isPublic ? (
        <GlobeIcon className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <LockIcon className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>{tier}</span>
    </span>
  );
}

function GroupHeader({
  title,
  accessTier,
  subtitle,
}: {
  title: string;
  accessTier: AccessTier;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--well-soft)] px-4 py-3.5 sm:px-5">
      <div>
        <h2 className="text-[17px] font-bold leading-snug text-[var(--ink)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
      <AccessBadge tier={accessTier} />
    </div>
  );
}

function SpecRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-[13.5px] text-[var(--muted)]">{label}</dt>
      <dd className="num text-[14.5px] font-semibold text-[var(--ink)] sm:text-right">
        {mono ? <code className="text-[13.5px]">{value}</code> : value}
      </dd>
    </div>
  );
}

export function PassportDataTab({ data }: PassportDataTabProps) {
  const { identity, integrity, careRepair, impact } = data;

  return (
    <section
      id="panel-passport"
      role="tabpanel"
      aria-labelledby="tab-desktop-passport"
      className="tab-panel-enter space-y-4"
    >
      {/* Identity Group — full width two-column datasheet */}
      <article className="surface-elevated overflow-hidden rounded-[12px]">
        <GroupHeader
          title={identity.title}
          accessTier={identity.accessTier}
          subtitle="Core pack rating and accountable parties"
        />
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="px-4 py-1 sm:px-5">
            <dl className="divide-y divide-[var(--rule)]">
              <SpecRow
                label="Passport identifier"
                value={identity.data.passportId}
                mono
              />
              <SpecRow
                label="Serial number"
                value={identity.data.serialNumber}
                mono
              />
              <SpecRow label="Batch code" value={identity.data.batchCode} mono />
              <SpecRow
                label="Manufactured date"
                value={identity.data.manufacturedDate}
              />
              <SpecRow
                label="Electrical rating"
                value={`${identity.data.nominalVoltage} · ${identity.data.ratedCapacity} (${identity.data.energyCapacity})`}
              />
              <SpecRow
                label="Cell layout & mass"
                value={`${identity.data.configuration} · ${identity.data.weight}`}
              />
            </dl>
          </div>

          <div className="px-4 py-1 sm:px-5">
            <dl className="divide-y divide-[var(--rule)]">
              <div className="py-3">
                <dt className="text-[13px] text-[var(--muted)]">Manufacturer</dt>
                <dd className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
                  {identity.data.manufacturer.name}
                </dd>
                <dd className="mt-0.5 text-[13px] text-[var(--muted)]">
                  {identity.data.manufacturer.address}
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-[13px] text-[var(--muted)]">
                  EU responsible person
                </dt>
                <dd className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
                  {identity.data.euResponsiblePerson.name}
                </dd>
                <dd className="mt-0.5 text-[13px] text-[var(--muted)]">
                  {identity.data.euResponsiblePerson.address}
                </dd>
                {identity.data.euResponsiblePerson.contact ? (
                  <dd className="mt-0.5 font-mono text-[12.5px] text-[var(--muted)]">
                    {identity.data.euResponsiblePerson.contact}
                  </dd>
                ) : null}
              </div>
            </dl>
          </div>
        </div>
      </article>

      {/* Integrity Group — full width two-column datasheet */}
      <article className="surface-elevated overflow-hidden rounded-[12px]">
        <GroupHeader
          title={integrity.title}
          accessTier={integrity.accessTier}
          subtitle="Diagnostic health and housing status"
        />
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="px-4 py-1 sm:px-5">
            <div className="flex items-baseline justify-between border-b border-[var(--rule)] py-3">
              <span className="text-[13px] text-[var(--muted)]">
                State of health (SoH)
              </span>
              <span className="num text-[22px] font-bold tracking-tight text-[var(--positive)]">
                {integrity.data.stateOfHealthPct.toFixed(1)}%
              </span>
            </div>
            <dl className="divide-y divide-[var(--rule)]">
              <SpecRow
                label="Rated cycle life"
                value={integrity.data.ratedCycleLife}
              />
              <SpecRow
                label="Enclosure ingress"
                value={integrity.data.enclosureRating}
              />
            </dl>
          </div>

          <div className="px-4 py-1 sm:px-5">
            <dl className="divide-y divide-[var(--rule)]">
              <SpecRow
                label="Operating range"
                value={integrity.data.operatingTempRange}
              />
              <SpecRow
                label="Tamper seal"
                value={integrity.data.tamperSealState}
              />
              <SpecRow
                label="BMS firmware"
                value={integrity.data.bmsFirmwareVersion}
                mono
              />
            </dl>
          </div>
        </div>
      </article>

      {/* Care & Repair Group — full width two-column datasheet */}
      <article className="surface-elevated overflow-hidden rounded-[12px]">
        <GroupHeader
          title={careRepair.title}
          accessTier={careRepair.accessTier}
          subtitle="Safe charging, storage, and servicing boundary"
        />
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="px-4 py-1 sm:px-5">
            <dl className="divide-y divide-[var(--rule)]">
              <SpecRow
                label="Charging window"
                value={careRepair.data.chargingWindow}
              />
              <SpecRow
                label="Storage guidance"
                value={careRepair.data.storageGuidance}
              />
              <SpecRow
                label="Inspection interval"
                value={careRepair.data.inspectionInterval}
              />
              <SpecRow
                label="Serviceability scope"
                value={careRepair.data.serviceabilityLevel}
              />
            </dl>
          </div>

          <div className="px-4 py-3 sm:px-5">
            <p className="text-[13px] font-semibold text-[var(--ink)]">
              Handling precautions
            </p>
            <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[var(--muted)]">
              {careRepair.data.safetyNotes.map((note) => (
                <li key={note} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                  />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      {/* Impact Group — full width two-column datasheet */}
      <article className="surface-elevated overflow-hidden rounded-[12px]">
        <GroupHeader
          title={impact.title}
          accessTier={impact.accessTier}
          subtitle={`Chemistry: ${impact.data.batteryChemistry}`}
        />

        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Carbon footprint breakdown */}
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[13px] text-[var(--muted)]">
                  Lifecycle carbon footprint
                </p>
                <p className="num mt-0.5 text-[24px] font-bold tracking-tight text-[var(--ink)]">
                  {impact.data.carbonFootprintTotalKg.toFixed(1)}{" "}
                  <span className="text-[14px] font-normal text-[var(--muted)]">
                    kg CO2e
                  </span>
                </p>
              </div>
              <p className="num text-[13px] font-medium text-[var(--muted)]">
                {impact.data.carbonPerKwhKg.toFixed(1)} kg CO2e / kWh
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {impact.data.carbonLifecycleBreakdown.map((item, idx) => (
                <div key={item.stage}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-medium text-[var(--ink)]">
                      {item.stage}
                    </span>
                    <span className="num shrink-0 text-[var(--muted)]">
                      <strong className="font-semibold text-[var(--ink)]">
                        {item.sharePct}%
                      </strong>{" "}
                      ({item.kgCo2e.toFixed(1)} kg)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[var(--well)]">
                    <div
                      className="bar-fill-enter h-full rounded-full"
                      style={{
                        width: `${item.sharePct}%`,
                        backgroundColor:
                          idx === 0 ? "var(--accent)" : "var(--ink)",
                        opacity: idx === 0 ? 1 : Math.max(0.32, 0.85 - idx * 0.14),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materials & recycled content */}
          <div className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] text-[var(--muted)]">
                Material mass breakdown
              </p>
              <p className="num text-[13px] font-medium text-[var(--muted)]">
                100% by pack weight
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              {impact.data.materials.map((mat) => (
                <div key={mat.material}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="font-medium text-[var(--ink)]">
                      {mat.material}
                    </span>
                    <span className="num shrink-0 font-semibold text-[var(--ink)]">
                      {mat.massSharePct}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--well)]">
                      <div
                        className="bar-fill-enter h-full rounded-full bg-[var(--positive)]"
                        style={{ width: `${mat.massSharePct}%` }}
                      />
                    </div>
                    <span className="num w-24 shrink-0 text-right text-[12px] font-semibold text-[var(--positive)]">
                      {mat.recycledSharePct}% recycled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
