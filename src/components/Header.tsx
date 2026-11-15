import type { PassportMeta } from "@/types/passport";
import { BrandMark, InfoIcon } from "@/components/Icons";

interface HeaderProps {
  meta: PassportMeta;
  passportId: string;
  specLine: string;
}

export function Header({ meta, passportId, specLine }: HeaderProps) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-[960px] px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BrandMark className="mt-0.5 h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-tight text-[var(--muted)]">
                {meta.brand} · Digital Product Passport
              </p>
              <h1 className="mt-0.5 text-[21px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ink)] sm:text-[24px]">
                {meta.product}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--muted)]">
                <code className="rounded bg-[var(--well)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--ink)]">
                  {passportId}
                </code>
                <span aria-hidden="true">·</span>
                <span className="num">{specLine}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center self-start sm:self-center">
            <span
              data-testid="demo-badge"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--notice-border)] bg-[var(--notice-bg)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--notice-ink)]"
            >
              <InfoIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{meta.badgeText}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
