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
    <div className="space-y-6">
      <div className="border-b border-[var(--rule)] pb-5">
        <p className="font-mono text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          {orgName}
        </p>
        <h1 className="text-title-page mt-0.5 font-bold text-[var(--ink)]">
          Privacy, GDPR Export &amp; Legal Drafts
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">
          Export your workspace records in JSON or remove unpublished draft PDFs and
          records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* GDPR JSON export card */}
        <section className="surface-elevated rounded-[14px] p-5 lg:col-span-6">
          <h2 className="text-[16px] font-bold text-[var(--ink)]">
            Export organization records (JSON)
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">
            Download a portable JSON snapshot of{" "}
            <code className="font-mono text-[var(--ink)]">{orgSlug}</code> including
            products, working drafts, immutable version snapshots, PDF file metadata,
            and recent audit events.
          </p>
          <div className="mt-4">
            <a
              href="/api/org/export"
              className="pressable chamfer-sm inline-flex min-h-[42px] items-center justify-center bg-[var(--accent)] px-4 py-2 text-[13.5px] font-bold text-white hover:bg-[var(--accent-ink)]"
            >
              Download JSON export
            </a>
          </div>
        </section>

        {/* Draft legal documents summary */}
        <section className="surface-elevated rounded-[14px] bg-[var(--well-soft)] p-5 lg:col-span-6">
          <h2 className="text-[16px] font-bold text-[var(--ink)]">
            Legal &amp; EU data-processing drafts
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">
            Review the placeholder policies published on the public site (marked{" "}
            <strong className="text-[var(--ink)]">TODO: lawyer review</strong>):
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/terms"
              className="pressable inline-flex min-h-[38px] items-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
            >
              Terms (Draft)
            </Link>
            <Link
              href="/privacy"
              className="pressable inline-flex min-h-[38px] items-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
            >
              Privacy &amp; GDPR (Draft)
            </Link>
            <Link
              href="/disclaimer"
              className="pressable inline-flex min-h-[38px] items-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
            >
              Disclaimer (Draft)
            </Link>
          </div>
        </section>
      </div>

      {/* Deletable unpublished drafts */}
      <section className="surface-elevated rounded-[14px] p-5">
        <h2 className="text-[16px] font-bold text-[var(--ink)]">
          Delete unpublished drafts &amp; source PDFs
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">
          Drafts with zero published snapshots can be deleted immediately along with
          their private spec PDF objects. Records with immutable published versions must
          first be unpublished from public view; contact{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="font-medium text-[var(--ink)] underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </a>{" "}
          for full organization GDPR erasure requests.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="tab-panel-enter mt-3 rounded-[8px] border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-900"
          >
            {errorMsg}
          </div>
        )}

        {feedback && (
          <div
            role="status"
            className="tab-panel-enter mt-3 rounded-[8px] border border-[var(--positive-border)] bg-[var(--positive-bg)] px-3.5 py-2.5 text-[13px] text-[var(--positive)]"
          >
            {feedback}
          </div>
        )}

        {candidates.length === 0 ? (
          <p className="mt-4 text-[13.5px] text-[var(--muted)]">
            No passport records in this workspace yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
            {candidates.map((item) => {
              const deletable = item.versionCount === 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--ink)]">
                      {item.productName}
                    </p>
                    <p className="font-mono text-[12px] text-[var(--muted)]">
                      /p/{item.slug} · {item.versionCount} published version
                      {item.versionCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  {deletable ? (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteDraft(item)}
                      className="pressable inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-[8px] border border-red-300 bg-red-50 px-3 text-[13px] font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete draft & PDF"}
                    </button>
                  ) : (
                    <Link
                      href={`/app/passports/${item.id}`}
                      className="pressable inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--border-strong)] px-3 text-[13px] font-medium text-[var(--muted)] hover:text-[var(--ink)]"
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
