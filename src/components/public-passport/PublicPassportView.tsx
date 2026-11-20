"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BATTERY_FIELDS,
  FIELD_GROUP_META,
  PUBLIC_MANUFACTURER_NOTICE,
  WORKING_FIELD_LIST_NOTICE,
  type FieldGroupId,
} from "@/config/battery-fields";
import {
  PUBLIC_PASSPORT_LOCALES,
  PUBLIC_PASSPORT_UI,
  getLocalizedFieldLabel,
  type PublicPassportLocale,
} from "@/i18n/passport-public";
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
import type { RecordMode } from "@/types/database";

export interface PublicUnitInfo {
  serialNumber: string;
  gtin?: string | null;
  batchLot?: string | null;
  manufacturingDate?: string | null;
  unitStatus: string;
}

export interface PublicBrandCustomization {
  logoUrl?: string | null;
  accentHex?: string | null;
}

interface PublicPassportViewProps {
  slug: string;
  versionNumber: number;
  declaredAt: string;
  publicFields: FieldValueMap;
  recordMode?: RecordMode;
  hasUploadedDoc?: boolean;
  unitInfo?: PublicUnitInfo;
  branding?: PublicBrandCustomization;
}

const SAFE_HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function PublicPassportView({
  slug,
  versionNumber,
  declaredAt,
  publicFields,
  recordMode = "full_passport",
  hasUploadedDoc = false,
  unitInfo,
  branding,
}: PublicPassportViewProps) {
  const [locale, setLocale] = useState<PublicPassportLocale>("en");
  const ui = PUBLIC_PASSPORT_UI[locale];

  const customAccent =
    branding?.accentHex && SAFE_HEX_PATTERN.test(branding.accentHex)
      ? branding.accentHex
      : null;

  const safeLogoUrl =
    branding?.logoUrl && /^https?:\/\//i.test(branding.logoUrl)
      ? branding.logoUrl
      : null;

  const visibleTabs = useMemo(
    () => getVisiblePassportTabs(publicFields),
    [publicFields],
  );
  const [activeTab, setActiveTab] = useState<RealPassportTabId>(
    visibleTabs[0] ?? "provenance",
  );

  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    ready: boolean;
  }>({ left: 0, width: 0, ready: false });

  useEffect(() => {
    function syncUnderline() {
      const activeEl = buttonRefs.current[activeTab];
      if (!activeEl) return;
      setIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
    syncUnderline();
    window.addEventListener("resize", syncUnderline);
    return () => window.removeEventListener("resize", syncUnderline);
  }, [activeTab, visibleTabs, locale]);

  const activeIndex = Math.max(0, visibleTabs.indexOf(activeTab));

  const tabMeta: Record<
    RealPassportTabId,
    {
      label: string;
      mobileLabel: string;
      icon: (props: { className?: string }) => React.ReactElement;
    }
  > = {
    passport: {
      label: ui.tabs.passport,
      mobileLabel: ui.tabs.passportMobile,
      icon: PassportIcon,
    },
    repair: {
      label: ui.tabs.repair,
      mobileLabel: ui.tabs.repairMobile,
      icon: RepairIcon,
    },
    supply: {
      label: ui.tabs.supply,
      mobileLabel: ui.tabs.supplyMobile,
      icon: JourneyIcon,
    },
    provenance: {
      label: ui.tabs.provenance,
      mobileLabel: ui.tabs.provenanceMobile,
      icon: AuthenticityIcon,
    },
  };

  const modelName =
    publicFields.model_serial_number ||
    publicFields.battery_model_name ||
    slug;
  const manufacturer = publicFields.manufacturer_name || "Battery manufacturer";
  const specPieces = [
    publicFields.nominal_voltage_v ? `${publicFields.nominal_voltage_v} V` : "",
    publicFields.capacity_ah
      ? `${publicFields.capacity_ah} Ah`
      : publicFields.rated_capacity_ah
        ? `${publicFields.rated_capacity_ah} Ah`
        : "",
    publicFields.original_power_w
      ? `${publicFields.original_power_w} W`
      : publicFields.rated_energy_wh
        ? `${publicFields.rated_energy_wh} Wh`
        : "",
    publicFields.weight_kg ? `${publicFields.weight_kg} kg` : "",
  ].filter(Boolean);

  const repairItems = BATTERY_FIELDS.filter(
    (f) => f.subSection === "repair" && f.tier === "public" && publicFields[f.key],
  );
  const supplyItems = BATTERY_FIELDS.filter(
    (f) => f.subSection === "supply" && f.tier === "public" && publicFields[f.key],
  );
  const recyclingItems = BATTERY_FIELDS.filter(
    (f) =>
      f.subSection === "recycling" && f.tier === "public" && publicFields[f.key],
  );

  const groupIds: FieldGroupId[] = [
    "identity",
    "integrity",
    "careRepair",
    "impact",
  ];
  const mobileGridClass =
    visibleTabs.length === 4
      ? "grid-cols-4"
      : visibleTabs.length === 3
        ? "grid-cols-3"
        : visibleTabs.length === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  const rootAccentStyle = customAccent
    ? ({ "--accent": customAccent } as React.CSSProperties)
    : undefined;

  const isSimpleQr = recordMode === "simple_qr";
  const externalDocUrl =
    publicFields.eu_doc_link && /^https?:\/\//i.test(publicFields.eu_doc_link)
      ? publicFields.eu_doc_link
      : null;

  return (
    <div
      style={rootAccentStyle}
      className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]"
    >
      {/* Obsidian Hardware Identity Masthead + 7-EU-Language Switcher */}
      <header className="bg-[#101214] text-[#f4f3ef]">
        <div className="mx-auto max-w-[1040px] px-5 py-6 sm:px-8">
          {/* Top Utility Strip: Language Selector */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#20242c] pb-3.5">
            <span className="text-[12px] font-semibold text-[#9aa0ab]">
              {isSimpleQr ? ui.simpleQr.badge : ui.passportSubtitle}
            </span>

            <div
              role="group"
              aria-label="Passport language switcher"
              className="inline-flex flex-wrap items-center gap-1 rounded-[9px] bg-[#171a1e] p-1"
            >
              {PUBLIC_PASSPORT_LOCALES.map((item) => {
                const selected = locale === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLocale(item.code)}
                    aria-pressed={selected}
                    style={
                      selected && customAccent
                        ? { backgroundColor: customAccent, color: "#ffffff" }
                        : undefined
                    }
                    className={`cursor-pointer rounded-[6px] px-2 py-1 text-[11.5px] font-bold transition-colors ${
                      selected
                        ? customAccent
                          ? ""
                          : "bg-[#3eb8cf] text-[#08181d]"
                        : "text-[#b6bac2] hover:text-white"
                    }`}
                  >
                    {item.nativeName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              {safeLogoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={safeLogoUrl}
                  alt={`${manufacturer} logo`}
                  className="mt-0.5 h-10 w-10 shrink-0 rounded-[8px] bg-white object-contain p-1"
                />
              ) : (
                <BrandMark className="mt-0.5 h-9 w-9 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#c4c8d0]">
                  <span
                    aria-hidden="true"
                    className="status-pulse h-2 w-2 rounded-full bg-[#34d399]"
                  />
                  <span className="font-semibold text-white">
                    {manufacturer}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {isSimpleQr ? ui.simpleQrSubtitle : ui.passportSubtitle}
                  </span>
                </div>

                <h1 className="text-title-page mt-1 text-white">{modelName}</h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
                  <code className="rounded-md bg-[#1d2229] px-2.5 py-0.5 text-[13px] font-medium text-[#3eb8cf]">
                    /p/{slug}
                  </code>
                  <span className="num rounded-md bg-[#0a2921] px-2.5 py-0.5 font-semibold text-[#6ee7b7]">
                    v{versionNumber}
                  </span>
                  {specPieces.map((piece) => (
                    <span
                      key={piece}
                      className="num rounded-md bg-[#171a1e] px-2.5 py-0.5 font-medium text-[#f4f3ef]"
                    >
                      {piece}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center self-start sm:self-center">
              <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#2a2114] px-3.5 py-2 text-[13px] font-semibold text-[#fbbf24]">
                <InfoIcon className="h-4 w-4 shrink-0 text-[#fbbf24]" />
                <span>
                  {locale === "en"
                    ? PUBLIC_MANUFACTURER_NOTICE
                    : ui.manufacturerNotice}
                </span>
              </span>
            </div>
          </div>

          {unitInfo && (
            <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-[14px] bg-[#171a1e] p-3.5 text-[13px] sm:grid-cols-4">
              <div>
                <span className="block text-[11.5px] text-[#9aa0ab]">
                  {ui.unitBanner.serial}
                </span>
                <code className="mt-0.5 block font-semibold text-[#3eb8cf]">
                  {unitInfo.serialNumber}
                </code>
              </div>
              {unitInfo.gtin && (
                <div>
                  <span className="block text-[11.5px] text-[#9aa0ab]">
                    {ui.unitBanner.gtin}
                  </span>
                  <code className="num mt-0.5 block font-semibold text-white">
                    {unitInfo.gtin}
                  </code>
                </div>
              )}
              {unitInfo.batchLot && (
                <div>
                  <span className="block text-[11.5px] text-[#9aa0ab]">
                    {ui.unitBanner.batch}
                  </span>
                  <span className="mt-0.5 block font-semibold text-white">
                    {unitInfo.batchLot}
                  </span>
                </div>
              )}
              {unitInfo.manufacturingDate && (
                <div>
                  <span className="block text-[11.5px] text-[#9aa0ab]">
                    {ui.unitBanner.manufactured}
                  </span>
                  <span className="num mt-0.5 block font-semibold text-white">
                    {unitInfo.manufacturingDate}
                  </span>
                </div>
              )}
              <div>
                <span className="block text-[11.5px] text-[#9aa0ab]">
                  {ui.unitBanner.status}
                </span>
                <span className="mt-0.5 inline-flex rounded bg-[#0a2921] px-2 py-0.5 text-[11.5px] font-semibold text-[#6ee7b7]">
                  {unitInfo.unitStatus}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* SIMPLE QR MODE (Article 13(6) Portable / SLI / Industrial <= 2 kWh) */}
      {isSimpleQr ? (
        <main className="mx-auto w-full max-w-[880px] flex-1 space-y-5 px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Identity & EU Declaration of Conformity Card */}
            <section className="rounded-[16px] bg-white p-5 sm:p-6">
              <h2 className="font-display text-[19px] font-bold text-[#0f1114]">
                {ui.simpleQr.docHeading}
              </h2>
              <dl className="mt-4 divide-y divide-[#e8e7e2] text-[14px]">
                <div className="py-3">
                  <dt className="text-[12.5px] font-medium text-[#505660]">
                    {ui.simpleQr.manufacturerLabel}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#0f1114]">
                    {manufacturer}
                  </dd>
                </div>
                {publicFields.manufacturer_postal_address && (
                  <div className="py-3">
                    <dt className="text-[12.5px] font-medium text-[#505660]">
                      {ui.simpleQr.addressLabel}
                    </dt>
                    <dd className="mt-0.5 text-[#22252a]">
                      {publicFields.manufacturer_postal_address}
                    </dd>
                  </div>
                )}
                <div className="py-3">
                  <dt className="text-[12.5px] font-medium text-[#505660]">
                    {ui.simpleQr.modelLabel}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#0f1114]">
                    {modelName}
                  </dd>
                </div>
                {publicFields.art_13_4_marking && (
                  <div className="py-3">
                    <dt className="text-[12.5px] font-medium text-[#505660]">
                      {ui.simpleQr.markingLabel}
                    </dt>
                    <dd className="mt-0.5 text-[#22252a]">
                      {publicFields.art_13_4_marking}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {hasUploadedDoc && (
                  <a
                    href={`/api/p/${encodeURIComponent(slug)}/doc`}
                    target="_blank"
                    rel="noreferrer"
                    className="pressable inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[var(--accent)] px-4 py-2 text-[14px] font-semibold text-white hover:opacity-95"
                  >
                    {ui.simpleQr.docDownload}
                  </a>
                )}
                {externalDocUrl && (
                  <a
                    href={externalDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="pressable inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#f4f4f2] px-4 py-2 text-[14px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
                  >
                    {ui.simpleQr.docExternalLink} ↗
                  </a>
                )}
                {!hasUploadedDoc && !externalDocUrl && publicFields.eu_doc_link && (
                  <p className="rounded-[10px] bg-[#f4f4f2] px-3.5 py-2.5 text-[13.5px] text-[#22252a]">
                    {publicFields.eu_doc_link}
                  </p>
                )}
              </div>
            </section>

            {/* Separate Collection & Disposal Card */}
            <section className="rounded-[16px] bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3 border-b border-[#e4e3dd] pb-3.5">
                <WheeledBinIcon className="h-8 w-8 shrink-0 text-[#0f1114]" />
                <div>
                  <h2 className="font-display text-[18px] font-bold text-[#0f1114]">
                    {ui.simpleQr.collectionHeading}
                  </h2>
                  <p className="text-[13px] text-[#505660]">
                    {ui.recyclingSubheading}
                  </p>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line text-[14.5px] leading-relaxed text-[#22252a]">
                {publicFields.waste_battery_info || ui.recyclingFallback}
              </p>

              <div className="mt-5 rounded-[10px] bg-[#f4f4f2] p-3.5 text-[12.5px] text-[#505660]">
                <p>
                  {ui.declaredTimestampLabel}:{" "}
                  <code className="font-semibold text-[#0f1114]">
                    {declaredAt.slice(0, 19).replace("T", " ")}Z
                  </code>
                </p>
                <a
                  href={`/p/${encodeURIComponent(slug)}/passport.jsonld`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block font-semibold text-[var(--accent)] hover:underline"
                >
                  {ui.jsonLdLinkLabel} ↗
                </a>
              </div>
            </section>
          </div>

          <footer className="border-t border-[var(--border-strong)] pt-5 text-[12.5px] text-[var(--muted)]">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-[var(--ink)]">
                {locale === "en"
                  ? PUBLIC_MANUFACTURER_NOTICE
                  : ui.manufacturerNotice}
              </span>
              <span>
                {locale === "en"
                  ? WORKING_FIELD_LIST_NOTICE
                  : ui.workingFieldNotice}
              </span>
            </div>
          </footer>
        </main>
      ) : (
        <>
          {/* FULL 71-POINT PASSPORT MODE */}
          {/* Sticky Desktop Horizontal Tab Bar with Sliding Underline */}
          <nav
            aria-label="Battery passport sections"
            className="sticky top-0 z-30 hidden border-b border-[var(--border-strong)] bg-[var(--surface)]/95 backdrop-blur md:block"
          >
            <div
              role="tablist"
              aria-label="Battery passport sections"
              className="relative mx-auto flex max-w-[1040px] items-center gap-2 px-6"
            >
              {visibleTabs.map((tabId) => {
                const def = tabMeta[tabId];
                const Icon = def.icon;
                const selected = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    ref={(el) => {
                      buttonRefs.current[tabId] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tabId)}
                    className={`pressable relative inline-flex min-h-[48px] cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-[14.5px] font-bold ${
                      selected
                        ? indicator.ready
                          ? "border-transparent text-[var(--ink)]"
                          : "border-[var(--accent)] text-[var(--ink)]"
                        : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                        selected
                          ? "text-[var(--accent)]"
                          : "text-[var(--muted)]"
                      }`}
                    />
                    <span>{def.label}</span>
                  </button>
                );
              })}

              {indicator.ready && (
                <span
                  aria-hidden="true"
                  style={{
                    transform: `translateX(${indicator.left}px) scaleX(${indicator.width / 100})`,
                  }}
                  className="sliding-pill pointer-events-none absolute bottom-0 left-0 h-[2.5px] w-[100px] origin-left rounded-full bg-[var(--accent)]"
                />
              )}
            </div>
          </nav>

          {/* Sticky Mobile Bottom Tab Bar with Sliding Pill */}
          <nav
            aria-label="Battery passport sections mobile"
            className="fixed inset-x-0 bottom-0 z-40 bg-[#101214]/96 text-[#f4f3ef] backdrop-blur md:hidden"
            style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
          >
            <div
              role="tablist"
              className={`relative grid ${mobileGridClass} gap-1 px-2 pt-1.5`}
            >
              <span
                aria-hidden="true"
                style={{
                  width: `calc((100% - 1rem) / ${Math.max(1, visibleTabs.length)})`,
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
                className="sliding-pill pointer-events-none absolute inset-y-1.5 left-2 rounded-[10px] bg-[var(--accent)]"
              />
              {visibleTabs.map((tabId) => {
                const def = tabMeta[tabId];
                const Icon = def.icon;
                const selected = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tabId)}
                    className={`pressable relative z-10 flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] px-1.5 py-1.5 text-[12px] font-semibold leading-none ${
                      selected
                        ? "text-white"
                        : "text-[#c4c8d0] hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] ${
                        selected ? "text-white" : "text-[#c4c8d0]"
                      }`}
                    />
                    <span>{def.mobileLabel}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <main className="mx-auto w-full max-w-[1040px] flex-1 space-y-5 px-4 pt-6 pb-28 sm:px-6 md:pb-14">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-white px-4 py-3 text-[13px] text-[#505660]">
              <span>
                <strong className="font-semibold text-[#0f1114]">
                  {locale === "en"
                    ? WORKING_FIELD_LIST_NOTICE
                    : ui.workingFieldNotice}
                </strong>{" "}
                {ui.restrictedOmittedNote}
              </span>
              <span className="rounded bg-[#e8f3f6] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#0b3c49]">
                {ui.publicTierBadge}
              </span>
            </div>

            {/* Tab 1: Populated public passport groups */}
            {activeTab === "passport" && (
              <div className="tab-panel-enter grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                      className="interactive-card rounded-[14px] bg-white p-5 sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[#e4e3dd] pb-3.5">
                        <div>
                          <h2 className="font-display text-[18px] font-bold tracking-tight text-[#0f1114]">
                            {ui.groups[groupId]}
                          </h2>
                          <p className="mt-0.5 text-[13px] text-[#505660]">
                            {meta.subtitle}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-[#edf8f2] px-2.5 py-1 text-[11.5px] font-semibold text-[#156d49]">
                          {ui.publicBadge}
                        </span>
                      </div>

                      <dl className="mt-1 divide-y divide-[#e8e7e2]">
                        {items.map((field) => (
                          <div
                            key={field.key}
                            className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                          >
                            <dt className="text-[13.5px] font-medium text-[#505660]">
                              {getLocalizedFieldLabel(field.key, locale)}
                            </dt>
                            <dd className="num text-[15px] font-semibold text-[#0f1114] sm:text-right">
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
              <section className="tab-panel-enter rounded-[14px] bg-white p-5 sm:p-6">
                <div className="border-b border-[#e4e3dd] pb-4">
                  <h2 className="font-display text-[19px] font-bold text-[#0f1114]">
                    {ui.repairHeading}
                  </h2>
                  <p className="mt-1 text-[14px] text-[#505660]">
                    {ui.repairIntro}
                  </p>
                </div>
                <dl className="divide-y divide-[#e8e7e2]">
                  {repairItems.map((field) => (
                    <div key={field.key} className="py-4">
                      <dt className="text-[14px] font-bold text-[#0f1114]">
                        {getLocalizedFieldLabel(field.key, locale)}
                      </dt>
                      <dd className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-[#505660]">
                        {publicFields[field.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* Tab 3: Conditional Supply tab */}
            {activeTab === "supply" && supplyItems.length > 0 && (
              <section className="tab-panel-enter rounded-[14px] bg-white p-5 sm:p-6">
                <div className="border-b border-[#e4e3dd] pb-4">
                  <h2 className="font-display text-[19px] font-bold text-[#0f1114]">
                    {ui.supplyHeading}
                  </h2>
                  <p className="mt-1 text-[14px] text-[#505660]">
                    {ui.supplyIntro}
                  </p>
                </div>
                <dl className="mt-2 divide-y divide-[#e8e7e2]">
                  {supplyItems.map((field, idx) => (
                    <div key={field.key} className="flex items-start gap-3.5 py-4">
                      <span className="num mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[12.5px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[14px] font-bold text-[#0f1114]">
                          {getLocalizedFieldLabel(field.key, locale)}
                        </dt>
                        <dd className="mt-1 text-[15px] leading-relaxed text-[#505660]">
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
              <div className="tab-panel-enter grid grid-cols-1 gap-5 lg:grid-cols-12">
                <article className="rounded-[14px] bg-white p-5 sm:p-6 lg:col-span-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e3dd] pb-3.5">
                    <div>
                      <h2 className="font-display text-[18px] font-bold text-[#0f1114]">
                        {ui.provenanceHeading}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-[#505660]">
                        Version{" "}
                        <span className="num font-semibold text-[#0f1114]">
                          v{versionNumber}
                        </span>{" "}
                        · <code>/p/{slug}</code>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[10px] border border-[#ebd0a8] bg-[#fdf6ec] p-4 text-[14px] font-semibold text-[#7c380b]">
                    {locale === "en"
                      ? PUBLIC_MANUFACTURER_NOTICE
                      : ui.manufacturerNotice}
                  </div>

                  <dl className="mt-4 divide-y divide-[#e8e7e2] text-[14px]">
                    <div className="flex items-baseline justify-between gap-3 py-3">
                      <dt className="text-[#505660]">
                        {ui.operatorDeclarationLabel}
                      </dt>
                      <dd className="font-bold text-[#0f1114]">
                        {ui.operatorDeclarationValue}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-3">
                      <dt className="text-[#505660]">
                        {ui.declaredTimestampLabel}
                      </dt>
                      <dd className="num text-[13px] font-semibold text-[#0f1114]">
                        <code>{declaredAt.slice(0, 19).replace("T", " ")}Z</code>
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-3">
                      <dt className="text-[#505660]">Machine-readable export</dt>
                      <dd>
                        <a
                          href={`/p/${encodeURIComponent(slug)}/passport.jsonld`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[var(--accent)] hover:underline"
                        >
                          {ui.jsonLdLinkLabel} ↗
                        </a>
                      </dd>
                    </div>
                  </dl>
                </article>

                <article className="rounded-[14px] bg-white p-5 sm:p-6 lg:col-span-6">
                  <div className="flex items-center gap-3 border-b border-[#e4e3dd] pb-3.5">
                    <WheeledBinIcon className="h-7 w-7 shrink-0 text-[#0f1114]" />
                    <div>
                      <h2 className="font-display text-[18px] font-bold text-[#0f1114]">
                        {ui.recyclingHeading}
                      </h2>
                      <p className="text-[13px] text-[#505660]">
                        {ui.recyclingSubheading}
                      </p>
                    </div>
                  </div>

                  {recyclingItems.length === 0 ? (
                    <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--muted)]">
                      {ui.recyclingFallback}
                    </p>
                  ) : (
                    <dl className="mt-2 divide-y divide-[var(--rule)]">
                      {recyclingItems.map((field) => (
                        <div key={field.key} className="py-3.5">
                          <dt className="text-[13.5px] font-bold text-[var(--ink)]">
                            {getLocalizedFieldLabel(field.key, locale)}
                          </dt>
                          <dd className="mt-1 whitespace-pre-line text-[14.5px] leading-relaxed text-[var(--muted)]">
                            {publicFields[field.key]}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </article>
              </div>
            )}

            <footer className="border-t border-[var(--border-strong)] pt-5 text-[12.5px] text-[var(--muted)]">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-[var(--ink)]">
                  {locale === "en"
                    ? PUBLIC_MANUFACTURER_NOTICE
                    : ui.manufacturerNotice}
                </span>
                <span>
                  {locale === "en"
                    ? WORKING_FIELD_LIST_NOTICE
                    : ui.workingFieldNotice}
                </span>
              </div>
            </footer>
          </main>
        </>
      )}
    </div>
  );
}
