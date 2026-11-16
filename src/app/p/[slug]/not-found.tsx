import Link from "next/link";
import { BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";

export default function PublicPassportNotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      <header className="border-b border-[#1E2C3A] bg-[#0B1016] text-white">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-h-[44px] items-center gap-2.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <span className="text-[15px] font-bold tracking-tight">
              {siteConfig.siteName}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-[14px] border border-[var(--border-strong)] bg-[var(--surface)] p-6 sm:p-8">
          <p className="font-mono text-[12px] font-bold text-[var(--accent)]">
            404 · PASSPORT UNAVAILABLE
          </p>
          <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[var(--ink)]">
            Battery passport not found or unpublished
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--muted)]">
            The manufacturer may not have published this Digital Product Passport yet,
            or the record has been withdrawn to draft status.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="pressable chamfer-sm inline-flex min-h-[44px] items-center bg-[var(--accent)] px-5 text-[14px] font-bold text-white hover:bg-[var(--accent-ink)]"
            >
              View sample (/demo)
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-[8px] border border-[var(--border-strong)] px-4 text-[14px] font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
            >
              Return home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
