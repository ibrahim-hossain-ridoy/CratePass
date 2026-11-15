import Link from "next/link";
import { BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";

export default function PublicPassportNotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span className="text-[15px] font-semibold tracking-tight">
              {siteConfig.siteName}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] p-6">
          <p className="font-mono text-[12px] font-medium text-[var(--accent-ink)]">
            404 · PASSPORT UNAVAILABLE
          </p>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-[var(--ink)]">
            Battery passport not found or unpublished
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
            The manufacturer may not have published this Digital Product Passport yet,
            or the record has been withdrawn to draft status.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="pressable inline-flex min-h-[42px] items-center rounded-[8px] bg-[var(--accent-ink)] px-4 text-[14px] font-semibold text-white"
            >
              View sample (/demo)
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[42px] items-center rounded-[8px] border border-[var(--border-strong)] px-4 text-[14px] font-medium text-[var(--ink)]"
            >
              Return home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
