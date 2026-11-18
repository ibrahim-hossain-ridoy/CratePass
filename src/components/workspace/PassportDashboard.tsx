"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";
import { RollingNumber } from "@/components/landing/RollingNumber";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { formatShortUtcDate } from "@/lib/workspace/helpers";
import type { PassportStatus } from "@/types/database";

export interface DashboardPassportItem {
  id: string;
  slug: string;
  status: PassportStatus;
  productName: string;
  modelCode: string;
  versionNumber: number | null;
  populatedCount: number;
  totalFieldCount: number;
  updatedAt: string;
}

interface PassportDashboardProps {
  orgName: string;
  dailyExtractionsUsed: number;
  dailyExtractionLimit: number;
  passports: DashboardPassportItem[];
  queryError?: string;
}

export function PassportDashboard({
  orgName,
  dailyExtractionsUsed,
  dailyExtractionLimit,
  passports,
  queryError,
}: PassportDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const publishedCount = passports.filter((p) => p.status === "published").length;
  const draftCount = passports.length - publishedCount;
  const quotaRatio = Math.min(
    1,
    Math.max(0, dailyExtractionsUsed / Math.max(1, dailyExtractionLimit)),
  );

  const filteredPassports = useMemo(() => {
    return passports.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.modelCode.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [passports, statusFilter, searchQuery]);

  return (
    <div data-ui className="space-y-8">
      {/* Sheet Header Row */}
      <div className="flex flex-col gap-5 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-md bg-[#e6f2f5] px-2.5 py-1 text-[13px] font-semibold text-[#0b3c49]">
            {orgName}
          </span>
          <h1 className="text-title-page mt-2 text-[#0f1114]">
            Battery Passports
          </h1>
          <p className="mt-1 text-[14.5px] text-[#4b4f57]">
            {WORKING_FIELD_LIST_NOTICE}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-[12px] bg-[#f4f4f2] px-4 py-2.5 text-[13px]">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-[#4b4f57]">Daily PDF checks</span>
              <span className="num font-semibold text-[#0f1114]">
                {dailyExtractionsUsed} / {dailyExtractionLimit}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-[#dcdad4]">
              <div
                style={{ transform: `scaleX(${quotaRatio})` }}
                className="progress-fill-smooth h-full w-full rounded-full bg-[#145b6e]"
              />
            </div>
          </div>

          <Link
            href="/app/new"
            className="pressable inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-5 py-2.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#0e4656]"
          >
            <span>New passport</span>
            <ArrowRightIcon className="btn-arrow h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Typography-Led KPI Row (app-screens.md §5) */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[14px] bg-[#f4f4f2] p-5">
          <dt className="text-[13.5px] font-semibold text-[#4b4f57]">
            Total battery records
          </dt>
          <dd className="font-display num mt-1.5 text-[30px] font-semibold leading-none text-[#0f1114]">
            <RollingNumber value={passports.length} />
          </dd>
          <p className="mt-2 text-[13px] text-[#4b4f57]">
            Scoped to {orgName}
          </p>
        </div>

        <div className="rounded-[14px] bg-[#edf8f2] p-5">
          <dt className="text-[13.5px] font-semibold text-[#156d49]">
            Published QR routes
          </dt>
          <dd className="font-display num mt-1.5 text-[30px] font-semibold leading-none text-[#156d49]">
            <RollingNumber value={publishedCount} />
          </dd>
          <p className="mt-2 text-[13px] text-[#156d49]">
            Live at /p/[slug]
          </p>
        </div>

        <div className="rounded-[14px] bg-[#f4f4f2] p-5">
          <dt className="text-[13.5px] font-semibold text-[#4b4f57]">
            Drafts in completeness check
          </dt>
          <dd className="font-display num mt-1.5 text-[30px] font-semibold leading-none text-[#0f1114]">
            <RollingNumber value={draftCount} />
          </dd>
          <p className="mt-2 text-[13px] text-[#4b4f57]">
            Awaiting field review
          </p>
        </div>

        <div className="rounded-[14px] bg-[#e6f2f5] p-5">
          <dt className="text-[13.5px] font-semibold text-[#0b3c49]">
            Annex XIII schema scope
          </dt>
          <dd className="font-display num mt-1.5 text-[30px] font-semibold leading-none text-[#0b3c49]">
            <RollingNumber value={71} suffix=" pts" />
          </dd>
          <p className="mt-2 text-[13px] text-[#0b3c49]">
            51 static · 21 dynamic BMS
          </p>
        </div>
      </dl>

      {queryError && (
        <div
          role="alert"
          className="rounded-[12px] bg-red-50 p-4 text-[14px] text-red-900"
        >
          <p className="font-semibold">Unable to load passport list</p>
          <p className="mt-1 text-[13.5px]">{queryError}</p>
        </div>
      )}

      {/* Rich Hardware Studio Empty State */}
      {!queryError && passports.length === 0 && (
        <section className="overflow-hidden rounded-[20px] bg-[#101214] p-6 text-[#f4f3ef] sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-block rounded-full bg-[#171a1e] px-3 py-1 text-[13px] font-semibold text-[#3eb8cf]">
                Ready for first battery datasheet
              </span>
              <h2 className="font-display mt-3 text-[26px] font-semibold leading-tight text-white sm:text-[30px]">
                No battery passports created yet
              </h2>
              <p className="mt-3 max-w-[50ch] text-[16px] leading-relaxed text-[#c4c8d0]">
                Upload an OEM battery specification PDF or start a blank draft to
                inspect missing Annex XIII fields, assign 3-tier access rules, and
                publish a mobile QR page at{" "}
                <code className="text-[14.5px] text-[#3eb8cf]">/p/[slug]</code>.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                  <p className="text-[13px] font-semibold text-[#3eb8cf]">
                    Step 1 · Intake
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-white">
                    Upload PDF or start blank
                  </p>
                </div>
                <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                  <p className="text-[13px] font-semibold text-[#34d399]">
                    Step 2 · Check
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-white">
                    Review 71 Annex XIII points
                  </p>
                </div>
                <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                  <p className="text-[13px] font-semibold text-[#fbbf24]">
                    Step 3 · Publish
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-white">
                    Download SVG &amp; PNG QR
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/app/new"
                  className="pressable inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] bg-[#3eb8cf] px-5 py-2.5 text-[15px] font-semibold text-[#08181d] transition-colors hover:bg-[#5ec8dc]"
                >
                  <span>Upload first spec PDF</span>
                  <ArrowRightIcon className="btn-arrow h-4 w-4" />
                </Link>
                <Link
                  href="/demo"
                  className="pressable inline-flex min-h-[46px] items-center justify-center rounded-[10px] bg-[#1d2229] px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#282e37]"
                >
                  Inspect /demo output
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px] bg-[#e8e7e3]">
                <Image
                  src="/images/casing-qr-macro.jpg"
                  alt="Laser-etched QR plate on anodized aluminum battery pack casing"
                  fill
                  sizes="(max-width: 1024px) 50vw, 380px"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px] bg-[#e8e7e3]">
                <Image
                  src="/images/battery-cutaway-25d.jpg"
                  alt="2.5D cutaway showing fuse, latch, cells, and BMS board"
                  fill
                  sizes="(max-width: 1024px) 50vw, 380px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter Bar + Engineering Ledger Table */}
      {!queryError && passports.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-[14px] bg-[#f4f4f2] p-3 sm:flex-row sm:items-center">
            <div
              role="tablist"
              aria-label="Filter passports by status"
              className="inline-flex rounded-[10px] bg-[#e8e7e3] p-1"
            >
              {(
                [
                  { id: "all", label: `All (${passports.length})` },
                  { id: "published", label: `Published (${publishedCount})` },
                  { id: "draft", label: `Drafts (${draftCount})` },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`pressable cursor-pointer rounded-[8px] px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors ${
                      active
                        ? "bg-white text-[#0f1114]"
                        : "text-[#4b4f57] hover:text-[#0f1114]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by product, SKU, or /p/slug..."
              aria-label="Filter passports by product name, SKU, or slug"
              className="input-apple w-full rounded-[9px] border border-[#dcdad4] bg-white px-3.5 py-2 text-[14px] text-[#0f1114] placeholder:text-[#4b4f57] sm:max-w-[280px]"
            />
          </div>

          <div className="overflow-x-auto rounded-[16px] bg-[#f9f9f7] p-4">
            <table className="w-full border-collapse text-left text-[14px]">
              <thead>
                <tr data-ui className="border-b border-[#dcdad4] text-[13px] font-semibold text-[#4b4f57]">
                  <th className="py-3 pr-4">Product &amp; route</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="hidden py-3 pr-4 sm:table-cell">
                    Fields populated
                  </th>
                  <th className="hidden py-3 pr-4 md:table-cell">Version</th>
                  <th className="hidden py-3 pr-4 md:table-cell">Updated</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody data-ui className="divide-y divide-[#e6e4de]">
                {filteredPassports.map((item) => {
                  const fillRatio = Math.min(
                    1,
                    Math.max(
                      0,
                      item.populatedCount / Math.max(1, item.totalFieldCount),
                    ),
                  );
                  return (
                    <tr
                      key={item.id}
                      className="align-middle transition-colors hover:bg-white"
                    >
                      <td className="py-4 pr-4">
                        <Link
                          href={`/app/passports/${item.id}`}
                          className="font-display text-[16px] font-semibold text-[#0f1114] hover:text-[#145b6e]"
                        >
                          {item.productName}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#4b4f57]">
                          {item.modelCode && (
                            <code className="rounded bg-[#e8e7e3] px-2 py-0.5 text-[12.5px] font-medium text-[#0f1114]">
                              {item.modelCode}
                            </code>
                          )}
                          <code>/p/{item.slug}</code>
                        </div>
                      </td>

                      <td className="whitespace-nowrap py-4 pr-4">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-[13px] font-semibold ${
                            item.status === "published"
                              ? "bg-[#edf8f2] text-[#156d49]"
                              : "bg-[#fdf6ec] text-[#7c380b]"
                          }`}
                        >
                          {item.status === "published" ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="hidden whitespace-nowrap py-4 pr-4 sm:table-cell">
                        <div className="flex items-center gap-3">
                          <span className="num text-[14px] font-semibold text-[#0f1114]">
                            {item.populatedCount} / {item.totalFieldCount}
                          </span>
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e0dfda]">
                            <div
                              style={{ transform: `scaleX(${fillRatio})` }}
                              className="progress-fill-smooth h-full w-full rounded-full bg-[#156d49]"
                            />
                          </div>
                        </div>
                      </td>

                      <td className="hidden whitespace-nowrap py-4 pr-4 md:table-cell">
                        <span className="num rounded-md bg-[#e8e7e3] px-2.5 py-1 text-[13px] font-semibold text-[#0f1114]">
                          {item.versionNumber ? `v${item.versionNumber}` : "—"}
                        </span>
                      </td>

                      <td className="hidden whitespace-nowrap py-4 pr-4 md:table-cell">
                        <span className="num text-[13.5px] text-[#4b4f57]">
                          {formatShortUtcDate(item.updatedAt)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap py-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          {item.status === "published" && (
                            <Link
                              href={`/p/${item.slug}`}
                              className="text-[13.5px] font-semibold text-[#156d49] underline-offset-4 hover:underline"
                            >
                              View public
                            </Link>
                          )}
                          <Link
                            href={`/app/passports/${item.id}`}
                            className="pressable inline-flex min-h-[38px] items-center rounded-[9px] bg-[#145b6e] px-3.5 text-[13.5px] font-semibold text-white hover:bg-[#0e4656]"
                          >
                            Review &amp; edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
