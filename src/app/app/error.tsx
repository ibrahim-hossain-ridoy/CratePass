"use client";

import Link from "next/link";

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--ground)] p-4">
      <div className="max-w-[440px] rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] p-6">
        <h1 className="text-[20px] font-semibold text-[var(--ink)]">
          Workspace request failed
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
          Something interrupted loading your battery passport workspace. Retry the
          request or return to the home page.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="pressable inline-flex min-h-[42px] items-center rounded-[8px] bg-[var(--accent-ink)] px-4 text-[14px] font-semibold text-white cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[42px] items-center rounded-[8px] border border-[var(--border-strong)] px-4 text-[14px] font-medium text-[var(--ink)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
