"use client";

import React, { useMemo, useState } from "react";
import {
  BATTERY_CATEGORIES,
  DYNAMIC_BMS_FIELDS,
  DYNAMIC_BMS_NOTICE,
  FIELD_GROUP_META,
  OFFICIAL_71_FIELDS,
  RESTRICTED_TIER_NOTICE,
  STATIC_BATTERY_FIELDS,
  WORKING_FIELD_LIST_NOTICE,
  isFieldRequiredForCategory,
  isStaticBlockingFieldForCategory,
  type BatteryCategory,
  type BatteryFieldDefinition,
  type FieldAccessTier,
  type FieldGroupId,
} from "@/config/battery-fields";
import type { ExtractionResultMap, FieldCheckStatus } from "@/types/database";

interface PassportFieldEditorProps {
  passportId: string;
  initialProductName: string;
  initialModelCode: string;
  initialBatteryCategory?: BatteryCategory;
  initialFields: Record<string, string>;
  extractionFields?: ExtractionResultMap;
  primarySaveLabel?: string;
  onSaved?: (updated: {
    productName: string;
    modelCode: string;
    batteryCategory: BatteryCategory;
    workingFields: Record<string, string>;
  }) => void;
}

const GROUP_ORDER: FieldGroupId[] = [
  "identity",
  "integrity",
  "careRepair",
  "impact",
];

function TierBadge({ tier }: { tier: FieldAccessTier }) {
  if (tier === "public") {
    return (
      <span className="rounded border border-[var(--positive-border)] bg-[var(--positive-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--positive)]">
        Public
      </span>
    );
  }
  if (tier === "authorities_only") {
    return (
      <span className="rounded border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
        Authorities only
      </span>
    );
  }
  return (
    <span className="rounded border border-[var(--accent-border)] bg-[var(--accent-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--accent-ink)]">
      Legitimate interest
    </span>
  );
}

