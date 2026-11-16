import Link from "next/link";
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
  const publishedCount = passports.filter((p) => p.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Sheet header row */}
      <div className="flex flex-col gap-4 border-b border-[var(--rule)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12.5px] font-medium text-[var(--muted)]">
            {orgName}
          </p>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Battery Passports
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--muted)]">
            {WORKING_FIELD_LIST_NOTICE}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-[8px] border border-[var(--border-strong)] bg-[var(--well-soft)] px-3.5 py-2 text-[12.5px]">
            <span className="text-[var(--muted)]">Daily PDF checks </span>
            <span className="num font-mono font-bold text-[var(--ink)]">
              {dailyExtractionsUsed} / {dailyExtractionLimit}
            </span>
          </div>
          <Link
            href="/app/new"
            className="pressable chamfer-sm inline-flex min-h-[44px] items-center justify-center bg-[var(--accent)] px-5 py-2 text-[14px] font-bold text-white hover:bg-[var(--accent-ink)]"
          >
            New passport
          </Link>
        </div>
      </div>

      {/* Summary metrics strip */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--well-soft)] p-4">
          <dt className="font-mono text-[11.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Total records
          </dt>
          <dd className="num mt-1 text-[26px] font-bold text-[var(--ink)]">
            {passports.length}
          </dd>
        </div>
        <div className="rounded-[12px] border border-[var(--positive-border)] bg-[var(--positive-bg)] p-4">
          <dt className="font-mono text-[11.5px] font-semibold uppercase tracking-wider text-[var(--positive)]">
            Published pages
          </dt>
          <dd className="num mt-1 text-[26px] font-bold text-[var(--positive)]">
            {publishedCount}
          </dd>
        </div>
        <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--well-soft)] p-4">
          <dt className="font-mono text-[11.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Drafts in check
          </dt>
          <dd className="num mt-1 text-[26px] font-bold text-[var(--ink)]">
            {passports.length - publishedCount}
          </dd>
        </div>
      </dl>

      {queryError && (
        <div
          role="alert"
          className="rounded-[8px] border border-red-300 bg-red-50 p-4 text-[14px] text-red-900"
        >
          <p className="font-semibold">Unable to load passport list</p>
          <p className="mt-1 text-[13px]">{queryError}</p>
        </div>
      )}

      {/* Empty state */}
      {!queryError && passports.length === 0 && (
        <section className="rounded-[12px] border border-[#233242] bg-[#0B1016] p-6 text-center text-[#F1F5F9] sm:p-9">
          <p className="font-mono text-[11.5px] font-bold uppercase tracking-wider text-[#34D399]">
            + WORKSPACE READY
          </p>
          <h2 className="mt-1.5 text-[20px] font-bold text-white">
            No battery passports created yet
          </h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-[#94A3B8]">
            Upload an OEM battery spec PDF to inspect missing fields, review
            technical details, and publish a mobile QR page at{" "}
            <code className="font-mono text-[13px] text-[#6EE7B7]">/p/[slug]</code>.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/app/new"
              className="pressable chamfer-sm inline-flex min-h-[44px] items-center justify-center bg-[#34D399] px-5 py-2.5 text-[14px] font-bold text-[#052E16] hover:bg-[#6EE7B7]"
            >
              Upload first spec PDF
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[8px] border border-[#233242] bg-[#131D28] px-4 py-2 text-[14px] font-semibold text-white hover:border-[#34D399]"
            >
              Inspect /demo output
            </Link>
          </div>
        </section>
      )}

      {/* Hairline-ruled list / table */}
      {!queryError && passports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[12px] font-medium text-[var(--muted)]">
                <th className="py-2.5 pr-3">Product</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="hidden py-2.5 pr-3 sm:table-cell">Fields populated</th>
                <th className="hidden py-2.5 pr-3 md:table-cell">Version</th>
                <th className="hidden py-2.5 pr-3 md:table-cell">Updated</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {passports.map((item) => (
                <tr key={item.id} className="align-middle">
                  <td className="py-3.5 pr-3">
                    <Link
                      href={`/app/passports/${item.id}`}
                      className="font-semibold text-[var(--ink)] hover:text-[var(--accent-ink)]"
                    >
                      {item.productName}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--muted)]">
                      {item.modelCode && (
                        <code className="font-mono text-[11.5px]">
                          {item.modelCode}
                        </code>
                      )}
                      <span className="font-mono text-[11.5px]">
                        /p/{item.slug}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 pr-3 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-[12px] font-medium ${
                        item.status === "published"
                          ? "border border-[var(--positive-border)] bg-[var(--positive-bg)] text-[var(--positive)]"
                          : "border border-[var(--notice-border)] bg-[var(--notice-bg)] text-[var(--notice-ink)]"
                      }`}
                    >
                      {item.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>

                  <td className="hidden py-3.5 pr-3 whitespace-nowrap sm:table-cell">
                    <span className="num text-[var(--ink)]">
                      {item.populatedCount} / {item.totalFieldCount}
                    </span>
                  </td>

                  <td className="hidden py-3.5 pr-3 whitespace-nowrap md:table-cell">
                    <span className="num font-mono text-[12.5px] text-[var(--muted)]">
                      {item.versionNumber ? `v${item.versionNumber}` : "—"}
                    </span>
                  </td>

                  <td className="hidden py-3.5 pr-3 whitespace-nowrap md:table-cell">
                    <span className="num text-[13px] text-[var(--muted)]">
                      {formatShortUtcDate(item.updatedAt)}
                    </span>
                  </td>

                  <td className="py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      {item.status === "published" && (
                        <Link
                          href={`/p/${item.slug}`}
                          className="text-[13px] font-medium text-[var(--positive)] underline-offset-4 hover:underline"
                        >
                          View public
                        </Link>
                      )}
                      <Link
                        href={`/app/passports/${item.id}`}
                        className="inline-flex min-h-[36px] items-center rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
