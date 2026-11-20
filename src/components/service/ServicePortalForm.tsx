"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/Icons";
import type { DynamicLifecycleStatus } from "@/lib/service/auth";

interface ServicePortalFormProps {
  slug: string;
  productName: string;
  manufacturerName: string;
  serialNumber?: string;
}

export function ServicePortalForm({
  slug,
  productName,
  manufacturerName,
  serialNumber: initialSerial = "",
}: ServicePortalFormProps) {
  const [pin, setPin] = useState("");
  const [serialNumber, setSerialNumber] = useState(initialSerial);
  const [sohPct, setSohPct] = useState("");
  const [cycleCount, setCycleCount] = useState("");
  const [resistanceMohm, setResistanceMohm] = useState("");
  const [lifecycleStatus, setLifecycleStatus] =
    useState<DynamicLifecycleStatus>("repaired");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successLog, setSuccessLog] = useState<{
    recorded_by_label: string;
    recorded_at: string;
    lifecycle_status: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessLog(null);

    if (!pin.trim() || pin.trim().length < 4) {
      setErrorMsg("Enter your workspace-issued dealer/repairer PIN.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        pin: pin.trim(),
        lifecycleStatus,
        notes: notes.trim(),
      };
      if (serialNumber.trim()) payload.serialNumber = serialNumber.trim();
      if (sohPct.trim()) payload.stateOfHealthPct = Number(sohPct);
      if (cycleCount.trim()) payload.cycleCount = Number(cycleCount);
      if (resistanceMohm.trim()) {
        payload.internalResistanceMohm = Number(resistanceMohm);
      }

      const res = await fetch(`/api/service/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        error?: string;
        ok?: boolean;
        log?: {
          recorded_by_label: string;
          recorded_at: string;
          lifecycle_status: string;
        };
      };

      if (!res.ok || !json.ok || !json.log) {
        setErrorMsg(json.error || "Could not record dynamic BMS update.");
        return;
      }

      setSuccessLog(json.log);
      setSohPct("");
      setCycleCount("");
      setResistanceMohm("");
      setNotes("");
    } catch {
      setErrorMsg("Network error submitting service update. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-[#e8e7e3] text-[#0f1114]">
      <header className="bg-[#101214] text-[#f4f3ef]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0" />
            <div>
              <span className="font-display block text-[15px] font-semibold text-white">
                CratePass Dealer &amp; Repairer SoH Portal
              </span>
              <span className="block text-[11.5px] text-[#9aa0ab]">
                Append-only dynamic BMS metrics (Annex XIII Points 51–71)
              </span>
            </div>
          </div>

          <Link
            href={
              initialSerial
                ? `/p/${slug}/u/${encodeURIComponent(initialSerial)}`
                : `/p/${slug}`
            }
            className="rounded-[8px] bg-[#1d2229] px-3 py-1.5 text-[12.5px] font-semibold text-[#7dd3e8] hover:bg-[#282f39]"
          >
            Public Passport ↗
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] flex-1 space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-[20px] bg-white p-5 sm:p-7">
          <span className="inline-flex rounded-md bg-[#e6f2f5] px-2.5 py-1 text-[12px] font-semibold text-[#0b3c49]">
            Authorised Workshop Update · No-IoT BMS Log
          </span>
          <h1 className="font-display mt-2.5 text-[23px] font-bold text-[#0f1114]">
            {productName}
          </h1>
          <p className="mt-1 text-[14px] text-[#505660]">
            {manufacturerName} · Route: <code>/p/{slug}</code>
            {initialSerial ? (
              <>
                {" "}
                · Unit: <code>{initialSerial}</code>
              </>
            ) : null}
          </p>
          <p className="mt-2.5 rounded-[10px] bg-[#f4f4f2] px-3.5 py-2.5 text-[13px] text-[#4b4f57]">
            Entries append strictly to the dynamic BMS telemetry ledger without
            altering immutable static battery passport snapshots.
          </p>
        </section>

        {successLog && (
          <div
            role="status"
            className="tab-panel-enter rounded-[16px] border border-[#9fd4b9] bg-[#edf8f2] p-5 text-[#156d49]"
          >
            <p className="font-display text-[17px] font-semibold">
              ✓ Dynamic BMS update logged
            </p>
            <p className="mt-1 text-[13.5px]">
              Recorded by <strong>{successLog.recorded_by_label}</strong> · Status:{" "}
              <strong>{successLog.lifecycle_status}</strong> ·{" "}
              <code>{successLog.recorded_at.slice(0, 19).replace("T", " ")}Z</code>
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[20px] bg-white p-5 sm:p-7"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="service-pin"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                Workspace Service PIN *
              </label>
              <input
                id="service-pin"
                type="password"
                required
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Issued by battery brand"
                className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 font-mono text-[15px]"
              />
            </div>

            <div>
              <label
                htmlFor="service-serial"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                Unit Serial Number (optional)
              </label>
              <input
                id="service-serial"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-2026-00001"
                className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 font-mono text-[14.5px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="service-soh"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                State of Health (%)
              </label>
              <input
                id="service-soh"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={sohPct}
                onChange={(e) => setSohPct(e.target.value)}
                placeholder="e.g. 92.5"
                className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[14.5px]"
              />
            </div>

            <div>
              <label
                htmlFor="service-cycles"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                Cycle Count (Point 68)
              </label>
              <input
                id="service-cycles"
                type="number"
                step="1"
                min="0"
                value={cycleCount}
                onChange={(e) => setCycleCount(e.target.value)}
                placeholder="e.g. 142"
                className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[14.5px]"
              />
            </div>

            <div>
              <label
                htmlFor="service-resistance"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                Internal Resistance (mΩ)
              </label>
              <input
                id="service-resistance"
                type="number"
                step="0.01"
                min="0"
                value={resistanceMohm}
                onChange={(e) => setResistanceMohm(e.target.value)}
                placeholder="e.g. 48.2"
                className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[14.5px]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="service-lifecycle"
              className="block text-[13.5px] font-semibold text-[#0f1114]"
            >
              Battery Lifecycle Status (Point 67)
            </label>
            <select
              id="service-lifecycle"
              value={lifecycleStatus}
              onChange={(e) =>
                setLifecycleStatus(e.target.value as DynamicLifecycleStatus)
              }
              className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[14.5px]"
            >
              <option value="original">Original (in-service inspection)</option>
              <option value="repaired">Repaired</option>
              <option value="repurposed">Repurposed (second life)</option>
              <option value="waste">Waste (end-of-life collection)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="service-notes"
              className="block text-[13.5px] font-semibold text-[#0f1114]"
            >
              Diagnostic &amp; service notes
            </label>
            <textarea
              id="service-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bench capacity test at 0.5C; replaced external latch; balanced cell groups."
              className="input-apple mt-1 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 text-[14.5px]"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] font-medium text-red-900"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="pressable inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[11px] bg-[#145b6e] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#0e4656] disabled:opacity-60"
          >
            {submitting ? "Logging BMS update..." : "Append SoH & Lifecycle Update"}
          </button>
        </form>

        <footer className="pb-6 text-[12.5px] text-[#505660]">
          Working field list — check against official regulation. Logged by
          authorised service operator; not verified by CratePass.
        </footer>
      </main>
    </div>
  );
}
