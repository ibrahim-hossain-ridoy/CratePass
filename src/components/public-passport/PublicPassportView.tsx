"use client";

import React, { useMemo, useState } from "react";
import {
  BATTERY_FIELDS,
  FIELD_GROUP_META,
  PUBLIC_MANUFACTURER_NOTICE,
  WORKING_FIELD_LIST_NOTICE,
  type FieldGroupId,
} from "@/config/battery-fields";
import {
  getVisiblePassportTabs,
  type FieldValueMap,
  type RealPassportTabId,
} from "@/lib/passport-projection";
import {
  AuthenticityIcon,
  BrandMark,
  InfoIcon,
  JourneyIcon,
  PassportIcon,
  RepairIcon,
  WheeledBinIcon,
} from "@/components/Icons";

interface PublicPassportViewProps {
  slug: string;
  versionNumber: number;
  declaredAt: string;
  publicFields: FieldValueMap;
}

const TAB_DEFS: Record<
  RealPassportTabId,
  {
    label: string;
    mobileLabel: string;
    icon: (props: { className?: string }) => React.ReactElement;
  }
> = {
  passport: {
    label: "Passport data",
    mobileLabel: "Passport",
    icon: PassportIcon,
  },
  repair: {
    label: "Care & repair info",
    mobileLabel: "Repair",
    icon: RepairIcon,
  },
  supply: {
    label: "Supply notes",
    mobileLabel: "Supply",
    icon: JourneyIcon,
  },
  provenance: {
    label: "Provenance & recycling",
    mobileLabel: "Provenance",
    icon: AuthenticityIcon,
  },
};

