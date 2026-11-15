"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PassportFieldEditor } from "./PassportFieldEditor";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import type { ExtractionResultMap } from "@/types/database";

interface NewPassportFlowProps {
  dailyUsed: number;
  dailyLimit: number;
  maxUploadMb: number;
}

interface ExtractApiSuccess {
  passportId: string;
  slug: string;
  productName: string;
  modelCode: string;
  totalPages: number;
  characterCount: number;
  truncated: boolean;
  lowTextWarning: boolean;
  dailyExtractionsUsed: number;
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
  const [usedCount, setUsedCount] = useState(dailyUsed);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractApiSuccess | null>(null);

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
      if (productName.trim()) {
        formData.append("productName", productName.trim());
      }

      const res = await fetch("/api/passports/extract", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as Partial<ExtractApiSuccess> & { error?: string };

      if (!res.ok || !json.passportId) {
        setErrorMsg(json.error || "PDF upload or extraction failed.");
        return;
      }

      setUsedCount(json.dailyExtractionsUsed ?? usedCount + 1);
      setResult(json as ExtractApiSuccess);
    } catch {
      setErrorMsg("Upload failed before finishing. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--rule)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12.5px] font-medium text-[var(--muted)]">
            Step 1 of 2 · PDF Spec Intake
          </p>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
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
          className="space-y-5 rounded-[10px] border border-[var(--border)] bg-[var(--well-soft)] p-5 sm:p-6"
        >
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
              Stored privately in your organization bucket. Text is extracted and parsed
              strictly as untrusted datasheet data; no compliance verification is implied.
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

          <button
            type="submit"
            disabled={uploading || usedCount >= dailyLimit}
            className="pressable inline-flex min-h-[44px] items-center justify-center rounded-[8px] bg-[var(--accent-ink)] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#963103] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {uploading
              ? "Extracting datasheet fields..."
              : usedCount >= dailyLimit
                ? `Daily limit reached (${dailyLimit}/day)`
                : "Upload PDF & run completeness check"}
          </button>
        </form>
      )}

      {result && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--positive-border)] bg-[var(--positive-bg)] px-4 py-3 text-[13.5px] text-[var(--positive)]">
            <div>
              <p className="font-semibold">
                Draft created · {result.totalPages} page(s),{" "}
                <span className="num">{result.characterCount}</span> extracted characters
              </p>
              <p className="text-[12.5px]">
                Extractor mode: <code className="font-mono">{result.extraction.usage.model}</code> ·
                Red boxes below mark missing or uncertain fields for manual input.
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
              Very little selectable text was found in this PDF (it may be scanned images).
              Fill in the red boxes manually below before publishing.
            </div>
          )}

          <PassportFieldEditor
            passportId={result.passportId}
            initialProductName={result.productName}
            initialModelCode={result.modelCode}
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
