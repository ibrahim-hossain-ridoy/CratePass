"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { FREE_PLAN_LIMITS, type PlanId } from "@/config/plans";
import {
  UNITS_CSV_TEMPLATE,
  buildUnitPublicUrl,
  parseSerializedUnitsCsv,
  type CsvRowValidationError,
} from "@/lib/serialization/csv";
import { UpgradeModal } from "./UpgradeModal";

export interface SerializedUnitSummary {
  id: string;
  serial_number: string;
  gtin: string | null;
  batch_lot: string | null;
  manufacturing_date: string | null;
  unit_status: string;
  created_at: string;
}

interface SerializedUnitsPanelProps {
  passportId: string;
  slug: string;
  workspacePlan: PlanId;
  initialUnits: SerializedUnitSummary[];
  initialWorkspaceUnitsCount: number;
  siteOrigin: string;
}

export function SerializedUnitsPanel({
  passportId,
  slug,
  workspacePlan,
  initialUnits,
  initialWorkspaceUnitsCount,
  siteOrigin,
}: SerializedUnitsPanelProps) {
  const [units, setUnits] = useState<SerializedUnitSummary[]>(initialUnits);
  const [workspaceUnitsCount, setWorkspaceUnitsCount] = useState(
    initialWorkspaceUnitsCount,
  );
  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    CsvRowValidationError[]
  >([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeDetail, setUpgradeDetail] = useState<string | undefined>(
    undefined,
  );

  const existingSerials = useMemo(
    () => units.map((u) => u.serial_number),
    [units],
  );

  const preview = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseSerializedUnitsCsv(csvText, existingSerials);
  }, [csvText, existingSerials]);

  function handleDownloadTemplate() {
    const blob = new Blob([UNITS_CSV_TEMPLATE], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-units-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationErrors([]);
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("CSV file exceeds 2 MB limit.");
      return;
    }
    const text = await file.text();
    setCsvText(text);
  }

  async function handleImportUnits(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationErrors([]);

    if (!csvText.trim()) {
      setErrorMsg("Upload or paste a CSV file first.");
      return;
    }

    const parsedLocal = parseSerializedUnitsCsv(csvText, existingSerials);
    if (parsedLocal.validRows.length === 0) {
      setErrorMsg(
        parsedLocal.errors[0]?.message ?? "No valid unit rows found in CSV.",
      );
      setValidationErrors(parsedLocal.errors.slice(0, 15));
      return;
    }

    const freeCap = FREE_PLAN_LIMITS.maxSerializedUnits ?? 25;
    if (
      workspacePlan === "free" &&
      workspaceUnitsCount + parsedLocal.validRows.length > freeCap
    ) {
      const remaining = Math.max(0, freeCap - workspaceUnitsCount);
      setUpgradeDetail(
        `Importing ${parsedLocal.validRows.length} unit(s) exceeds the Free plan cap of ${freeCap} serialized units (${workspaceUnitsCount} used, ${remaining} remaining).`,
      );
      setUpgradeOpen(true);
      return;
    }

    setUploading(true);
    try {
      const res = await fetch(`/api/passports/${passportId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        code?: string;
        importedCount?: number;
        units?: SerializedUnitSummary[];
        validationErrors?: CsvRowValidationError[];
        workspaceUnitsCount?: number;
      };

      if (!res.ok) {
        if (res.status === 402 || json.code === "PLAN_LIMIT_REACHED") {
          setUpgradeDetail(
            json.error ||
              `Free plan includes up to ${freeCap} serialized unit QR codes.`,
          );
          setUpgradeOpen(true);
        }
        setErrorMsg(json.error || "Could not import serialized units.");
        if (json.validationErrors) {
          setValidationErrors(json.validationErrors);
        }
        return;
      }

      if (json.units && json.units.length > 0) {
        setUnits((prev) => [...json.units!, ...prev]);
      }
      if (typeof json.workspaceUnitsCount === "number") {
        setWorkspaceUnitsCount(json.workspaceUnitsCount);
      }
      if (json.validationErrors && json.validationErrors.length > 0) {
        setValidationErrors(json.validationErrors);
      }
      setCsvText("");
      setSuccessMsg(
        `Imported ${json.importedCount ?? parsedLocal.validRows.length} serialized battery unit(s). Ready for A4 PDF sheet or SVG/PNG ZIP export.`,
      );
    } catch {
      setErrorMsg("Network error importing serialized units.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteUnit(unitId: string) {
    setDeletingId(unitId);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/passports/${passportId}/units?unitId=${encodeURIComponent(unitId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setErrorMsg("Could not remove unit.");
        return;
      }
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
      setWorkspaceUnitsCount((c) => Math.max(0, c - 1));
    } catch {
      setErrorMsg("Network error removing unit.");
    } finally {
      setDeletingId(null);
    }
  }

  const freeCap = FREE_PLAN_LIMITS.maxSerializedUnits ?? 25;

  return (
    <div className="space-y-6">
      {/* Header + Export Print Actions */}
      <section className="rounded-[18px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#173038] px-2.5 py-0.5 text-[12px] font-semibold text-[#7dd3e8]">
                GS1 Digital Link · ISO/IEC 15459
              </span>
              <span className="num rounded bg-[#1d2229] px-2.5 py-0.5 text-[12px] font-semibold text-[#c4c8d0]">
                Workspace units: {workspaceUnitsCount} /{" "}
                {workspacePlan === "pro" ? "Unlimited" : freeCap}
              </span>
            </div>
            <h2 className="font-display mt-2 text-[20px] font-semibold text-white">
              Model-to-Unit Serialization &amp; Factory QR Label Sheets
            </h2>
            <p className="mt-1 max-w-[62ch] text-[13.5px] leading-relaxed text-[#c4c8d0]">
              Import serial numbers and 14-digit GTINs in bulk via CSV. Each unit
              resolves to{" "}
              <code className="text-[#3eb8cf]">/01/[gtin]/21/[serial]</code> (or{" "}
              <code className="text-[#3eb8cf]">/p/{slug}/u/[serial]</code>) with
              model static data + unit serial, batch, and lifecycle state.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`/api/passports/${passportId}/units/export?format=pdf`}
              aria-disabled={units.length === 0}
              className={`pressable inline-flex min-h-[42px] items-center justify-center rounded-[10px] bg-[#3eb8cf] px-4 py-2 text-[13.5px] font-semibold text-[#08181d] hover:bg-[#5ec8dc] ${
                units.length === 0 ? "pointer-events-none opacity-45" : ""
              }`}
            >
              Print A4 QR Sheet (PDF)
            </a>
            <a
              href={`/api/passports/${passportId}/units/export?format=zip`}
              aria-disabled={units.length === 0}
              className={`pressable inline-flex min-h-[42px] items-center justify-center rounded-[10px] bg-[#1d2229] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#2a313b] ${
                units.length === 0 ? "pointer-events-none opacity-45" : ""
              }`}
            >
              Download SVGs + PNGs (ZIP)
            </a>
          </div>
        </div>
      </section>

      {/* Bulk CSV Import Panel */}
      <form
        onSubmit={handleImportUnits}
        className="space-y-4 rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-[17px] font-semibold text-[#0f1114]">
              Bulk CSV unit import
            </h3>
            <p className="mt-0.5 text-[13.5px] text-[#505660]">
              Columns: <code>serial_number,gtin,batch_lot,manufacturing_date</code>{" "}
              (GTIN optional 14 digits; date YYYY-MM-DD).
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="pressable inline-flex min-h-[38px] shrink-0 cursor-pointer items-center rounded-[9px] bg-white px-3.5 text-[13px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
          >
            Download CSV template
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <label
              htmlFor="units-csv-file"
              className="block text-[13px] font-semibold text-[#0f1114]"
            >
              Upload .csv file
            </label>
            <input
              id="units-csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="input-apple block w-full cursor-pointer rounded-[10px] border border-[#dcdad4] bg-white px-3 py-2 text-[13.5px] text-[#0f1114] file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-[#145b6e] file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-white"
            />
            {preview && (
              <div className="rounded-[12px] bg-white p-3.5 text-[13px]">
                <p className="font-semibold text-[#0f1114]">
                  CSV validation preview
                </p>
                <p className="mt-1 text-[#156d49]">
                  Valid new units ready:{" "}
                  <strong className="num">{preview.validRows.length}</strong>
                </p>
                {preview.errors.length > 0 && (
                  <p className="mt-0.5 text-red-800">
                    Rows flagged:{" "}
                    <strong className="num">{preview.errors.length}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <label
              htmlFor="units-csv-textarea"
              className="block text-[13px] font-semibold text-[#0f1114]"
            >
              Or paste CSV rows directly
            </label>
            <textarea
              id="units-csv-textarea"
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={UNITS_CSV_TEMPLATE}
              className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-white px-3.5 py-2.5 font-mono text-[12.5px] text-[#0f1114]"
            />
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-900"
          >
            <p>{errorMsg}</p>
            {validationErrors.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12px]">
                {validationErrors.slice(0, 8).map((err, idx) => (
                  <li key={`${err.line}-${idx}`}>
                    Line {err.line}: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="rounded-[10px] border border-[#9fd4b9] bg-[#edf8f2] px-4 py-3 text-[13px] font-medium text-[#156d49]"
          >
            {successMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !csvText.trim()}
            className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#145b6e] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656] disabled:opacity-50"
          >
            {uploading ? "Importing units..." : "Import serialized units"}
          </button>
        </div>
      </form>

      {/* Serialized Units Ledger Table */}
      <section className="overflow-x-auto rounded-[16px] bg-[#f9f9f7] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-display text-[16px] font-semibold text-[#0f1114]">
            Serialized units ({units.length})
          </h3>
        </div>

        {units.length === 0 ? (
          <p className="rounded-[12px] bg-white p-5 text-[14px] text-[#505660]">
            No serialized units imported yet. Download the CSV template above to
            generate item-level GS1 Digital Link QR codes and A4 print sticker sheets.
          </p>
        ) : (
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[#dcdad4] text-[12px] font-semibold text-[#4b4f57]">
                <th className="py-2.5 pr-4">Serial Number</th>
                <th className="py-2.5 pr-4">GTIN (14)</th>
                <th className="hidden py-2.5 pr-4 sm:table-cell">Batch / Lot</th>
                <th className="hidden py-2.5 pr-4 md:table-cell">Mfg Date</th>
                <th className="py-2.5 pr-4">Status</th>
                <th className="py-2.5 text-right">Public QR Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e4de]">
              {units.map((unit) => {
                const publicPath = unit.gtin
                  ? `/01/${unit.gtin}/21/${encodeURIComponent(unit.serial_number)}`
                  : `/p/${slug}/u/${encodeURIComponent(unit.serial_number)}`;
                const fullUrl = buildUnitPublicUrl({
                  origin: siteOrigin,
                  slug,
                  serialNumber: unit.serial_number,
                  gtin: unit.gtin,
                });

                return (
                  <tr key={unit.id} className="hover:bg-white">
                    <td className="py-3 pr-4 font-semibold text-[#0f1114]">
                      <code>{unit.serial_number}</code>
                    </td>
                    <td className="num py-3 pr-4 text-[#505660]">
                      {unit.gtin ? <code>{unit.gtin}</code> : "—"}
                    </td>
                    <td className="hidden py-3 pr-4 text-[#505660] sm:table-cell">
                      {unit.batch_lot || "—"}
                    </td>
                    <td className="num hidden py-3 pr-4 text-[#505660] md:table-cell">
                      {unit.manufacturing_date || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded bg-[#edf8f2] px-2 py-0.5 text-[11.5px] font-semibold text-[#156d49]">
                        {unit.unit_status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={publicPath}
                          target="_blank"
                          title={fullUrl}
                          className="text-[12.5px] font-semibold text-[#145b6e] hover:underline"
                        >
                          {unit.gtin ? "GS1 Link ↗" : "Unit Page ↗"}
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === unit.id}
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="cursor-pointer text-[12px] font-semibold text-red-700 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Free plan serialized unit limit reached (25 units)"
        description="Upgrade to CratePass Pro (€79/mo) for unlimited bulk CSV item serialization, GS1 Digital Link QR sheets, and factory ZIP bundles."
        limitDetail={upgradeDetail}
      />
    </div>
  );
}
