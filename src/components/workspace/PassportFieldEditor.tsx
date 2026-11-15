"use client";

import React, { useMemo, useState } from "react";
import {
  BATTERY_FIELDS,
  FIELD_GROUP_META,
  WORKING_FIELD_LIST_NOTICE,
  type FieldGroupId,
} from "@/config/battery-fields";
import type { ExtractionResultMap, FieldCheckStatus } from "@/types/database";

interface PassportFieldEditorProps {
  passportId: string;
  initialProductName: string;
  initialModelCode: string;
  initialFields: Record<string, string>;
  extractionFields?: ExtractionResultMap;
  primarySaveLabel?: string;
  onSaved?: (updated: {
    productName: string;
    modelCode: string;
    workingFields: Record<string, string>;
  }) => void;
}

const GROUP_ORDER: FieldGroupId[] = ["identity", "integrity", "careRepair", "impact"];

export function PassportFieldEditor({
  passportId,
  initialProductName,
  initialModelCode,
  initialFields,
  extractionFields,
  primarySaveLabel = "Save draft fields",
  onSaved,
}: PassportFieldEditorProps) {
  const [productName, setProductName] = useState(initialProductName);
  const [modelCode, setModelCode] = useState(initialModelCode);
  const [values, setValues] = useState<Record<string, string>>(initialFields);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const summary = useMemo(() => {
    let populated = 0;
    let missing = 0;
    let uncertain = 0;
    let missingRequired = 0;

    for (const def of BATTERY_FIELDS) {
      const currentVal = (values[def.key] ?? "").trim();
      const extractedStatus: FieldCheckStatus | undefined =
        extractionFields?.[def.key]?.status;

      if (currentVal.length > 0) {
        if (extractedStatus === "uncertain" && currentVal === extractionFields?.[def.key]?.value) {
          uncertain += 1;
        } else {
          populated += 1;
        }
      } else {
        missing += 1;
        if (def.required) {
          missingRequired += 1;
        }
      }
    }

    return {
      populated,
      missing,
      uncertain,
      missingRequired,
      total: BATTERY_FIELDS.length,
    };
  }, [values, extractionFields]);

  function getFieldVisualStatus(key: string): "ok" | "uncertain" | "missing" {
    const val = (values[key] ?? "").trim();
    if (!val) return "missing";
    const meta = extractionFields?.[key];
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

    try {
      const res = await fetch(`/api/passports/${passportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim() || initialProductName,
          modelCode: modelCode.trim(),
          workingFields: values,
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
      const nextFields = json.workingFields ?? values;
      setValues(nextFields);
      setSaveMessage("Saved draft fields cleanly.");
      onSaved?.({
        productName: productName.trim() || initialProductName,
        modelCode: modelCode.trim(),
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
      {/* Completeness summary card */}
      <section
        aria-label="Completeness check summary"
        className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--well-soft)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--ink)]">
              Completeness check summary
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              {WORKING_FIELD_LIST_NOTICE}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFlaggedOnly((prev) => !prev)}
            className={`min-h-[36px] rounded-[6px] border px-3 text-[12.5px] font-semibold transition-colors cursor-pointer ${
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

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
            <dt className="text-[12px] text-[var(--muted)]">Populated</dt>
            <dd className="num mt-0.5 text-[20px] font-semibold text-[var(--positive)]">
              {summary.populated}
              <span className="text-[13px] font-normal text-[var(--muted)]">
                {" "}
                / {summary.total}
              </span>
            </dd>
          </div>
          <div className="rounded-[8px] border border-red-300 bg-red-50 px-3 py-2.5">
            <dt className="text-[12px] text-red-900">Missing</dt>
            <dd className="num mt-0.5 text-[20px] font-semibold text-red-800">
              {summary.missing}
            </dd>
          </div>
          <div className="rounded-[8px] border border-red-300 bg-red-50 px-3 py-2.5">
            <dt className="text-[12px] text-red-900">Uncertain</dt>
            <dd className="num mt-0.5 text-[20px] font-semibold text-red-800">
              {summary.uncertain}
            </dd>
          </div>
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
            <dt className="text-[12px] text-[var(--muted)]">Missing required</dt>
            <dd className="num mt-0.5 text-[20px] font-semibold text-[var(--ink)]">
              {summary.missingRequired}
            </dd>
          </div>
        </dl>
      </section>

      {/* Product title & model code */}
      <section className="grid grid-cols-1 gap-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
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

      {/* Field groups */}
      {GROUP_ORDER.map((groupId) => {
        const groupMeta = FIELD_GROUP_META[groupId];
        const fieldsInGroup = BATTERY_FIELDS.filter((f) => {
          if (f.group !== groupId) return false;
          if (!flaggedOnly) return true;
          return getFieldVisualStatus(f.key) !== "ok";
        });

        if (fieldsInGroup.length === 0) return null;

        return (
          <section
            key={groupId}
            className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
          >
            <div className="border-b border-[var(--rule)] pb-3">
              <h3 className="text-[16px] font-semibold text-[var(--ink)]">
                {groupMeta.title}
              </h3>
              <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                {groupMeta.subtitle}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {fieldsInGroup.map((field) => {
                const status = getFieldVisualStatus(field.key);
                const isFlagged = status === "missing" || status === "uncertain";
                const extractionMeta = extractionFields?.[field.key];
                const inputId = `field-${field.key}`;

                return (
                  <div
                    key={field.key}
                    className={`rounded-[8px] border p-3.5 ${
                      isFlagged
                        ? "border-red-500 bg-red-50/60"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    } ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <label
                        htmlFor={inputId}
                        className="text-[13.5px] font-semibold text-[var(--ink)]"
                      >
                        {field.label}
                        {field.unit && (
                          <span className="ml-1 font-mono text-[12px] font-normal text-[var(--muted)]">
                            ({field.unit})
                          </span>
                        )}
                      </label>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                        {field.required && (
                          <span className="rounded bg-[var(--well)] px-1.5 py-0.5 text-[var(--ink)]">
                            Required
                          </span>
                        )}
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            field.tier === "restricted"
                              ? "border border-[var(--border-strong)] bg-[var(--well-soft)] text-[var(--muted)]"
                              : "border border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]"
                          }`}
                        >
                          {field.tier === "restricted" ? "Restricted" : "Public"}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            status === "ok"
                              ? "border border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]"
                              : "border border-red-400 bg-red-100 text-red-900"
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

                    {extractionMeta?.sourceSnippet && (
                      <p className="mt-1.5 truncate font-mono text-[11.5px] text-[var(--muted)]">
                        PDF snippet: &ldquo;{extractionMeta.sourceSnippet}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

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

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3">
        <p className="num text-[13px] text-[var(--muted)]">
          {summary.populated} populated · {summary.missing + summary.uncertain} flagged
        </p>
        <button
          type="submit"
          disabled={saving}
          className="pressable inline-flex min-h-[44px] items-center justify-center rounded-[8px] bg-[var(--accent-ink)] px-5 py-2 text-[14px] font-semibold text-white hover:bg-[#963103] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving..." : primarySaveLabel}
        </button>
      </div>
    </form>
  );
}