export function PublicPassportView({
  slug,
  versionNumber,
  declaredAt,
  publicFields,
}: PublicPassportViewProps) {
  const visibleTabs = useMemo(
    () => getVisiblePassportTabs(publicFields),
    [publicFields],
  );
  const [activeTab, setActiveTab] = useState<RealPassportTabId>(
    visibleTabs[0] ?? "provenance",
  );

  const modelName = publicFields.battery_model_name || slug;
  const manufacturer = publicFields.manufacturer_name || "Battery manufacturer";
  const specPieces = [
    publicFields.nominal_voltage_v ? `${publicFields.nominal_voltage_v} V` : "",
    publicFields.rated_capacity_ah ? `${publicFields.rated_capacity_ah} Ah` : "",
    publicFields.rated_energy_wh ? `${publicFields.rated_energy_wh} Wh` : "",
  ].filter(Boolean);

  const repairItems = BATTERY_FIELDS.filter(
    (f) => f.subSection === "repair" && f.tier === "public" && publicFields[f.key],
  );
  const supplyItems = BATTERY_FIELDS.filter(
    (f) => f.subSection === "supply" && f.tier === "public" && publicFields[f.key],
  );
  const recyclingItems = BATTERY_FIELDS.filter(
    (f) => f.subSection === "recycling" && f.tier === "public" && publicFields[f.key],
  );

  const groupIds: FieldGroupId[] = ["identity", "integrity", "careRepair", "impact"];
  const mobileGridClass =
    visibleTabs.length === 4
      ? "grid-cols-4"
      : visibleTabs.length === 3
        ? "grid-cols-3"
        : visibleTabs.length === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      {/* Header matching Direction A mobile-first design without fictional demo tags */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[960px] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <BrandMark className="mt-0.5 h-8 w-8 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-tight text-[var(--muted)]">
                  {manufacturer} · Digital Battery Passport
                </p>
                <h1 className="mt-0.5 text-[21px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ink)] sm:text-[24px]">
                  {modelName}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--muted)]">
                  <code className="rounded bg-[var(--well)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--ink)]">
                    /p/{slug}
                  </code>
                  <span aria-hidden="true">·</span>
                  <span className="num font-mono text-[11.5px]">v{versionNumber}</span>
                  {specPieces.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="num">{specPieces.join(" · ")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--well-soft)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--ink)]">
                <InfoIcon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                <span>{PUBLIC_MANUFACTURER_NOTICE}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop horizontal tab bar */}
      <nav
        aria-label="Battery passport sections"
        className="hidden border-b border-[var(--border)] bg-[var(--surface)] md:block"
      >
        <div
          role="tablist"
          aria-label="Battery passport sections"
          className="mx-auto flex max-w-[960px] items-center gap-1 px-6"
        >
          {visibleTabs.map((tabId) => {
            const def = TAB_DEFS[tabId];
            const Icon = def.icon;
            const selected = activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tabId)}
                className={`pressable relative inline-flex min-h-[44px] items-center gap-2 border-b-2 px-3.5 py-2.5 text-[14px] font-medium whitespace-nowrap cursor-pointer ${
                  selected
                    ? "border-[var(--accent)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? "text-[var(--accent-ink)]" : "text-[var(--muted)]"
                  }`}
                />
                <span>{def.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Battery passport sections mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] md:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      >
        <div role="tablist" className={`grid ${mobileGridClass} gap-1 px-1.5 pt-1`}>
          {visibleTabs.map((tabId) => {
            const def = TAB_DEFS[tabId];
            const Icon = def.icon;
            const selected = activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tabId)}
                className={`pressable flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11.5px] font-medium leading-none cursor-pointer ${
                  selected ? "bg-[var(--well)] text-[var(--ink)]" : "text-[var(--muted)]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    selected ? "text-[var(--accent-ink)]" : "text-[var(--muted)]"
                  }`}
                />
                <span>{def.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[960px] flex-1 space-y-4 px-4 pt-5 pb-28 sm:px-6 md:pb-12">
        <div className="rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] px-3.5 py-2 text-[12.5px] text-[var(--muted)]">
          {WORKING_FIELD_LIST_NOTICE} Restricted fields for market-surveillance
          authorities and repair operators are omitted from this public view.
        </div>

        {/* Tab 1: Populated public passport groups */}
        {activeTab === "passport" && (
          <div className="tab-panel-enter grid grid-cols-1 gap-4 lg:grid-cols-2">
            {groupIds.map((groupId) => {
              const items = BATTERY_FIELDS.filter(
                (f) =>
                  f.group === groupId &&
                  f.tier === "public" &&
                  f.subSection === "general" &&
                  Boolean(publicFields[f.key]),
              );
              if (items.length === 0) return null;
              const meta = FIELD_GROUP_META[groupId];

              return (
                <section
                  key={groupId}
                  className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[var(--rule)] pb-3">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                        {meta.title}
                      </h2>
                      <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                        {meta.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 rounded border border-[var(--positive-border)] bg-[var(--positive-bg)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--positive)]">
                      Public
                    </span>
                  </div>

                  <dl className="divide-y divide-[var(--rule)]">
                    {items.map((field) => (
                      <div
                        key={field.key}
                        className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                      >
                        <dt className="text-[13px] text-[var(--muted)]">
                          {field.label}
                        </dt>
                        <dd className="num text-[14px] font-medium text-[var(--ink)] sm:text-right">
                          {publicFields[field.key]}
                          {field.unit ? ` ${field.unit}` : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })}
          </div>
        )}

        {/* Tab 2: Conditional text-only Care & Repair info tab */}
        {activeTab === "repair" && repairItems.length > 0 && (
          <section className="tab-panel-enter rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="border-b border-[var(--rule)] pb-3">
              <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                Care, handling &amp; external spare-parts information
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                Published manufacturer care notes. Do not open sealed lithium enclosures;
                internal service belongs strictly to authorised technicians.
              </p>
            </div>
            <dl className="divide-y divide-[var(--rule)]">
              {repairItems.map((field) => (
                <div key={field.key} className="py-3">
                  <dt className="text-[13px] font-semibold text-[var(--ink)]">
                    {field.label}
                  </dt>
                  <dd className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-[var(--muted)]">
                    {publicFields[field.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Tab 3: Conditional Supply tab (real brand fields only) */}
        {activeTab === "supply" && supplyItems.length > 0 && (
          <section className="tab-panel-enter rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="border-b border-[var(--rule)] pb-3">
              <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                Disclosed supply &amp; origin notes
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                Self-declared locations submitted by the manufacturer for this battery model.
              </p>
            </div>
            <dl className="mt-2 divide-y divide-[var(--rule)]">
              {supplyItems.map((field, idx) => (
                <div key={field.key} className="flex items-start gap-3 py-3">
                  <span className="num mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--well)] text-[12px] font-semibold text-[var(--ink)]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[13px] font-semibold text-[var(--ink)]">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5 text-[14px] text-[var(--muted)]">
                      {publicFields[field.key]}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Tab 4: Provenance & recycling */}
        {activeTab === "provenance" && (
          <div className="tab-panel-enter grid grid-cols-1 gap-4 lg:grid-cols-12">
            <article className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5 lg:col-span-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule)] pb-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                    Provenance &amp; publication record
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                    Version <span className="num font-mono">v{versionNumber}</span> ·{" "}
                    <code className="font-mono">/p/{slug}</code>
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[8px] border border-[var(--notice-border)] bg-[var(--notice-bg)] p-3.5 text-[13.5px] font-medium text-[var(--notice-ink)]">
                {PUBLIC_MANUFACTURER_NOTICE}
              </div>

              <dl className="mt-4 divide-y divide-[var(--rule)] text-[13.5px]">
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[var(--muted)]">Manufacturer declaration</dt>
                  <dd className="font-medium text-[var(--ink)]">
                    Submitted by workspace publisher
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[var(--muted)]">Declared timestamp (UTC)</dt>
                  <dd className="num font-mono text-[12.5px] text-[var(--ink)]">
                    {declaredAt.slice(0, 19).replace("T", " ")}Z
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 lg:col-span-6">
              <div className="flex items-center gap-2.5 border-b border-[var(--rule)] pb-3">
                <WheeledBinIcon className="h-6 w-6 shrink-0 text-[var(--ink)]" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                    End-of-life &amp; recycling instructions
                  </h2>
                  <p className="text-[12.5px] text-[var(--muted)]">
                    Separate collection required — do not dispose with unsorted waste
                  </p>
                </div>
              </div>

              {recyclingItems.length === 0 ? (
                <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--muted)]">
                  Return spent e-bike batteries through an authorised municipal battery
                  collection point, bicycle dealer take-back programme, or producer
                  collection operator.
                </p>
              ) : (
                <dl className="mt-2 divide-y divide-[var(--rule)]">
                  {recyclingItems.map((field) => (
                    <div key={field.key} className="py-3">
                      <dt className="text-[13px] font-semibold text-[var(--ink)]">
                        {field.label}
                      </dt>
                      <dd className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-[var(--muted)]">
                        {publicFields[field.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          </div>
        )}

        <footer className="border-t border-[var(--border)] pt-4 text-[12px] text-[var(--muted)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>{PUBLIC_MANUFACTURER_NOTICE}</span>
            <span>{WORKING_FIELD_LIST_NOTICE}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
