import Link from "next/link";
import type { PassportMeta } from "@/types/passport";
import { BrandMark, InfoIcon } from "@/components/Icons";

interface HeaderProps {
  meta: PassportMeta;
  passportId: string;
  specLine: string;
}

export function Header({ meta, passportId, specLine }: HeaderProps) {
  return (
    <header className="bg-[#101214] text-[#f4f3ef]">
      <div className="mx-auto max-w-[1040px] px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <Link
              href="/"
              aria-label="Return to landing page"
              className="pressable mt-0.5 shrink-0 rounded-[10px]"
            >
              <BrandMark className="h-9 w-9" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#c4c8d0]">
                <span
                  aria-hidden="true"
                  className="status-pulse h-2 w-2 rounded-full bg-[#34d399]"
                />
                <span className="font-semibold text-white">
                  {meta.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span>Digital Product Passport</span>
              </div>

              <h1 className="text-title-page mt-1 text-white">
                {meta.product}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
                <code className="rounded-md bg-[#1d2229] px-2.5 py-0.5 text-[13px] font-medium text-[#3eb8cf]">
                  {passportId}
                </code>
                <span className="num rounded-md bg-[#171a1e] px-2.5 py-0.5 font-medium text-[#f4f3ef]">
                  {specLine}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center self-start sm:self-center">
            <span
              data-testid="demo-badge"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#2a2114] px-3.5 py-2 text-[13px] font-semibold text-[#fbbf24]"
            >
              <InfoIcon className="h-4 w-4 shrink-0 text-[#fbbf24]" />
              <span>{meta.badgeText}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
