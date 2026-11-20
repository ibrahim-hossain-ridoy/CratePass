"use client";

import React, { useState } from "react";
import { BrandMark, PdfFileIcon } from "@/components/Icons";
import {
  SUPPLIER_LOCALES,
  SUPPLIER_PORTAL_COPY,
  getSupplierFieldMeta,
  type SupplierLocale,
} from "@/lib/supplier/i18n-zh";
import type { FieldAccessTier, FieldInputType } from "@/config/battery-fields";

export interface SupplierRequestedFieldItem {
  key: string;
  pointNumber?: number;
  label: string;
  tier: FieldAccessTier;
  type: FieldInputType;
  unit?: string;
  placeholder?: string;
}

interface SupplierPortalFormProps {
  token: string;
  initialLocale: SupplierLocale;
  actionable: boolean;
  blockedReason?: "revoked" | "already_submitted" | "merged" | "expired" | "not_found";
  supplierName: string;
  productName: string;
  modelCode: string;
  expiresAt?: string;
  requestedFields: SupplierRequestedFieldItem[];
}

export function SupplierPortalForm({
  token,
  initialLocale,
  actionable,
  blockedReason,
  supplierName: initialSupplierName,
  productName,
  modelCode,
  expiresAt,
  requestedFields,
}: SupplierPortalFormProps) {
  const [locale, setLocale] = useState<SupplierLocale>(initialLocale);
  const [supplierName, setSupplierName] = useState(initialSupplierName);
  const [values, setValues] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = SUPPLIER_PORTAL_COPY[locale];

  function getTierLabel(tier: FieldAccessTier): string {
    if (tier === "public") return t.tierPublic;
    if (tier === "authorities_only") return t.tierAuthorities;
    return t.tierLegitimate;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    const hasValue = Object.values(values).some((v) => v.trim().length > 0);
    if (!hasValue && !file) {
      setErrorMsg(t.errorEmpty);
      return;
    }

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(t.errorFileSize);
        return;
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMsg(t.errorFileType);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fields", JSON.stringify(values));
      if (supplierName.trim()) {
        formData.append("supplierName", supplierName.trim());
      }
      if (file) {
        formData.append("document", file);
      }

      const res = await fetch(`/api/supplier/${encodeURIComponent(token)}`, {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || "Submission failed. Please retry.");
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMsg("Network error submitting specifications. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  const formattedExpiry = expiresAt ? expiresAt.slice(0, 10) : "";

  return (
    <div className="flex min-h-svh flex-col bg-[#e8e7e3] text-[#0f1114]">
      {/* Obsidian Top Header with Instant 5-Language Switcher */}
      <header className="sticky top-0 z-30 bg-[#101214] text-[#f4f3ef]">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0" />
            <div className="min-w-0">
              <span className="font-display block truncate text-[15px] font-semibold text-white">
                CratePass
              </span>
              <span className="block truncate text-[11.5px] text-[#9aa0ab]">
                {t.noLoginNote}
              </span>
            </div>
          </div>

          {/* Instant 5-Language Switcher (EN / 简体中文 / 한국어 / 日本語 / Tiếng Việt) */}
          <div
            role="radiogroup"
            aria-label="Language switcher"
            className="inline-flex flex-wrap items-center gap-1 rounded-[9px] bg-[#1d2229] p-1"
          >
            {SUPPLIER_LOCALES.map((opt) => {
              const selected = locale === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLocale(opt.code)}
                  className={`pressable cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    selected
                      ? "bg-[#3eb8cf] text-[#08181d]"
                      : "text-[#c4c8d0] hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] flex-1 space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {!actionable && !submitted ? (
          <section className="rounded-[20px] bg-white p-6 sm:p-8">
            <span className="inline-flex rounded-md bg-[#fdf6ec] px-2.5 py-1 text-[12px] font-semibold text-[#7c380b]">
              {t.badge}
            </span>
            <h1 className="font-display mt-3 text-[23px] font-bold text-[#0f1114]">
              {blockedReason === "expired"
                ? t.expiredTitle
                : blockedReason === "revoked"
                  ? t.revokedTitle
                  : blockedReason === "already_submitted" || blockedReason === "merged"
                    ? t.alreadySubmittedTitle
                    : t.notFoundTitle}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#4b4f57]">
              {blockedReason === "expired"
                ? t.expiredBody
                : blockedReason === "revoked"
                  ? t.revokedBody
                  : blockedReason === "already_submitted" || blockedReason === "merged"
                    ? t.alreadySubmittedBody
                    : t.notFoundBody}
            </p>
          </section>
        ) : submitted ? (
          <section className="tab-panel-enter rounded-[20px] bg-white p-6 sm:p-8">
            <span className="inline-flex rounded-md bg-[#edf8f2] px-3 py-1 text-[12.5px] font-semibold text-[#156d49]">
              ✓ {t.successTitle}
            </span>
            <h1 className="font-display mt-3 text-[24px] font-bold text-[#0f1114]">
              {t.successTitle}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#4b4f57]">
              {t.successBody}
            </p>
            <div className="mt-5 rounded-[12px] bg-[#f4f4f2] p-4 text-[13.5px] text-[#22252a]">
              <strong className="font-semibold text-[#0f1114]">{productName}</strong>
              {modelCode ? ` · ${modelCode}` : ""}
            </div>
          </section>
        ) : (
          <>
            {/* Intro Card */}
            <section className="rounded-[20px] bg-white p-5 sm:p-7">
              <span className="inline-flex rounded-md bg-[#e6f2f5] px-2.5 py-1 text-[12px] font-semibold text-[#0b3c49]">
                {t.badge}
              </span>
              <h1 className="font-display mt-2.5 text-[23px] font-bold tracking-tight text-[#0f1114] sm:text-[27px]">
                {t.title}
              </h1>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#4b4f57]">
                {t.subtitle}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 rounded-[14px] bg-[#f4f4f2] p-4 text-[13.5px] sm:grid-cols-2">
                <div>
                  <span className="text-[#505660]">{t.requestedBy}</span>
                  <p className="font-display mt-0.5 text-[15.5px] font-semibold text-[#0f1114]">
                    {productName}
                    {modelCode ? (
                      <code className="ml-2 rounded bg-white px-1.5 py-0.5 text-[12px] text-[#145b6e]">
                        {modelCode}
                      </code>
                    ) : null}
                  </p>
                </div>
                {formattedExpiry && (
                  <div>
                    <span className="text-[#505660]">{t.expiresLabel}</span>
                    <p className="num mt-0.5 text-[14.5px] font-semibold text-[#0f1114]">
                      {formattedExpiry}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-[12px] border border-[#9bc8d4] bg-[#e6f2f5] px-4 py-3 text-[13.5px] font-medium text-[#0b3c49]">
                {t.siUnitReminder}
              </div>
            </section>

            {/* Supplier Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Optional Factory Contact Name */}
              <section className="rounded-[20px] bg-white p-5 sm:p-7">
                <label
                  htmlFor="supplier-contact-name"
                  className="block text-[14px] font-semibold text-[#0f1114]"
                >
                  {t.factoryNameLabel}
                </label>
                <input
                  id="supplier-contact-name"
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder={t.factoryNamePlaceholder}
                  className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[15px] text-[#0f1114]"
                />
              </section>

              {/* Requested Static Annex XIII Fields */}
              <section className="rounded-[20px] bg-white p-5 sm:p-7">
                <div className="flex items-center justify-between gap-2 border-b border-[#e6e4de] pb-3.5">
                  <h2 className="font-display text-[18px] font-semibold text-[#0f1114]">
                    {t.fieldsHeading}
                  </h2>
                  <span className="num rounded-md bg-[#f4f4f2] px-2.5 py-1 text-[12.5px] font-semibold text-[#0f1114]">
                    {requestedFields.length}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {requestedFields.map((field) => {
                    const localizedMeta = getSupplierFieldMeta(field.key, locale);
                    const primaryLabel = localizedMeta
                      ? localizedMeta.label
                      : field.label;
                    const secondaryLabel =
                      locale !== "en" && localizedMeta ? field.label : null;
                    const hint = localizedMeta?.hint || field.placeholder;

                    return (
                      <div
                        key={field.key}
                        className="rounded-[14px] bg-[#f9f9f7] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <label
                              htmlFor={`sup-${field.key}`}
                              className="block text-[14.5px] font-semibold text-[#0f1114]"
                            >
                              {field.pointNumber ? `#${field.pointNumber} · ` : ""}
                              {primaryLabel}
                              {field.unit ? (
                                <span className="ml-1.5 rounded bg-white px-1.5 py-0.5 text-[12px] font-semibold text-[#145b6e]">
                                  {field.unit}
                                </span>
                              ) : null}
                            </label>
                            {secondaryLabel && (
                              <p className="mt-0.5 text-[12px] text-[#505660]">
                                EN: {secondaryLabel}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-[#4b4f57]">
                            {getTierLabel(field.tier)}
                          </span>
                        </div>

                        {field.type === "textarea" ? (
                          <textarea
                            id={`sup-${field.key}`}
                            rows={3}
                            value={values[field.key] ?? ""}
                            onChange={(e) =>
                              setValues((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={hint || ""}
                            className="input-apple mt-2.5 w-full rounded-[10px] border border-[#dcdad4] bg-white px-3.5 py-2.5 text-[14.5px] text-[#0f1114] placeholder:text-[#767b84]"
                          />
                        ) : (
                          <input
                            id={`sup-${field.key}`}
                            type="text"
                            inputMode={field.type === "number" ? "decimal" : "text"}
                            value={values[field.key] ?? ""}
                            onChange={(e) =>
                              setValues((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={hint || ""}
                            className="input-apple mt-2.5 w-full rounded-[10px] border border-[#dcdad4] bg-white px-3.5 py-2.5 text-[14.5px] text-[#0f1114] placeholder:text-[#767b84]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Optional Spec / UN38.3 / IEC Test PDF Upload */}
              <section className="rounded-[20px] bg-white p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f2f5] text-[#145b6e]">
                    <PdfFileIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-[17px] font-semibold text-[#0f1114]">
                      {t.uploadHeading}
                    </h2>
                    <p className="mt-1 text-[13.5px] text-[#4b4f57]">
                      {t.uploadSubheading}
                    </p>
                  </div>
                </div>

                <input
                  id="supplier-pdf-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  aria-label={t.uploadPickLabel}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setFile(e.target.files?.[0] ?? null);
                  }}
                  className="input-apple mt-4 block w-full cursor-pointer rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[14px] text-[#0f1114] file:mr-3 file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#145b6e] file:px-3.5 file:py-1.5 file:text-[13px] file:font-semibold file:text-white"
                />

                {file && (
                  <p className="mt-2 text-[13px] font-semibold text-[#156d49]">
                    ✓ {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}

                <p className="mt-3 text-[12.5px] text-[#505660]">
                  {t.uploadLimitNote}
                </p>
              </section>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-[12px] border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] font-medium text-red-900"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="pressable inline-flex min-h-[50px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#145b6e] px-6 py-3 text-[15.5px] font-semibold text-white hover:bg-[#0e4656] disabled:opacity-60"
              >
                {submitting ? t.submittingButton : t.submitButton}
              </button>
            </form>
          </>
        )}

        <footer className="pb-6 pt-2 text-[12.5px] leading-relaxed text-[#505660]">
          {t.disclaimer}
        </footer>
      </main>
    </div>
  );
}
