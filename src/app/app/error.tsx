"use client";

import Link from "next/link";

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#e8e7e3] p-5">
      <div className="max-w-[460px] rounded-[20px] bg-white p-7 text-[#0f1114]">
        <h1 className="font-display text-[22px] font-semibold text-[#0f1114]">
          Workspace request failed
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-[#22252a]">
          Something interrupted loading your battery passport workspace. Retry the
          request or return to the home page.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="pressable inline-flex min-h-[44px] cursor-pointer items-center rounded-[10px] bg-[#145b6e] px-5 text-[14.5px] font-semibold text-white hover:bg-[#0e4656]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="pressable inline-flex min-h-[44px] items-center rounded-[10px] bg-[#f4f4f2] px-4.5 text-[14.5px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
