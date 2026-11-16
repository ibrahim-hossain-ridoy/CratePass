"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PassportFieldEditor } from "./PassportFieldEditor";
import { ACCURACY_DECLARATION_TEXT } from "@/lib/publish";
import { buildPublicPassportUrl, generateQrAssets, type QrAssets } from "@/lib/qr";
import { formatShortUtcDate } from "@/lib/workspace/helpers";
import { normalizeBatteryCategory } from "@/config/battery-fields";
import type {
  BatteryCategory,
  ExtractionResultMap,
  PassportStatus,
} from "@/types/database";

export interface VersionHistoryItem {
  id: string;
  versionNumber: number;
  declaredAt: string;
  createdAt: string;
}

interface PassportReviewWorkspaceProps {
  passportId: string;
  slug: string;
  initialStatus: PassportStatus;
  initialBatteryCategory?: BatteryCategory;
  initialProductName: string;
  initialModelCode: string;
  initialFields: Record<string, string>;
  extractionFields?: ExtractionResultMap;
  initialVersions: VersionHistoryItem[];
  siteUrlConfigured?: string;
}

export function PassportReviewWorkspace({
  passportId,
  slug,
  initialStatus,
  initialBatteryCategory,
  initialProductName,
  initialModelCode,
  initialFields,
  extractionFields,
  initialVersions,
  siteUrlConfigured,
}: PassportReviewWorkspaceProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PassportStatus>(initialStatus);
  const [batteryCategory, setBatteryCategory] = useState<BatteryCategory>(() =>
    normalizeBatteryCategory(
      initialBatteryCategory ?? initialFields.battery_category,
    ),
  );
  const [productName, setProductName] = useState(initialProductName);
  const [modelCode, setModelCode] = useState(initialModelCode);
  const [workingFields, setWorkingFields] = useState<Record<string, string>>(initialFields);
  const [versions, setVersions] = useState<VersionHistoryItem[]>(initialVersions);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [billingRequiredError, setBillingRequiredError] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [qrAssets, setQrAssets] = useState<QrAssets | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>(() =>
    buildPublicPassportUrl(slug, undefined, siteUrlConfigured),
  );

  useEffect(() => {
    const runtimeOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const resolved = buildPublicPassportUrl(slug, runtimeOrigin, siteUrlConfigured);
    let cancelled = false;

    generateQrAssets(resolved)
      .then((assets) => {
        if (!cancelled) {
          setPublicUrl(resolved);
          setQrAssets(assets);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPublicUrl(resolved);
          setQrAssets(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, siteUrlConfigured]);

  const latestVersionNumber = useMemo(
    () => (versions.length > 0 ? versions[0].versionNumber : null),
    [versions],
  );

  async function handlePublishAction(
    action: "publish" | "publish_new_version" | "unpublish",
  ) {
    setActionError(null);
    setBillingRequiredError(false);
    setActionNotice(null);

    if (action !== "unpublish" && !declarationChecked) {
      setActionError(
        `Tick the confirmation box ("${ACCURACY_DECLARATION_TEXT}") before publishing.`,
      );
      return;
    }

    setSubmittingAction(action);
    try {
      const res = await fetch(`/api/passports/${passportId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          declarationAccepted: action === "unpublish" ? false : declarationChecked,
          batteryCategory,
          workingFields,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        code?: string;
        status?: PassportStatus;
        version?: VersionHistoryItem;
      };

      if (!res.ok) {
        if (res.status === 402 || json.code === "BILLING_REQUIRED") {
          setBillingRequiredError(true);
        }
        setActionError(json.error || "Action failed. Try again.");
        return;
      }

      if (action === "unpublish") {
        setStatus("draft");
        setActionNotice(
          "Passport unpublished cleanly. Public /p/[slug] now returns unavailable while immutable version history remains intact.",
        );
      } else if (json.version) {
        setStatus("published");
        setVersions((prev) => [json.version!, ...prev]);
        setDeclarationChecked(false);
        setActionNotice(
          `Published immutable version v${json.version.versionNumber} at /p/${slug}.`,
        );
      }
      router.refresh();
    } catch {
      setActionError("Network error communicating with publish endpoint.");
    } finally {
      setSubmittingAction(null);
    }
  }

  function downloadSvg() {
    if (!qrAssets) return;
    const blob = new Blob([qrAssets.svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    if (!qrAssets) return;
    const link = document.createElement("a");
    link.href = qrAssets.pngDataUrl;
    link.download = `${slug}-qr.png`;
    link.click();
  }

  const isPublished = status === "published";

  return (
    <div className="space-y-6">
      {/* Breadcrumb & header */}
      <div className="flex flex-col gap-3 border-b border-[var(--rule)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
            <Link href="/app" className="hover:text-[var(--ink)] hover:underline">
              Passports
            </Link>
            <span>/</span>
            <code className="font-mono text-[var(--ink)]">{slug}</code>
          </div>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            {productName}
          </h1>
          {modelCode && (
            <p className="mt-0.5 font-mono text-[12.5px] text-[var(--muted)]">
              SKU: {modelCode}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex rounded px-2.5 py-1 text-[12.5px] font-semibold ${
              isPublished
                ? "border border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]"
                : "border border-[var(--notice-border)] bg-[var(--notice-bg)] text-[var(--notice-ink)]"
            }`}
          >
            {isPublished
              ? `Published${latestVersionNumber ? ` v${latestVersionNumber}` : ""}`
              : "Draft"}
          </span>

          {isPublished && (
            <Link
              href={`/p/${slug}`}
              target="_blank"
              className="pressable inline-flex min-h-[40px] items-center rounded-[8px] border border-[var(--positive)] bg-[var(--surface)] px-3.5 text-[13.5px] font-semibold text-[var(--positive)] hover:bg-[var(--positive-bg)]"
            >
              Open /p/{slug}
            </Link>
          )}
        </div>
      </div>

      {/* Publish & QR controls grid */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Publish & declaration control */}
        <div className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5 lg:col-span-7">
          <h2 className="text-[16px] font-semibold text-[var(--ink)]">
            Review declaration &amp; publish controls
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">
            Save any field adjustments below, confirm responsibility for accuracy,
            and publish an immutable public snapshot. Restricted fields stay omitted from{" "}
            <code className="font-mono text-[var(--ink)]">/p/{slug}</code>.
          </p>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[8px] border border-[var(--border-strong)] bg-[var(--well-soft)] p-3.5 text-[13.5px] text-[var(--ink)]">
            <input
              type="checkbox"
              checked={declarationChecked}
              onChange={(e) => setDeclarationChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent-ink)]"
            />
            <span className="font-medium leading-snug">
              {ACCURACY_DECLARATION_TEXT}
            </span>
          </label>

          {actionError && (
            <div
              role="alert"
              className="mt-3 rounded-[8px] border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-900"
            >
              <p>{actionError}</p>
              {billingRequiredError && (
                <Link
                  href="/app/billing"
                  className="mt-2 inline-flex font-semibold text-red-950 underline underline-offset-4"
                >
                  Open Plan &amp; Billing (/app/billing)
                </Link>
              )}
            </div>
          )}

          {actionNotice && (
            <div
              role="status"
              className="mt-3 rounded-[8px] border border-[var(--positive-border)] bg-[var(--positive-bg)] px-3.5 py-2.5 text-[13px] text-[var(--positive)]"
            >
              {actionNotice}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!isPublished ? (
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() =>
                  handlePublishAction(
                    versions.length > 0 ? "publish_new_version" : "publish",
                  )
                }
                className="pressable chamfer-sm inline-flex min-h-[44px] items-center justify-center bg-[var(--accent)] px-5 py-2 text-[14px] font-bold text-white hover:bg-[var(--accent-ink)] disabled:opacity-60 cursor-pointer"
              >
                {submittingAction ? "Publishing..." : "Approve & Publish"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() => handlePublishAction("publish_new_version")}
                  className="pressable chamfer-sm inline-flex min-h-[44px] items-center justify-center bg-[var(--accent)] px-4 py-2 text-[14px] font-bold text-white hover:bg-[var(--accent-ink)] disabled:opacity-60 cursor-pointer"
                >
                  {submittingAction === "publish_new_version"
                    ? "Publishing..."
                    : "Publish new version"}
                </button>
                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() => handlePublishAction("unpublish")}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-[14px] font-semibold text-[var(--ink)] hover:border-[var(--ink)] disabled:opacity-60 cursor-pointer"
                >
                  {submittingAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
                </button>
              </>
            )}
          </div>

          {versions.length > 0 && (
            <div className="mt-5 border-t border-[var(--rule)] pt-4">
              <h3 className="text-[13px] font-semibold text-[var(--ink)]">
                Immutable version history
              </h3>
              <ul className="mt-2 divide-y divide-[var(--rule)] text-[12.5px]">
                {versions.slice(0, 5).map((ver, index) => (
                  <li
                    key={ver.id}
                    className="flex items-center justify-between py-2 text-[var(--muted)]"
                  >
                    <span className="num font-mono font-semibold text-[var(--ink)]">
                      v{ver.versionNumber}
                      {index === 0 && isPublished ? " (current live)" : ""}
                    </span>
                    <span className="num">
                      Declared {formatShortUtcDate(ver.declaredAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Downloadable QR card */}
        <div className="rounded-[12px] border border-[#233242] bg-[#0B1016] p-4 text-[#F1F5F9] sm:p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-bold text-white">
                QR label download
              </h2>
              <p className="mt-0.5 text-[12.5px] text-[#94A3B8]">
                Encodes permanent public route
              </p>
            </div>
            <span className="rounded border border-[#34D399]/40 bg-[#0A2921] px-2 py-0.5 font-mono text-[11px] font-bold text-[#6EE7B7]">
              {isPublished ? "LIVE" : "DRAFT"}
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center rounded-[10px] border border-[#233242] bg-[#131D28] p-4">
            {qrAssets ? (
              <div className="rounded-[8px] bg-white p-2">
                <Image
                  src={qrAssets.pngDataUrl}
                  alt={`QR code pointing to ${publicUrl}`}
                  width={168}
                  height={168}
                  unoptimized
                  className="h-[168px] w-[168px]"
                />
              </div>
            ) : (
              <div className="flex h-[168px] w-[168px] items-center justify-center bg-[#0B1016] text-[12px] text-[#94A3B8]">
                Generating QR...
              </div>
            )}

            <p className="mt-3 max-w-full break-all text-center font-mono text-[11.5px] text-[#6EE7B7]">
              {publicUrl}
            </p>
          </div>

          {!isPublished && (
            <p className="mt-2.5 text-[12px] text-[#FCD34D]">
              Approve &amp; Publish before printing so scanners resolve the live page
              instead of 404.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={!qrAssets}
              onClick={downloadSvg}
              className="pressable chamfer-sm inline-flex min-h-[42px] items-center justify-center bg-[#34D399] px-3 text-[13px] font-bold text-[#052E16] hover:bg-[#6EE7B7] disabled:opacity-50 cursor-pointer"
            >
              Download SVG
            </button>
            <button
              type="button"
              disabled={!qrAssets}
              onClick={downloadPng}
              className="pressable inline-flex min-h-[42px] items-center justify-center rounded-[8px] border border-[#233242] bg-[#131D28] px-3 text-[13px] font-bold text-white hover:border-[#34D399] disabled:opacity-50 cursor-pointer"
            >
              Download PNG
            </button>
          </div>
        </div>
      </section>

      {/* Full editable fields grid */}
      <PassportFieldEditor
        passportId={passportId}
        initialBatteryCategory={batteryCategory}
        initialProductName={productName}
        initialModelCode={modelCode}
        initialFields={workingFields}
        extractionFields={extractionFields}
        primarySaveLabel="Save field changes"
        onSaved={(updated) => {
          setBatteryCategory(updated.batteryCategory);
          setProductName(updated.productName);
          setModelCode(updated.modelCode);
          setWorkingFields(updated.workingFields);
        }}
      />
    </div>
  );
}
