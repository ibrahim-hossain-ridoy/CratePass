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
    <header className="border-b border-[#1E2C3A] bg-[#0B1016] text-[#F1F5F9]">
      <div className="mx-auto max-w-[1040px] px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <Link
              href="/"
              aria-label="Return to landing page"
              className="mt-0.5 shrink-0"
            >
              <BrandMark className="h-9 w-9" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#94A3B8]">
                <span
                  aria-hidden="true"
                  className="status-pulse h-2 w-2 rounded-full bg-[#34D399]"
                />
                <span className="uppercase tracking-wider text-[#CBD5E1]">
                  {meta.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span>Digital Product Passport</span>
              </div>

              <h1 className="mt-1 text-[23px] font-bold leading-tight tracking-[-0.025em] text-white sm:text-[28px]">
                {meta.product}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                <code className="rounded border border-[#233242] bg-[#121B24] px-2 py-0.5 font-mono text-[12px] font-semibold text-[#6EE7B7]">
                  {passportId}
                </code>
                <span className="num rounded border border-[#233242] bg-[#121B24] px-2.5 py-0.5 font-semibold text-[#F1F5F9]">
                  {specLine}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center self-start sm:self-center">
            <span
              data-testid="demo-badge"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] border border-[#F59E0B]/40 bg-[#291D09] px-3 py-2 text-[12.5px] font-semibold text-[#FCD34D]"
            >
              <InfoIcon className="h-4 w-4 shrink-0 text-[#FBBF24]" />
              <span>{meta.badgeText}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
