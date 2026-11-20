"use client";

import React, { useMemo, useState } from "react";
import {
  OFFICIAL_STATIC_FIELDS,
  isStaticBlockingFieldForCategory,
  type BatteryCategory,
} from "@/config/battery-fields";
import { formatShortUtcDate } from "@/lib/workspace/helpers";
import {
  SUPPLIER_LOCALES,
  getSupplierLocaleLabel,
  type SupplierLocale,
} from "@/lib/supplier/i18n-zh";

export interface SupplierRequestSummary {
  id: string;
  supplier_name: string;
  supplier_email: string;
  requested_field_keys: string[];
  default_locale: SupplierLocale;
  status: "open" | "submitted" | "merged" | "revoked";
  submitted_payload: Record<string, string>;
  uploaded_doc_path: string | null;
  expires_at: string;
  created_at: string;
  submitted_at: string | null;
}

interface SupplierRequestsPanelProps {
  passportId: string;
  batteryCategory: BatteryCategory;
  workingFields: Record<string, string>;
  initialRequests: SupplierRequestSummary[];
  onMerged: (mergedWorkingFields: Record<string, string>) => void;
}

export function SupplierRequestsPanel({
  passportId,
  batteryCategory,
  workingFields,
  initialRequests,
  onMerged,
}: SupplierRequestsPanelProps) {
  const [requests, setRequests] =
    useState<SupplierRequestSummary[]>(initialRequests);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [defaultLocale, setDefaultLocale] = useState<SupplierLocale>("zh");

  const missingStaticFields = useMemo(
    () =>
      OFFICIAL_STATIC_FIELDS.filter(
        (f) => !(workingFields[f.key] ?? "").trim(),
      ),
    [workingFields],
  );

  const missingRequiredKeys = useMemo(
    () =>
      missingStaticFields
        .filter((f) => isStaticBlockingFieldForCategory(f, batteryCategory))
        .map((f) => f.key),
    [missingStaticFields, batteryCategory],
  );

  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    missingRequiredKeys.length > 0
      ? missingRequiredKeys
      : missingStaticFields.slice(0, 8).map((f) => f.key),
  );

  const [creating, setCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [panelNotice, setPanelNotice] = useState<string | null>(null);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [mergeKeys, setMergeKeys] = useState<Record<string, boolean>>({});
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const submittedRequests = useMemo(
    () => requests.filter((r) => r.status === "submitted"),
    [requests],
  );

  function toggleFieldKey(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function selectAllMissingStatic() {
    setSelectedKeys(missingStaticFields.map((f) => f.key));
  }

  function selectMissingRequired() {
    setSelectedKeys(missingRequiredKeys);
  }

  async function handleGenerateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPanelError(null);
    setPanelNotice(null);
    setGeneratedLink(null);
    setCopied(false);

    if (selectedKeys.length === 0) {
      setPanelError("Select at least one static Annex XIII field to request.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/passports/${passportId}/supplier-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName: supplierName.trim(),
          supplierEmail: supplierEmail.trim(),
          requestedFieldKeys: selectedKeys,
          defaultLocale,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        request?: SupplierRequestSummary;
        magicPath?: string;
      };
      if (!res.ok || !json.request || !json.magicPath) {
        setPanelError(json.error || "Could not create supplier magic link.");
        return;
      }

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${origin}${json.magicPath}`;
      setGeneratedLink(fullUrl);
      setRequests((prev) => [json.request!, ...prev]);
      setSupplierName("");
      setSupplierEmail("");
      setPanelNotice(
        "Magic link generated (14-day expiry). Copy and send via WeChat, email, or WhatsApp — no login required.",
      );
    } catch {
      setPanelError("Network error generating supplier magic link.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopyLink() {
    if (!generatedLink || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  async function handleRevoke(requestId: string) {
    setPanelError(null);
    setPanelNotice(null);
    setBusyRequestId(requestId);
    try {
      const res = await fetch(
        `/api/passports/${passportId}/supplier-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke" }),
        },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPanelError(json.error || "Could not revoke supplier link.");
        return;
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "revoked" } : r)),
      );
      setPanelNotice("Supplier magic link revoked.");
    } catch {
      setPanelError("Network error revoking supplier link.");
    } finally {
      setBusyRequestId(null);
    }
  }

  function openReview(req: SupplierRequestSummary) {
    const initialSelected: Record<string, boolean> = {};
    for (const key of Object.keys(req.submitted_payload ?? {})) {
      initialSelected[key] = true;
    }
    setMergeKeys(initialSelected);
    setReviewingId(req.id);
  }

  async function handleApproveAndMerge(req: SupplierRequestSummary) {
    setPanelError(null);
    setPanelNotice(null);
    const chosenKeys = Object.entries(mergeKeys)
      .filter(([, checked]) => checked)
      .map(([k]) => k);

    setBusyRequestId(req.id);
    try {
      const res = await fetch(
        `/api/passports/${passportId}/supplier-requests/${req.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "merge",
            selectedKeys: chosenKeys,
          }),
        },
      );
      const json = (await res.json()) as {
        error?: string;
        workingFields?: Record<string, string>;
        mergedKeys?: string[];
      };
      if (!res.ok || !json.workingFields) {
        setPanelError(json.error || "Could not merge supplier values.");
        return;
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "merged" } : r)),
      );
      setReviewingId(null);
      onMerged(json.workingFields);
      setPanelNotice(
        `Merged ${json.mergedKeys?.length ?? chosenKeys.length} supplier field(s) into your draft and logged supplier_submission_merged. Review and publish explicitly when ready.`,
      );
    } catch {
      setPanelError("Network error merging supplier submission.");
    } finally {
      setBusyRequestId(null);
    }
  }

  const fieldLabelMap = useMemo(
    () =>
      Object.fromEntries(
        OFFICIAL_STATIC_FIELDS.map((f) => [
          f.key,
          { label: f.label, unit: f.unit, pointNumber: f.pointNumber },
        ]),
      ),
    [],
  );

  return (
    <section className="space-y-4">
      {/* Pending Supplier Submission Review Banner */}
      {submittedRequests.map((req) => {
        const submittedEntries = Object.entries(req.submitted_payload ?? {}).filter(
          ([, v]) => typeof v === "string" && v.trim().length > 0,
        );
        const isReviewing = reviewingId === req.id;

        return (
          <div
            key={req.id}
            className="rounded-[18px] border border-[#9fd4b9] bg-[#edf8f2] p-5 text-[#156d49]"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex rounded bg-white px-2 py-0.5 text-[11.5px] font-semibold text-[#156d49]">
                  Supplier submission ready for review
                </span>
                <h2 className="font-display mt-1.5 text-[17px] font-semibold text-[#0f1114]">
                  {req.supplier_name || "Factory Supplier"} submitted{" "}
                  <span className="num">{submittedEntries.length}</span> field(s)
                  {req.uploaded_doc_path ? " + 1 PDF document" : ""}
                </h2>
                <p className="mt-0.5 text-[13.5px] text-[#22252a]">
                  Compare incoming values side-by-side against your draft. Merging
                  never auto-publishes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => (isReviewing ? setReviewingId(null) : openReview(req))}
                className="pressable inline-flex min-h-[42px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-[#145b6e] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656]"
              >
                {isReviewing ? "Hide diff" : "Review & merge into draft"}
              </button>
            </div>

            {isReviewing && (
              <div className="tab-panel-enter mt-4 space-y-4 rounded-[14px] bg-white p-4 text-[#0f1114]">
                {req.uploaded_doc_path && (
                  <div className="rounded-[10px] bg-[#f4f4f2] px-3.5 py-2.5 text-[13px] text-[#22252a]">
                    <strong className="font-semibold text-[#0f1114]">
                      Uploaded supplier PDF:
                    </strong>{" "}
                    <code className="text-[12px] text-[#145b6e]">
                      {req.uploaded_doc_path.split("/").pop()}
                    </code>{" "}
                    (stored in private spec-pdfs bucket)
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#dcdad4] text-[12px] font-semibold text-[#4b4f57]">
                        <th className="py-2 pr-3">Merge</th>
                        <th className="py-2 pr-3">Annex XIII Field</th>
                        <th className="py-2 pr-3">Current Draft</th>
                        <th className="py-2">Supplier Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e4de]">
                      {submittedEntries.map(([key, subVal]) => {
                        const meta = fieldLabelMap[key];
                        const curVal = (workingFields[key] ?? "").trim();
                        return (
                          <tr key={key}>
                            <td className="py-2.5 pr-3">
                              <input
                                type="checkbox"
                                checked={Boolean(mergeKeys[key])}
                                onChange={(e) =>
                                  setMergeKeys((prev) => ({
                                    ...prev,
                                    [key]: e.target.checked,
                                  }))
                                }
                                className="h-4 w-4 accent-[#145b6e]"
                              />
                            </td>
                            <td className="py-2.5 pr-3 font-semibold text-[#0f1114]">
                              {meta?.pointNumber ? `#${meta.pointNumber} ` : ""}
                              {meta?.label ?? key}
                            </td>
                            <td className="py-2.5 pr-3 text-[#505660]">
                              {curVal || <span className="italic text-[#8a8f98]">Empty</span>}
                            </td>
                            <td className="py-2.5 font-semibold text-[#156d49]">
                              {subVal}
                              {meta?.unit ? ` ${meta.unit}` : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-[12.5px] text-[#505660]">
                    Merging updates draft fields only and writes{" "}
                    <code>supplier_submission_merged</code> to your audit trail.
                  </p>
                  <button
                    type="button"
                    disabled={busyRequestId === req.id}
                    onClick={() => handleApproveAndMerge(req)}
                    className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#156d49] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#105538] disabled:opacity-60"
                  >
                    {busyRequestId === req.id
                      ? "Merging..."
                      : "Approve & merge into draft"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Request Data From Supplier Card / Collapsible Drawer */}
      <div className="rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#101214] px-2 py-0.5 text-[11.5px] font-semibold text-[#7dd3e8]">
                EN · 中文 · 한국어 · 日本語 · Tiếng Việt · No Login
              </span>
              <span className="text-[12.5px] font-medium text-[#505660]">
                {missingStaticFields.length} missing static field
                {missingStaticFields.length === 1 ? "" : "s"}
              </span>
            </div>
            <h2 className="font-display mt-1.5 text-[18px] font-semibold text-[#0f1114]">
              Request data from supplier
            </h2>
            <p className="mt-0.5 text-[13.5px] text-[#505660]">
              Send a 14-day zero-login 5-language form so your Asian cell or
              pack factory can fill missing Annex XIII parameters and upload test PDFs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="pressable inline-flex min-h-[42px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-[#101214] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#232730]"
          >
            {drawerOpen ? "Close supplier request panel" : "Generate supplier magic link"}
          </button>
        </div>

        {panelError && (
          <div
            role="alert"
            className="mt-4 rounded-[10px] border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-900"
          >
            {panelError}
          </div>
        )}

        {panelNotice && (
          <div
            role="status"
            className="mt-4 rounded-[10px] border border-[#9fd4b9] bg-[#edf8f2] px-4 py-2.5 text-[13px] font-medium text-[#156d49]"
          >
            {panelNotice}
          </div>
        )}

        {generatedLink && (
          <div className="tab-panel-enter mt-4 rounded-[14px] bg-[#101214] p-4 text-[#f4f3ef]">
            <p className="text-[12.5px] font-semibold text-[#7dd3e8]">
              Copyable Magic Link (shown once · expires in 14 days)
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-[9px] bg-[#171a1e] px-3 py-2 text-[12.5px] text-[#3eb8cf]">
                {generatedLink}
              </code>
              <button
                type="button"
                onClick={handleCopyLink}
                className="pressable inline-flex min-h-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-[#3eb8cf] px-4 text-[13px] font-semibold text-[#08181d] hover:bg-[#5ec8dc]"
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>
          </div>
        )}

        {drawerOpen && (
          <form
            onSubmit={handleGenerateLink}
            className="tab-panel-enter mt-5 space-y-4 rounded-[14px] bg-white p-4 sm:p-5"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="sup-req-name"
                  className="block text-[13px] font-semibold text-[#0f1114]"
                >
                  Supplier / Factory name
                </label>
                <input
                  id="sup-req-name"
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Shenzhen CellTech"
                  className="input-apple mt-1 w-full rounded-[9px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 text-[13.5px]"
                />
              </div>

              <div>
                <label
                  htmlFor="sup-req-email"
                  className="block text-[13px] font-semibold text-[#0f1114]"
                >
                  Supplier email (optional)
                </label>
                <input
                  id="sup-req-email"
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="eng@factory.cn"
                  className="input-apple mt-1 w-full rounded-[9px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 text-[13.5px]"
                />
              </div>

              <div>
                <label
                  htmlFor="sup-req-locale"
                  className="block text-[13px] font-semibold text-[#0f1114]"
                >
                  Default portal language
                </label>
                <select
                  id="sup-req-locale"
                  value={defaultLocale}
                  onChange={(e) =>
                    setDefaultLocale(e.target.value as SupplierLocale)
                  }
                  className="input-apple mt-1 w-full rounded-[9px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 text-[13.5px] font-medium text-[#0f1114]"
                >
                  {SUPPLIER_LOCALES.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label} ({opt.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field selector */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#0f1114]">
                  Select static fields to request ({selectedKeys.length} selected)
                </span>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <button
                    type="button"
                    onClick={selectAllMissingStatic}
                    className="cursor-pointer rounded bg-[#e6f2f5] px-2.5 py-1 font-semibold text-[#0b3c49] hover:bg-[#d3e8ee]"
                  >
                    All missing static ({missingStaticFields.length})
                  </button>
                  <button
                    type="button"
                    onClick={selectMissingRequired}
                    className="cursor-pointer rounded bg-[#f4f4f2] px-2.5 py-1 font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
                  >
                    Missing required for {batteryCategory} ({missingRequiredKeys.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKeys([])}
                    className="cursor-pointer px-2 py-1 font-medium text-[#505660] hover:text-[#0f1114]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-2.5 grid max-h-[240px] grid-cols-1 gap-1.5 overflow-y-auto rounded-[10px] border border-[#e6e4de] bg-[#f9f9f7] p-3 sm:grid-cols-2">
                {OFFICIAL_STATIC_FIELDS.map((field) => {
                  const checked = selectedKeys.includes(field.key);
                  const isMissing = !(workingFields[field.key] ?? "").trim();
                  return (
                    <label
                      key={field.key}
                      className={`flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12.5px] ${
                        checked ? "bg-white font-semibold text-[#0f1114]" : "text-[#4b4f57]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFieldKey(field.key)}
                        className="h-3.5 w-3.5 shrink-0 accent-[#145b6e]"
                      />
                      <span className="truncate">
                        #{field.pointNumber} {field.label}
                      </span>
                      {isMissing && (
                        <span className="ml-auto shrink-0 rounded bg-[#fdf6ec] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#7c380b]">
                          Missing
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating || selectedKeys.length === 0}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#145b6e] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656] disabled:opacity-50"
              >
                {creating
                  ? "Generating link..."
                  : `Generate 14-day Magic Link (${selectedKeys.length} fields)`}
              </button>
            </div>
          </form>
        )}

        {/* History of Supplier Requests */}
        {requests.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-[12.5px] font-semibold text-[#4b4f57]">
              Supplier links ({requests.length})
            </h3>
            <ul className="space-y-2">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-white px-4 py-3 text-[13px]"
                >
                  <div>
                    <span className="font-semibold text-[#0f1114]">
                      {req.supplier_name || "Unnamed supplier"}
                    </span>
                    <span className="ml-2 text-[#505660]">
                      ({req.requested_field_keys.length} fields ·{" "}
                      {getSupplierLocaleLabel(req.default_locale)})
                    </span>
                    <span className="ml-2 text-[12px] text-[#505660]">
                      Expires {formatShortUtcDate(req.expires_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11.5px] font-semibold ${
                        req.status === "submitted"
                          ? "bg-[#edf8f2] text-[#156d49]"
                          : req.status === "merged"
                            ? "bg-[#e6f2f5] text-[#0b3c49]"
                            : req.status === "revoked"
                              ? "bg-red-50 text-red-800"
                              : "bg-[#fdf6ec] text-[#7c380b]"
                      }`}
                    >
                      {req.status}
                    </span>
                    {(req.status === "open" || req.status === "submitted") && (
                      <button
                        type="button"
                        disabled={busyRequestId === req.id}
                        onClick={() => handleRevoke(req.id)}
                        className="cursor-pointer rounded bg-red-50 px-2.5 py-1 text-[12px] font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
