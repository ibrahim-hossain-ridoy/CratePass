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
    <header className="border-b border-[#2E2924] bg-[#141210] text-[#F7F5F0]">
      <div className="mx-auto max-w-[1040px] px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <Link
              href="/"
              aria-label="Return to landing page"
              className="pressable mt-0.5 shrink-0 rounded-[8px]"
            >
              <BrandMark className="h-9 w-9" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#A69E94]">
                <span
                  aria-hidden="true"
                  className="status-pulse h-2 w-2 rounded-full bg-[#34D399]"
                />
                <span className="uppercase tracking-wider text-[#E6E1D8]">
                  {meta.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span>Digital Product Passport</span>
              </div>

              <h1 className="text-title-page mt-1 font-bold text-white">
                {meta.product}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                <code className="rounded border border-[#332E28] bg-[#1E1B17] px-2 py-0.5 font-mono text-[12px] font-semibold text-[#FB923C]">
                  {passportId}
                </code>
                <span className="num rounded border border-[#332E28] bg-[#1E1B17] px-2.5 py-0.5 font-semibold text-[#F7F5F0]">
                  {specLine}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center self-start sm:self-center">
            <span
              data-testid="demo-badge"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] border border-[#F59E0B]/40 bg-[#2C1E0A] px-3 py-2 text-[12.5px] font-semibold text-[#FCD34D]"
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
