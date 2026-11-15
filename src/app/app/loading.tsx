export default function WorkspaceLoading() {
  return (
    <div className="min-h-svh bg-[var(--ground)] p-3 md:flex md:gap-3 md:p-2">
      <div className="hidden w-[220px] shrink-0 p-3 md:block">
        <div className="h-8 w-36 rounded bg-[var(--well)]" />
        <div className="mt-8 space-y-2">
          <div className="h-9 rounded bg-[var(--well)]" />
          <div className="h-9 rounded bg-[var(--well)]" />
        </div>
      </div>

      <div className="min-h-[85svh] flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between border-b border-[var(--rule)] pb-5">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-[var(--well)]" />
            <div className="h-7 w-48 rounded bg-[var(--well)]" />
          </div>
          <div className="h-10 w-32 rounded-[8px] bg-[var(--well)]" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-14 rounded bg-[var(--well-soft)]" />
          <div className="h-14 rounded bg-[var(--well-soft)]" />
          <div className="h-14 rounded bg-[var(--well-soft)]" />
        </div>
      </div>
    </div>
  );
}