export function PassportFieldEditor({
  passportId,
  initialProductName,
  initialModelCode,
  initialBatteryCategory = "LMT",
  initialFields,
  extractionFields,
  primarySaveLabel = "Save draft fields",
  onSaved,
}: PassportFieldEditorProps) {
  const [productName, setProductName] = useState(initialProductName);
  const [modelCode, setModelCode] = useState(initialModelCode);
  const [batteryCategory, setBatteryCategory] = useState<BatteryCategory>(
    initialBatteryCategory,
  );
  const [values, setValues] = useState<Record<string, string>>(initialFields);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const summary = useMemo(() => {
    let populatedStatic = 0;
    let missingStatic = 0;
    let uncertainStatic = 0;
    let missingRequiredStatic = 0;
    let populatedRequiredStatic = 0;
    let totalRequiredStatic = 0;

    for (const def of STATIC_BATTERY_FIELDS) {
      const currentVal = (values[def.key] ?? "").trim();
      const extractedStatus: FieldCheckStatus | undefined =
        extractionFields?.[def.key]?.status;
      const isReqStatic = isStaticBlockingFieldForCategory(
        def,
        batteryCategory,
      );

      if (isReqStatic) {
        totalRequiredStatic += 1;
      }

      if (currentVal.length > 0) {
        if (
          extractedStatus === "uncertain" &&
          currentVal === extractionFields?.[def.key]?.value
        ) {
          uncertainStatic += 1;
        } else {
          populatedStatic += 1;
        }
        if (isReqStatic) {
          populatedRequiredStatic += 1;
        }
      } else {
        missingStatic += 1;
        if (isReqStatic) {
          missingRequiredStatic += 1;
        }
      }
    }

    const mandatoryOfficialForCategory = OFFICIAL_71_FIELDS.filter((f) =>
      isFieldRequiredForCategory(f, batteryCategory),
    );
    const mandatoryPublicForCategory = mandatoryOfficialForCategory.filter(
      (f) => f.tier === "public",
    ).length;
    const mandatoryLegitForCategory = mandatoryOfficialForCategory.filter(
      (f) => f.tier === "legitimate_interest",
    ).length;
    const mandatoryAuthForCategory = mandatoryOfficialForCategory.filter(
      (f) => f.tier === "authorities_only",
    ).length;

    return {
      populatedStatic,
      missingStatic,
      uncertainStatic,
      missingRequiredStatic,
      populatedRequiredStatic,
      totalRequiredStatic,
      totalStatic: STATIC_BATTERY_FIELDS.length,
      mandatoryTotal71: mandatoryOfficialForCategory.length,
      mandatoryPublicForCategory,
      mandatoryLegitForCategory,
      mandatoryAuthForCategory,
    };
  }, [values, extractionFields, batteryCategory]);

  function getFieldVisualStatus(
    field: BatteryFieldDefinition,
  ): "ok" | "uncertain" | "missing" | "dynamic" {
    if (field.source === "dynamic") {
      const val = (values[field.key] ?? "").trim();
      return val ? "ok" : "dynamic";
    }
    const val = (values[field.key] ?? "").trim();
    if (!val) return "missing";
    const meta = extractionFields?.[field.key];
    if (meta?.status === "uncertain" && val === meta.value) {
      return "uncertain";
    }
    return "ok";
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    const updatedWorkingFields = {
      ...values,
      battery_category: batteryCategory,
    };

    try {
      const res = await fetch(`/api/passports/${passportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim() || initialProductName,
          modelCode: modelCode.trim(),
          batteryCategory,
          workingFields: updatedWorkingFields,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        workingFields?: Record<string, string>;
      };
      if (!res.ok) {
        setSaveError(json.error || "Could not save field updates.");
        return;
      }
      const nextFields = json.workingFields ?? updatedWorkingFields;
      setValues(nextFields);
      setSaveMessage("Saved draft fields cleanly.");
      onSaved?.({
        productName: productName.trim() || initialProductName,
        modelCode: modelCode.trim(),
        batteryCategory,
        workingFields: nextFields,
      });
    } catch {
      setSaveError("Network error saving fields. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Completeness summary + Battery Category Selector */}
      <section
        aria-label="Completeness check summary"
        className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--well-soft)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold text-[var(--ink)]">
              Completeness check summary (71-point Annex XIII schema)
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              {WORKING_FIELD_LIST_NOTICE}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFlaggedOnly((prev) => !prev)}
            className={`min-h-[38px] rounded-[8px] border px-3 text-[12.5px] font-semibold transition-colors cursor-pointer ${
              flaggedOnly
                ? "border-red-500 bg-red-50 text-red-900"
                : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]"
            }`}
          >
            {flaggedOnly
              ? "Showing missing & uncertain"
              : "Filter: missing & uncertain"}
          </button>
        </div>

        {/* Category selector bar */}
        <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-bold text-[var(--ink)]">
                Battery category ({batteryCategory})
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                <span className="num font-semibold text-[var(--ink)]">
                  {summary.mandatoryTotal71}
                </span>{" "}
                mandatory Annex XIII points for {batteryCategory} (
                <span className="num">{summary.mandatoryPublicForCategory}</span>{" "}
                public ·{" "}
                <span className="num">{summary.mandatoryLegitForCategory}</span>{" "}
                legitimate interest ·{" "}
                <span className="num">{summary.mandatoryAuthForCategory}</span>{" "}
                authorities only)
              </p>
            </div>

            <div
              role="group"
              aria-label="Battery category selector"
              className="inline-flex rounded-[8px] border border-[var(--border-strong)] bg-[var(--well-soft)] p-1"
            >
              {BATTERY_CATEGORIES.map((cat) => {
                const active = batteryCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setBatteryCategory(cat.id);
                      setValues((prev) => ({
                        ...prev,
                        battery_category: cat.id,
                      }));
                    }}
                    className={`min-h-[36px] rounded-[6px] px-3 text-[12.5px] font-bold transition-colors cursor-pointer ${
                      active
                        ? "bg-[#0B1016] text-white"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {cat.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
            <dt className="text-[12px] text-[var(--muted)]">
              Static populated
            </dt>
            <dd className="num mt-0.5 text-[20px] font-bold text-[var(--positive)]">
              {summary.populatedStatic}
              <span className="text-[13px] font-normal text-[var(--muted)]">
                {" "}
                / {summary.totalStatic}
              </span>
            </dd>
          </div>
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
            <dt className="text-[12px] text-[var(--muted)]">
              Required for {batteryCategory} (static)
            </dt>
            <dd className="num mt-0.5 text-[20px] font-bold text-[var(--ink)]">
              {summary.populatedRequiredStatic}
              <span className="text-[13px] font-normal text-[var(--muted)]">
                {" "}
                / {summary.totalRequiredStatic}
              </span>
            </dd>
          </div>
          <div className="rounded-[8px] border border-red-300 bg-red-50 px-3 py-2.5">
            <dt className="text-[12px] text-red-900">
              Missing required ({batteryCategory})
            </dt>
            <dd className="num mt-0.5 text-[20px] font-bold text-red-800">
              {summary.missingRequiredStatic}
            </dd>
          </div>
          <div className="rounded-[8px] border border-red-300 bg-red-50 px-3 py-2.5">
            <dt className="text-[12px] text-red-900">Uncertain</dt>
            <dd className="num mt-0.5 text-[20px] font-bold text-red-800">
              {summary.uncertainStatic}
            </dd>
          </div>
        </dl>

        <p className="mt-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--muted)]">
          <strong className="font-semibold text-[var(--ink)]">
            3-Tier Access Notice:
          </strong>{" "}
          {RESTRICTED_TIER_NOTICE}
        </p>
      </section>

      {/* Product title & model code */}
      <section className="grid grid-cols-1 gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="editor-product-name"
            className="block text-[13px] font-semibold text-[var(--ink)]"
          >
            Product title (workspace label)
          </label>
          <input
            id="editor-product-name"
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="mt-1.5 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="editor-model-code"
            className="block text-[13px] font-semibold text-[var(--ink)]"
          >
            Model SKU / code
          </label>
          <input
            id="editor-model-code"
            type="text"
            value={modelCode}
            onChange={(e) => setModelCode(e.target.value)}
            className="mt-1.5 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 font-mono text-[13.5px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </section>

      {/* Collapsible Static Field Groups (Points 1–50 + additional_information) */}
      {GROUP_ORDER.map((groupId) => {
        const groupMeta = FIELD_GROUP_META[groupId];
        const staticGroupFields = STATIC_BATTERY_FIELDS.filter(
          (f) => f.group === groupId,
        );
        const populatedInGroup = staticGroupFields.filter(
          (f) => Boolean((values[f.key] ?? "").trim()),
        ).length;

        // Sort "Required for [Category]" fields first inside each group
        const sortedFields = [...staticGroupFields]
          .sort((a, b) => {
            const aReq = isFieldRequiredForCategory(a, batteryCategory) ? 0 : 1;
            const bReq = isFieldRequiredForCategory(b, batteryCategory) ? 0 : 1;
            if (aReq !== bReq) return aReq - bReq;
            return (a.pointNumber ?? 999) - (b.pointNumber ?? 999);
          })
          .filter((f) => {
            if (!flaggedOnly) return true;
            return getFieldVisualStatus(f) !== "ok";
          });

        if (sortedFields.length === 0) return null;

        return (
          <details
            key={groupId}
            open
            className="group rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)]"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] bg-[var(--well-soft)] px-4 py-3.5 sm:px-5">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--ink)]">
                  {groupMeta.title}
                </h3>
                <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                  {groupMeta.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="num rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[12px] font-bold text-[var(--ink)]">
                  {populatedInGroup} / {staticGroupFields.length} populated
                </span>
              </div>
            </summary>

            <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">
              {sortedFields.map((field) => {
                const status = getFieldVisualStatus(field);
                const isReqForCat = isFieldRequiredForCategory(
                  field,
                  batteryCategory,
                );
                const isFlagged =
                  (status === "missing" && isReqForCat) ||
                  status === "uncertain";
                const extractionMeta = extractionFields?.[field.key];
                const inputId = `field-${field.key}`;
                const isRestrictedTier = field.tier !== "public";

                return (
                  <div
                    key={field.key}
                    className={`rounded-[10px] border p-3.5 ${
                      isFlagged
                        ? "border-red-500 bg-red-50/60"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    } ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <label
                          htmlFor={inputId}
                          className="text-[13.5px] font-bold text-[var(--ink)]"
                        >
                          {field.pointNumber ? `#${field.pointNumber} · ` : ""}
                          {field.label}
                          {field.unit && (
                            <span className="ml-1 font-mono text-[12px] font-normal text-[var(--muted)]">
                              ({field.unit})
                            </span>
                          )}
                        </label>
                        <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]">
                          {field.annexRef}
                          {field.enforcementNote
                            ? ` · ${field.enforcementNote}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                        {isReqForCat ? (
                          <span className="rounded bg-[#0B1016] px-2 py-0.5 font-semibold text-white">
                            Required for {batteryCategory}
                          </span>
                        ) : (
                          <span className="rounded bg-[var(--well)] px-2 py-0.5 text-[var(--muted)]">
                            Optional / Postponed for {batteryCategory}
                          </span>
                        )}
                        <TierBadge tier={field.tier} />
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            status === "ok"
                              ? "border border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]"
                              : isFlagged
                                ? "border border-red-400 bg-red-100 text-red-900"
                                : "border border-[var(--border)] bg-[var(--well-soft)] text-[var(--muted)]"
                          }`}
                        >
                          {status === "ok"
                            ? "Found"
                            : status === "uncertain"
                              ? "Uncertain"
                              : "Missing"}
                        </span>
                      </div>
                    </div>

                    {field.type === "textarea" ? (
                      <textarea
                        id={inputId}
                        rows={2}
                        maxLength={field.maxChars ?? 4000}
                        value={values[field.key] ?? ""}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder ?? ""}
                        className={`mt-2 w-full rounded-[6px] border bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none ${
                          isFlagged
                            ? "border-red-400 focus:border-red-600"
                            : "border-[var(--border-strong)] focus:border-[var(--accent)]"
                        }`}
                      />
                    ) : (
                      <input
                        id={inputId}
                        type="text"
                        inputMode={field.type === "number" ? "decimal" : "text"}
                        value={values[field.key] ?? ""}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder ?? ""}
                        className={`mt-2 w-full rounded-[6px] border bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none ${
                          isFlagged
                            ? "border-red-400 focus:border-red-600"
                            : "border-[var(--border-strong)] focus:border-[var(--accent)]"
                        }`}
                      />
                    )}

                    {isRestrictedTier && (
                      <p className="mt-1.5 text-[11.5px] font-medium text-[var(--accent-ink)]">
                        {RESTRICTED_TIER_NOTICE}
                      </p>
                    )}

                    {extractionMeta?.sourceSnippet && (
                      <p className="mt-1 truncate font-mono text-[11.5px] text-[var(--muted)]">
                        PDF snippet: &ldquo;{extractionMeta.sourceSnippet}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}

      {/* Collapsible Dynamic BMS Telemetry Section (Points 51–71) */}
      <details className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)]">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] bg-[var(--well-soft)] px-4 py-3.5 sm:px-5">
          <div>
            <h3 className="text-[16px] font-bold text-[var(--ink)]">
              Dynamic BMS &amp; In-Service Telemetry (Points 51–71)
            </h3>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              {DYNAMIC_BMS_NOTICE} · Never counted as blocking for PDF extraction
              or initial publication
            </p>
          </div>
          <span className="num rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[12px] font-bold text-[var(--muted)]">
            {
              DYNAMIC_BMS_FIELDS.filter((f) =>
                Boolean((values[f.key] ?? "").trim()),
              ).length
            }{" "}
            / {DYNAMIC_BMS_FIELDS.length} populated
          </span>
        </summary>

        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">
          {DYNAMIC_BMS_FIELDS.map((field) => {
            const inputId = `field-${field.key}`;
            return (
              <div
                key={field.key}
                className="rounded-[10px] border border-[var(--border)] bg-[var(--well-soft)]/50 p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <label
                      htmlFor={inputId}
                      className="text-[13.5px] font-bold text-[var(--ink)]"
                    >
                      #{field.pointNumber} · {field.label}
                      {field.unit && (
                        <span className="ml-1 font-mono text-[12px] font-normal text-[var(--muted)]">
                          ({field.unit})
                        </span>
                      )}
                    </label>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]">
                      {field.annexRef}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-0.5 font-semibold text-[var(--muted)]">
                      {DYNAMIC_BMS_NOTICE}
                    </span>
                    <TierBadge tier={field.tier} />
                  </div>
                </div>

                <input
                  id={inputId}
                  type="text"
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={DYNAMIC_BMS_NOTICE}
                  className="mt-2 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:outline-none"
                />
                <p className="mt-1.5 text-[11.5px] text-[var(--muted)]">
                  {RESTRICTED_TIER_NOTICE}
                </p>
              </div>
            );
          })}
        </div>
      </details>

      {saveError && (
        <div
          role="alert"
          className="rounded-[8px] border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] text-red-900"
        >
          {saveError}
        </div>
      )}

      {saveMessage && (
        <div
          role="status"
          className="rounded-[8px] border border-[var(--positive-border)] bg-[var(--positive-bg)] px-4 py-3 text-[13.5px] text-[var(--positive)]"
        >
          {saveMessage}
        </div>
      )}

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#233242] bg-[#0B1016] px-4 py-3 text-white">
        <p className="num font-mono text-[13px] text-[#CBD5E1]">
          {summary.populatedRequiredStatic} / {summary.totalRequiredStatic}{" "}
          required static fields for {batteryCategory} ·{" "}
          {summary.missingRequiredStatic + summary.uncertainStatic} flagged
        </p>
        <button
          type="submit"
          disabled={saving}
          className="pressable chamfer-sm inline-flex min-h-[44px] items-center justify-center bg-[#2FD99B] px-5 py-2 text-[14px] font-bold text-[#052E16] hover:bg-[#6EE7B7] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving..." : primarySaveLabel}
        </button>
      </div>
    </form>
  );
}
