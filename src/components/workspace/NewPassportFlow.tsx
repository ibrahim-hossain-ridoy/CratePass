"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, PdfFileIcon } from "@/components/Icons";
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

      setResult(json as ExtractApiSuccess);
    } catch {
      setErrorMsg(
        "Could not start blank passport draft. Check your connection and try again.",
      );
    } finally {
      setCreatingBlank(false);
    }
  }

  const mandatoryRatio = categoryStats.totalMandatory / 71;

  return (
    <div data-ui className="space-y-8">
      {/* Step Header Row */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-md bg-[#e6f2f5] px-2.5 py-1 text-[13px] font-semibold text-[#0b3c49]">
            {result
              ? "Step 2 of 2 · 71-Point Completeness Review"
              : "Step 1 of 2 · PDF Spec Intake"}
          </span>
          <h1 className="text-title-page mt-2 text-[#0f1114]">
            New Battery Passport
          </h1>
          <p className="mt-1 text-[14.5px] text-[#4b4f57]">
            {WORKING_FIELD_LIST_NOTICE}
          </p>
        </div>

        <div className="rounded-[12px] bg-[#f4f4f2] px-4 py-2.5 text-[13.5px]">
          <span className="text-[#4b4f57]">Org daily PDF cap: </span>
          <span className="num font-semibold text-[#0f1114]">
            {usedCount} / {dailyLimit}
          </span>
        </div>
      </div>

      {!result && (
        <form
          onSubmit={handleUpload}
          className="space-y-6 rounded-[20px] bg-[#f4f4f2] p-6 sm:p-8"
        >
          {/* Battery Category Selector (LMT default) */}
          <div>
            <label className="font-display block text-[17px] font-semibold text-[#0f1114]">
              1. Select battery category (Regulation (EU) 2023/1542 Annex XIII)
            </label>
            <div
              role="radiogroup"
              aria-label="Battery category"
              className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-3"
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
                    className={`pressable flex cursor-pointer flex-col items-start rounded-[14px] p-4 text-left transition-colors ${
                      selected
                        ? "bg-[#101214] text-white"
                        : "bg-white text-[#0f1114] hover:bg-[#e8e7e3]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-display text-[16px] font-semibold">
                        {cat.label}
                      </span>
                      {cat.id === "LMT" && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[12px] font-semibold ${
                            selected
                              ? "bg-[#3eb8cf] text-[#08181d]"
                              : "bg-[#e6f2f5] text-[#0b3c49]"
                          }`}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[13.5px] leading-snug ${
                        selected ? "text-[#c4c8d0]" : "text-[#4b4f57]"
                      }`}
                    >
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Animated Category Mandatory Point Bar */}
            <div className="mt-4 rounded-[14px] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                <span className="text-[#22252a]">
                  Category <strong>{batteryCategory}</strong> activates{" "}
                  <strong className="num text-[#145b6e]">
                    {categoryStats.totalMandatory}
                  </strong>{" "}
                  mandatory Annex XIII points (
                  <span className="num font-semibold text-[#156d49]">
                    {categoryStats.reqPublic} public
                  </span>{" "}
                  ·{" "}
                  <span className="num font-semibold text-[#0b3c49]">
                    {categoryStats.reqLegit} legitimate interest
                  </span>{" "}
                  ·{" "}
                  <span className="num font-semibold text-[#7c380b]">
                    {categoryStats.reqAuth} authorities only
                  </span>
                  )
                </span>
                <span className="num font-semibold text-[#145b6e]">
                  {categoryStats.totalMandatory} / 71 points
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#e8e7e3]">
                <div
                  style={{ transform: `scaleX(${mandatoryRatio})` }}
                  className="progress-fill-smooth h-full w-full rounded-full bg-[#145b6e]"
                />
              </div>
            </div>
          </div>

          {/* Product Identification Overrides */}
          <div>
            <p className="font-display text-[17px] font-semibold text-[#0f1114]">
              2. Product label &amp; model code
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="new-product-name"
                  className="block text-[14px] font-semibold text-[#0f1114]"
                >
                  Product name (optional override)
                </label>
                <input
                  id="new-product-name"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Alpine 36V-504 Downtube Pack"
                  className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-white px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-model-code"
                  className="block text-[14px] font-semibold text-[#0f1114]"
                >
                  Model / SKU code (optional)
                </label>
                <input
                  id="new-model-code"
                  type="text"
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  placeholder="e.g. LMT-48V-14AH-PRO"
                  className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-white px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57]"
                />
              </div>
            </div>
          </div>

          {/* Interactive PDF Intake Dropzone */}
          <div>
            <label
              htmlFor="spec-pdf-file"
              className="font-display block text-[17px] font-semibold text-[#0f1114]"
            >
              3. Battery datasheet PDF (max {maxUploadMb} MB)
            </label>

            <div className="relative mt-3 overflow-hidden rounded-[14px] bg-white p-5">
              {uploading && (
                <div
                  aria-hidden="true"
                  className="pdf-scan-beam pointer-events-none absolute inset-x-0 top-2 h-0.5 bg-[#145b6e]"
                />
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f2f5] text-[#145b6e]">
                    <PdfFileIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[#0f1114]">
                      {file ? file.name : "Choose an OEM battery specification PDF"}
                    </p>
                    <p className="text-[13.5px] text-[#4b4f57]">
                      {file
                        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for magic-byte check & extraction`
                        : "Supports cell, BMS, or pack datasheets up to 10 MB"}
                    </p>
                  </div>
                </div>
              </div>

              <input
                id="spec-pdf-file"
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={(e) => {
                  setErrorMsg(null);
                  setFile(e.target.files?.[0] ?? null);
                }}
                data-ui className="input-apple mt-4 block w-full cursor-pointer rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[14px] text-[#0f1114] file:mr-3 file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#145b6e] file:px-3.5 file:py-1.5 file:text-[13.5px] file:font-semibold file:text-white"
              />

              <p className="mt-3 text-[13px] leading-relaxed text-[#4b4f57]">
                Stored privately in your organization bucket. Text is extracted and
                parsed strictly as untrusted datasheet data; no compliance
                verification is implied.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="tab-panel-enter rounded-[12px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-900"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="submit"
              disabled={uploading || creatingBlank || usedCount >= dailyLimit}
              className="pressable inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0e4656] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {uploading
                  ? "Extracting datasheet fields..."
                  : usedCount >= dailyLimit
                    ? `Daily limit reached (${dailyLimit}/day)`
                    : "Upload PDF & run completeness check"}
              </span>
              {!uploading && <ArrowRightIcon className="btn-arrow h-4 w-4" />}
            </button>

            <button
              type="button"
              disabled={uploading || creatingBlank}
              onClick={handleStartBlankDraft}
              className="pressable inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-[10px] bg-white px-5 py-3 text-[14.5px] font-semibold text-[#0f1114] transition-colors hover:bg-[#e8e7e3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingBlank
                ? "Creating blank draft..."
                : "No PDF? Start blank passport draft"}
            </button>
          </div>

          <p className="text-[13px] text-[#4b4f57]">
            Starting a blank passport draft makes zero LLM calls, does not count
            against your daily PDF extraction cap, and opens the same completeness
            check and field editor.
          </p>
        </form>
      )}

      {result && (
        <div className="tab-panel-enter space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] bg-[#edf8f2] p-5 text-[14px] text-[#156d49]">
            <div>
              <p className="font-display text-[17px] font-semibold">
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
              <p className="mt-1 text-[13.5px]">
                Extractor mode: <code>{result.extraction.usage.model}</code> ·
                Flagged cards below mark missing required or uncertain static
                fields for manual input.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/app/passports/${result.passportId}`)}
              className="pressable inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-[10px] bg-white px-4 text-[13.5px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
            >
              <span>Skip to Review &amp; Publish</span>
              <ArrowRightIcon className="btn-arrow h-4 w-4" />
            </button>
          </div>

          {result.lowTextWarning && (
            <div
              role="status"
              className="rounded-[12px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-900"
            >
              Very little selectable text was found in this PDF (it may be scanned
              images). Fill in the flagged fields manually below before publishing.
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
