"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export interface DraftDeletionCandidate {
  id: string;
  slug: string;
  productName: string;
  versionCount: number;
}

interface PrivacyWorkspaceProps {
  orgName: string;
  orgSlug: string;
  candidates: DraftDeletionCandidate[];
}

export function PrivacyWorkspace({
  orgName,
  orgSlug,
  candidates: initialCandidates,
}: PrivacyWorkspaceProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleDeleteDraft(item: DraftDeletionCandidate) {
    setErrorMsg(null);
    setFeedback(null);
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/passports/${item.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErrorMsg(json.error || "Could not delete draft passport.");
        return;
      }
      setCandidates((prev) => prev.filter((c) => c.id !== item.id));
      setFeedback(`Deleted unpublished draft "${item.productName}" and its uploaded PDF.`);
      router.refresh();
    } catch {
      setErrorMsg("Network error deleting draft record.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div data-ui className="space-y-6">
      <div className="pb-2">
        <span className="inline-flex items-center rounded-md bg-[#e8f3f6] px-2.5 py-0.5 text-[12px] font-semibold text-[#0b3c49]">
          {orgName}
        </span>
        <h1 className="font-display mt-2 text-[24px] font-bold tracking-tight text-[#0f1114] sm:text-[28px]">
          Privacy, GDPR Export &amp; Legal Drafts
        </h1>
        <p className="mt-1 text-[13.5px] text-[#505660]">
          Export your workspace records in JSON or remove unpublished draft PDFs and
          records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* GDPR JSON export card */}
        <section className="flex flex-col justify-between rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6 lg:col-span-6">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-[#0f1114]">
              Export organization records (JSON)
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#505660]">
              Download a portable JSON snapshot of{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-[#0f1114]">
                {orgSlug}
              </code>{" "}
              including products, working drafts, immutable version snapshots, PDF
              file metadata, and recent audit events.
            </p>
          </div>
          <div className="mt-5">
            <a
              href="/api/org/export"
              className="pressable group inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4250]"
            >
              <span>Download JSON export</span>
              <span aria-hidden="true" className="btn-arrow">
                ↓
              </span>
            </a>
          </div>
        </section>

        {/* Draft legal documents summary */}
        <section className="flex flex-col justify-between rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6 lg:col-span-6">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-[#0f1114]">
              Legal &amp; EU data-processing drafts
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#505660]">
              Review the placeholder policies published on the public site (marked{" "}
              <strong className="font-semibold text-[#0f1114]">
                TODO: lawyer review
              </strong>
              ):
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/terms"
              className="pressable inline-flex min-h-[40px] items-center rounded-[10px] border border-[#dad9d3] bg-white px-3.5 text-[13px] font-semibold text-[#0f1114] hover:border-[#0f1114]"
            >
              Terms (Draft)
            </Link>
            <Link
              href="/privacy"
              className="pressable inline-flex min-h-[40px] items-center rounded-[10px] border border-[#dad9d3] bg-white px-3.5 text-[13px] font-semibold text-[#0f1114] hover:border-[#0f1114]"
            >
              Privacy &amp; GDPR (Draft)
            </Link>
            <Link
              href="/disclaimer"
              className="pressable inline-flex min-h-[40px] items-center rounded-[10px] border border-[#dad9d3] bg-white px-3.5 text-[13px] font-semibold text-[#0f1114] hover:border-[#0f1114]"
            >
              Disclaimer (Draft)
            </Link>
          </div>
        </section>
      </div>

      {/* Deletable unpublished drafts */}
      <section className="rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-semibold text-[#0f1114]">
          Delete unpublished drafts &amp; source PDFs
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[#505660]">
          Drafts with zero published snapshots can be deleted immediately along with
          their private spec PDF objects. Records with immutable published versions must
          first be unpublished from public view; contact{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="font-semibold text-[#0f1114] underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </a>{" "}
          for full organization GDPR erasure requests.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="tab-panel-enter mt-3.5 rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-900"
          >
            {errorMsg}
          </div>
        )}

        {feedback && (
          <div
            role="status"
            className="tab-panel-enter mt-3.5 rounded-[10px] border border-[#9fd4b9] bg-[#edf8f2] px-4 py-3 text-[13px] font-medium text-[#156d49]"
          >
            {feedback}
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="mt-4 rounded-[12px] bg-white px-4 py-5 text-[13.5px] text-[#505660]">
            No passport records in this workspace yet.
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {candidates.map((item) => {
              const deletable = item.versionCount === 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[12px] bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-[#0f1114]">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[#505660]">
                      <code>/p/{item.slug}</code> · {item.versionCount} published version
                      {item.versionCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  {deletable ? (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteDraft(item)}
                      className="pressable inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-[10px] border border-red-300 bg-red-50 px-3.5 text-[13px] font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete draft & PDF"}
                    </button>
                  ) : (
                    <Link
                      href={`/app/passports/${item.id}`}
                      className="pressable inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-[10px] border border-[#dad9d3] bg-[#f4f4f2] px-3.5 text-[13px] font-semibold text-[#0f1114] hover:border-[#0f1114]"
                    >
                      Manage published status
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
