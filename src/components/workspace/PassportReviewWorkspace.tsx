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
  canPublish?: boolean;
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
  canPublish = true,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

    if (!canPublish) {
      setBillingRequiredError(true);
      setActionError(
        "Brand Hosting (€49/mo) is required to publish live QR passports.",
      );
      return;
    }

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

  async function handleDeletePassport() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/passports/${passportId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(json.error || "Could not delete passport.");
        return;
      }
      setDeleteDialogOpen(false);
      router.push("/app");
      router.refresh();
    } catch {
      setDeleteError("Network error deleting passport. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  function downloadSvg() {
    if (!canPublish || !qrAssets) return;
    const blob = new Blob([qrAssets.svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    if (!canPublish || !qrAssets) return;
    const link = document.createElement("a");
    link.href = qrAssets.pngDataUrl;
    link.download = `${slug}-qr.png`;
    link.click();
  }

  const isPublished = status === "published";

  return (
    <div data-ui className="space-y-6">
      {/* Breadcrumb & header */}
      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#505660]">
            <Link
              href="/app"
              className="font-medium text-[#505660] hover:text-[#0f1114] hover:underline"
            >
              Passports
            </Link>
            <span className="text-[#c8c7c1]">/</span>
            <code className="rounded bg-[#f4f4f2] px-2 py-0.5 text-[12px] font-medium text-[#0f1114]">
              {slug}
            </code>
            <span className="rounded bg-[#e8f3f6] px-2 py-0.5 text-[11.5px] font-semibold text-[#0b3c49]">
              {batteryCategory}
            </span>
          </div>
          <h1 className="font-display mt-2 text-[24px] font-bold tracking-tight text-[#0f1114] sm:text-[28px]">
            {productName}
          </h1>
          {modelCode && (
            <p className="mt-1 text-[13px] font-medium text-[#505660]">
              SKU: <code className="text-[#0f1114]">{modelCode}</code>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold ${
              isPublished
                ? "bg-[#edf8f2] text-[#156d49]"
                : "bg-[#fdf6ec] text-[#7c380b]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPublished ? "bg-[#156d49]" : "bg-[#b45309]"
              }`}
            />
            {isPublished
              ? `Published${latestVersionNumber ? ` v${latestVersionNumber}` : ""}`
              : "Draft"}
          </span>

          {isPublished && (
            <Link
              href={`/p/${slug}`}
              target="_blank"
              className="pressable group inline-flex min-h-[40px] items-center gap-1.5 rounded-[10px] border border-[#9fd4b9] bg-[#edf8f2] px-3.5 text-[13.5px] font-semibold text-[#156d49] hover:bg-[#dcf2e6]"
            >
              <span>Open /p/{slug}</span>
              <span aria-hidden="true" className="btn-arrow">
                ↗
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleteDialogOpen(true);
            }}
            className="pressable inline-flex min-h-[40px] cursor-pointer items-center rounded-[10px] border border-red-200 bg-red-50 px-3.5 text-[13.5px] font-semibold text-red-800 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Free Plan Upgrade Notice Banner */}
      {!canPublish && (
        <div
          role="note"
          className="flex flex-col justify-between gap-3 rounded-[16px] border border-[#ebd0a8] bg-[#fdf6ec] p-4 text-[#7c380b] sm:flex-row sm:items-center sm:px-5"
        >
          <p className="text-[14px] font-semibold leading-snug">
            Brand Hosting (€49/mo) is required to publish live QR passports —
            upgrade to publish /p/{slug} and download SVG/PNG QR labels.
          </p>
          <Link
            href="/app/billing"
            className="pressable inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[#145b6e] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656]"
          >
            Upgrade in Plan &amp; Billing →
          </Link>
        </div>
      )}

      {/* Publish & QR controls grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Publish & declaration control */}
        <div className="rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-[17px] font-semibold text-[#0f1114]">
                Review declaration &amp; publish controls
              </h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#505660]">
                Save any field adjustments below, confirm responsibility for
                accuracy, and publish an immutable public snapshot. Restricted
                fields stay omitted from{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-[12.5px] text-[#0f1114]">
                  /p/{slug}
                </code>
                .
              </p>
            </div>
          </div>

          <label
            className={`mt-4 flex items-start gap-3 rounded-[12px] border p-4 text-[13.5px] text-[#0f1114] transition-colors duration-150 ${
              !canPublish
                ? "cursor-not-allowed border-[#e4e3dd] bg-white/60 opacity-65"
                : declarationChecked
                  ? "cursor-pointer border-[#145b6e] bg-[#e8f3f6]/75"
                  : "cursor-pointer border-[#dad9d3] bg-white hover:border-[#0f1114]/40"
            }`}
          >
            <input
              type="checkbox"
              disabled={!canPublish}
              checked={declarationChecked}
              onChange={(e) => setDeclarationChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#145b6e] disabled:cursor-not-allowed"
            />
            <span className="font-medium leading-snug text-[#0f1114]">
              {ACCURACY_DECLARATION_TEXT}
            </span>
          </label>

          {actionError && (
            <div
              role="alert"
              className="tab-panel-enter mt-3.5 rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-900"
            >
              <p>{actionError}</p>
              {billingRequiredError && (
                <Link
                  href="/app/billing"
                  className="mt-2 inline-flex font-semibold text-red-950 underline underline-offset-4"
                >
                  Upgrade in Plan &amp; Billing →
                </Link>
              )}
            </div>
          )}

          {actionNotice && (
            <div
              role="status"
              className="tab-panel-enter mt-3.5 rounded-[10px] border border-[#9fd4b9] bg-[#edf8f2] px-4 py-3 text-[13px] font-medium text-[#156d49]"
            >
              {actionNotice}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!isPublished ? (
              <button
                type="button"
                disabled={!canPublish || submittingAction !== null}
                onClick={() =>
                  handlePublishAction(
                    versions.length > 0 ? "publish_new_version" : "publish",
                  )
                }
                className="pressable group inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0e4250] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {submittingAction ? "Publishing..." : "Approve & Publish"}
                </span>
                <span aria-hidden="true" className="btn-arrow">
                  →
                </span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={!canPublish || submittingAction !== null}
                  onClick={() => handlePublishAction("publish_new_version")}
                  className="pressable group inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0e4250] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    {submittingAction === "publish_new_version"
                      ? "Publishing..."
                      : "Publish new version"}
                  </span>
                  <span aria-hidden="true" className="btn-arrow">
                    →
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!canPublish || submittingAction !== null}
                  onClick={() => handlePublishAction("unpublish")}
                  className="pressable inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[10px] border border-[#dad9d3] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0f1114] hover:border-[#0f1114] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingAction === "unpublish"
                    ? "Unpublishing..."
                    : "Unpublish"}
                </button>
              </>
            )}
          </div>

          {versions.length > 0 && (
            <div className="mt-5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#0f1114]">
                  Immutable version history
                </h3>
                <span className="num text-[12px] text-[#505660]">
                  {versions.length} snapshot{versions.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[12.5px]">
                {versions.slice(0, 5).map((ver, index) => (
                  <li
                    key={ver.id}
                    className="flex items-center justify-between rounded-[10px] bg-white px-3.5 py-2 text-[#505660]"
                  >
                    <span className="num font-semibold text-[#0f1114]">
                      v{ver.versionNumber}
                      {index === 0 && isPublished ? (
                        <span className="ml-2 rounded bg-[#edf8f2] px-1.5 py-0.5 text-[11px] font-semibold text-[#156d49]">
                          current live
                        </span>
                      ) : null}
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
        <div className="flex flex-col justify-between rounded-[18px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[17px] font-semibold text-white">
                  QR label download
                </h2>
                <p className="mt-0.5 text-[13px] text-[#c4c8d0]">
                  Encodes permanent public route
                </p>
              </div>
              <span
                className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${
                  isPublished
                    ? "bg-[#0a2921] text-[#6ee7b7]"
                    : "bg-[#2a2112] text-[#fbbf24]"
                }`}
              >
                {isPublished ? "LIVE" : "DRAFT"}
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center rounded-[14px] bg-[#171a1e] p-4 sm:p-5">
              {qrAssets ? (
                <div className="relative overflow-hidden rounded-[12px] bg-white p-3">
                  <div
                    aria-hidden="true"
                    className="qr-laser-line pointer-events-none absolute inset-x-3 top-0 h-[2px] rounded-full bg-[#145b6e]/70"
                  />
                  <Image
                    src={qrAssets.pngDataUrl}
                    alt={`QR code pointing to ${publicUrl}`}
                    width={168}
                    height={168}
                    unoptimized
                    className={`h-[168px] w-[168px] ${!canPublish ? "opacity-45" : ""}`}
                  />
                </div>
              ) : (
                <div className="flex h-[168px] w-[168px] items-center justify-center rounded-[12px] bg-[#101214] text-[13px] text-[#b6bac2]">
                  Generating QR...
                </div>
              )}

              <p className="mt-3.5 max-w-full break-all text-center text-[12.5px] text-[#3eb8cf]">
                <code>{publicUrl}</code>
              </p>
            </div>

            {!canPublish ? (
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#fbbf24]">
                Brand Hosting (€49/mo) is required to download print-ready SVG
                and PNG QR labels.{" "}
                <Link
                  href="/app/billing"
                  className="font-semibold text-[#7ce3f4] underline underline-offset-4"
                >
                  Upgrade in Plan &amp; Billing →
                </Link>
              </p>
            ) : (
              !isPublished && (
                <p className="mt-3 text-[12.5px] leading-relaxed text-[#fbbf24]">
                  Approve &amp; Publish before printing so scanners resolve the
                  live page instead of 404.
                </p>
              )
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={!canPublish || !qrAssets}
              onClick={downloadSvg}
              className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#145b6e] px-3 text-[13.5px] font-semibold text-white hover:bg-[#1a748b] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Download SVG
            </button>
            <button
              type="button"
              disabled={!canPublish || !qrAssets}
              onClick={downloadPng}
              className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#242830] px-3 text-[13.5px] font-semibold text-white hover:bg-[#303540] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Download PNG
            </button>
          </div>
        </div>
      </section>

      {/* Full editable fields grid (always enabled on Free and Pro plans) */}
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

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-passport-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-[460px] rounded-[20px] bg-white p-6 text-[#0f1114]">
            <h2
              id="delete-passport-title"
              className="font-display text-[19px] font-semibold text-[#0f1114]"
            >
              Delete &ldquo;{productName}&rdquo;?
            </h2>

            {isPublished ? (
              <p className="mt-3 rounded-[12px] border border-red-300 bg-red-50 p-3.5 text-[13.5px] font-semibold leading-relaxed text-red-900">
                This passport is live at /p/{slug}. Deleting it will permanently
                deactivate that QR link.
              </p>
            ) : (
              <p className="mt-2 text-[14px] leading-relaxed text-[#505660]">
                This will permanently delete this passport record and any
                associated specification PDF in your private storage bucket.
              </p>
            )}

            {deleteError && (
              <div
                role="alert"
                className="mt-3 rounded-[10px] border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-900"
              >
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteDialogOpen(false)}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#f4f4f2] px-4 py-2 text-[14px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePassport}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-red-700 px-4 py-2 text-[14px] font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
