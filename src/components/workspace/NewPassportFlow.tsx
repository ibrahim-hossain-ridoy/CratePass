"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PassportFieldEditor } from "./PassportFieldEditor";
import {
  BATTERY_CATEGORIES,
  OFFICIAL_71_FIELDS,
  WORKING_FIELD_LIST_NOTICE,
  isFieldRequiredForCategory,
  type BatteryCategory,
} from "@/config/battery-fields";
import type { ExtractionResultMap } from "@/types/database";

interface NewPassportFlowProps {
  dailyUsed: number;
  dailyLimit: number;
  maxUploadMb: number;
}

interface ExtractApiSuccess {
  passportId: string;
  slug: string;
  batteryCategory: BatteryCategory;
  productName: string;
  modelCode: string;
  totalPages: number;
  characterCount: number;
  truncated: boolean;
  lowTextWarning: boolean;
  blankDraft?: boolean;
  dailyExtractionsUsed?: number;
  extraction: {
    fields: ExtractionResultMap;
    summary: { found: number; missing: number; uncertain: number; total: number };
    usage: { mode: string; model: string; inputTokens: number; outputTokens: number };
  };
  workingFields: Record<string, string>;
}

export function NewPassportFlow({
  dailyUsed,
  dailyLimit,
  maxUploadMb,
}: NewPassportFlowProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [productName, setProductName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [batteryCategory, setBatteryCategory] = useState<BatteryCategory>("LMT");
  const [usedCount, setUsedCount] = useState(dailyUsed);
  const [uploading, setUploading] = useState(false);
  const [creatingBlank, setCreatingBlank] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractApiSuccess | null>(null);

  const categoryStats = useMemo(() => {
    const reqAll = OFFICIAL_71_FIELDS.filter((f) =>
      isFieldRequiredForCategory(f, batteryCategory),
    );
    const reqPublic = reqAll.filter((f) => f.tier === "public").length;
    const reqLegit = reqAll.filter(
      (f) => f.tier === "legitimate_interest",
    ).length;
    const reqAuth = reqAll.filter((f) => f.tier === "authorities_only").length;
    return {
      totalMandatory: reqAll.length,
      reqPublic,
      reqLegit,
      reqAuth,
    };
  }, [batteryCategory]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    if (!file) {
      setErrorMsg("Select a battery spec PDF first.");
      return;
    }

    const maxBytes = maxUploadMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`File exceeds the ${maxUploadMb} MB upload limit.`);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Only PDF files (.pdf) are supported.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("batteryCategory", batteryCategory);
      if (productName.trim()) {
        formData.append("productName", productName.trim());
      }

      const res = await fetch("/api/passports/extract", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as Partial<ExtractApiSuccess> & {
        error?: string;
      };

      if (!res.ok || !json.passportId) {
        setErrorMsg(json.error || "PDF upload or extraction failed.");
        return;
      }

      setUsedCount(json.dailyExtractionsUsed ?? usedCount + 1);
      setResult(json as ExtractApiSuccess);
    } catch {
      setErrorMsg(
        "Upload failed before finishing. Check your connection and try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleStartBlankDraft() {
    setErrorMsg(null);
    setCreatingBlank(true);
    try {
      const res = await fetch("/api/passports/blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batteryCategory,
          productName: productName.trim() || undefined,
          modelCode: modelCode.trim() || undefined,
        }),
      });
      const json = (await res.json()) as Partial<ExtractApiSuccess> & {
        error?: string;
      };

      if (!res.ok || !json.passportId) {
        setErrorMsg(json.error || "Could not create blank passport draft.");
        return;
      }

      // Blank drafts make 0 LLM calls and do not consume the org daily extraction cap
      setResult(json as ExtractApiSuccess);
    } catch {
      setErrorMsg(
        "Could not start blank passport draft. Check your connection and try again.",
      );
    } finally {
      setCreatingBlank(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--rule)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12.5px] font-medium text-[var(--muted)]">
            Step 1 of 2 · PDF Spec Intake
          </p>
          <h1 className="mt-0.5 text-[24px] font-bold tracking-[-0.02em] text-[var(--ink)]">
            New Battery Passport
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--muted)]">
            {WORKING_FIELD_LIST_NOTICE}
          </p>
        </div>

        <div className="rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] px-3 py-1.5 text-[12.5px]">
          <span className="text-[var(--muted)]">Org daily PDF cap </span>
          <span className="num font-semibold text-[var(--ink)]">
            {usedCount} / {dailyLimit}
          </span>
        </div>
      </div>

      {!result && (
        <form
          onSubmit={handleUpload}
          className="space-y-5 rounded-[12px] border border-[var(--border-strong)] bg-[var(--well-soft)] p-5 sm:p-6"
        >
          {/* Battery Category Selector (LMT default) */}
          <div>
            <label className="block text-[13px] font-bold text-[var(--ink)]">
              Battery category (Regulation (EU) 2023/1542 Annex XIII)
            </label>
            <div
              role="radiogroup"
              aria-label="Battery category"
              className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {BATTERY_CATEGORIES.map((cat) => {
                const selected = batteryCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setBatteryCategory(cat.id)}
                    className={`flex flex-col items-start rounded-[10px] border p-3.5 text-left transition-colors cursor-pointer ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--surface)] ring-2 ring-[var(--accent)]/20"
                        : "border-[var(--border-strong)] bg-[var(--surface)]/70 hover:border-[var(--ink)]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-[14px] font-bold text-[var(--ink)]">
                        {cat.label}
                      </span>
                      {cat.id === "LMT" && (
                        <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10.5px] font-bold text-[var(--accent)]">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="mt-1 text-[12px] leading-snug text-[var(--muted)]">
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12.5px] text-[var(--muted)]">
              Selected <strong className="text-[var(--ink)]">{batteryCategory}</strong>:{" "}
              <span className="num font-semibold text-[var(--ink)]">
                {categoryStats.totalMandatory}
              </span>{" "}
              mandatory Annex XIII points (
              <span className="num">{categoryStats.reqPublic}</span> public ·{" "}
              <span className="num">{categoryStats.reqLegit}</span> legitimate
              interest · <span className="num">{categoryStats.reqAuth}</span>{" "}
              authorities only). Dynamic BMS telemetry (Points 51–71) is excluded
              from PDF extraction.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-product-name"
                className="block text-[13px] font-semibold text-[var(--ink)]"
              >
                Product name (optional override)
              </label>
              <input
                id="new-product-name"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Alpine 36V-504 Downtube Pack"
                className="mt-1.5 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-model-code"
                className="block text-[13px] font-semibold text-[var(--ink)]"
              >
                Model / SKU code (optional)
              </label>
              <input
                id="new-model-code"
                type="text"
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                placeholder="e.g. LMT-48V-14AH-PRO"
                className="mt-1.5 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 font-mono text-[13.5px] text-[var(--ink)] placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="spec-pdf-file"
              className="block text-[13px] font-semibold text-[var(--ink)]"
            >
              Battery datasheet PDF (max {maxUploadMb} MB)
            </label>
            <input
              id="spec-pdf-file"
              type="file"
              accept=".pdf,application/pdf"
              required
              onChange={(e) => {
                setErrorMsg(null);
                setFile(e.target.files?.[0] ?? null);
              }}
              className="mt-1.5 block w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-3 text-[14px] text-[var(--ink)] file:mr-3 file:rounded-[6px] file:border file:border-[var(--border-strong)] file:bg-[var(--well)] file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-[var(--ink)] cursor-pointer"
            />
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
              Stored privately in your organization bucket. Text is extracted and
              parsed strictly as untrusted datasheet data; no compliance
              verification is implied.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-[8px] border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] text-red-900"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={uploading || creatingBlank || usedCount >= dailyLimit}
              className="pressable chamfer-sm inline-flex min-h-[46px] items-center justify-center bg-[var(--accent)] px-6 py-2.5 text-[14.5px] font-bold text-white hover:bg-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {uploading
                ? "Extracting datasheet fields..."
                : usedCount >= dailyLimit
                  ? `Daily limit reached (${dailyLimit}/day)`
                  : "Upload PDF & run completeness check"}
            </button>

            <button
              type="button"
              disabled={uploading || creatingBlank}
              onClick={handleStartBlankDraft}
              className="pressable inline-flex min-h-[46px] items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--well)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {creatingBlank
                ? "Creating blank draft..."
                : "No PDF? Start blank passport draft"}
            </button>
          </div>
          <p className="text-[12px] text-[var(--muted)]">
            Starting a blank passport draft makes zero LLM calls, does not count
            against your daily PDF extraction cap, and opens the same completeness
            check and field editor.
          </p>
        </form>
      )}

      {result && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--positive-border)] bg-[var(--positive-bg)] px-4 py-3 text-[13.5px] text-[var(--positive)]">
            <div>
              <p className="font-semibold">
                {result.blankDraft ? (
                  <>
                    Blank draft created ({result.batteryCategory}) · Ready for
                    manual entry (0 PDF cap used)
                  </>
                ) : (
                  <>
                    Draft created ({result.batteryCategory}) · {result.totalPages}{" "}
                    page(s), <span className="num">{result.characterCount}</span>{" "}
                    extracted characters
                  </>
                )}
              </p>
              <p className="text-[12.5px]">
                Extractor mode:{" "}
                <code className="font-mono">{result.extraction.usage.model}</code>{" "}
                · Red boxes below mark missing required or uncertain static fields
                for manual input.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/app/passports/${result.passportId}`)}
              className="inline-flex min-h-[38px] items-center rounded-[6px] border border-[var(--positive)] bg-[var(--surface)] px-3.5 text-[13px] font-semibold text-[var(--ink)] hover:bg-[var(--well-soft)] cursor-pointer"
            >
              Skip to Review &amp; Publish
            </button>
          </div>

          {result.lowTextWarning && (
            <div
              role="status"
              className="rounded-[8px] border border-red-400 bg-red-50 px-4 py-3 text-[13.5px] text-red-900"
            >
              Very little selectable text was found in this PDF (it may be scanned
              images). Fill in the red boxes manually below before publishing.
            </div>
          )}

          <PassportFieldEditor
            passportId={result.passportId}
            initialProductName={result.productName}
            initialModelCode={result.modelCode}
            initialBatteryCategory={result.batteryCategory}
            initialFields={result.workingFields}
            extractionFields={result.extraction.fields}
            primarySaveLabel="Save fields & open Review / Publish"
            onSaved={() => {
              router.push(`/app/passports/${result.passportId}`);
            }}
          />
        </div>
      )}
    </div>
  );
}
