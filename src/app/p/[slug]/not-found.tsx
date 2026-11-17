import Link from "next/link";
import { BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";

export default function PublicPassportNotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-[#e8e7e0] text-[#0f1114]">
      <header className="bg-[#101214] text-white">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex min-h-[44px] items-center gap-3">
            <BrandMark className="h-8 w-8 shrink-0" />
            <span className="font-display text-[15.5px] font-semibold tracking-tight">
              {siteConfig.siteName}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-5 py-12">
        <div className="rounded-[18px] bg-white p-7 sm:p-9">
          <p className="text-[13.5px] font-semibold text-[#145b6e]">
            404 · Passport unavailable
          </p>
          <h1 className="text-title-page mt-2 text-[#0f1114]">
            Battery passport not found or unpublished
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-[#26292e]">
            The manufacturer may not have published this Digital Product Passport yet,
            or the record has been withdrawn to draft status.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="pressable inline-flex min-h-[44px] items-center rounded-[10px] bg-[#145b6e] px-5 text-[14.5px] font-semibold text-white hover:bg-[#0e4656]"
            >
              View sample (/demo)
            </Link>
            <Link
              href="/"
              className="pressable inline-flex min-h-[44px] items-center rounded-[10px] bg-[#eae7e0] px-4.5 text-[14.5px] font-semibold text-[#0f1114] hover:bg-[#dcd8cf]"
            >
              Return home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
