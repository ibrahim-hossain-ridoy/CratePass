export default function WorkspaceLoading() {
  return (
    <div className="min-h-svh bg-[#e8e7e3] p-3 md:flex md:gap-3 md:p-2.5">
      <div className="hidden w-[256px] shrink-0 p-4 md:block">
        <div className="h-9 w-40 rounded-[10px] bg-[#dcdad4]" />
        <div className="mt-8 space-y-2.5">
          <div className="h-10 rounded-[10px] bg-white/70" />
          <div className="h-10 rounded-[10px] bg-[#dcdad4]/70" />
          <div className="h-10 rounded-[10px] bg-[#dcdad4]/70" />
        </div>
      </div>

      <div className="min-h-[88svh] flex-1 rounded-[16px] bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between pb-6">
          <div className="space-y-2.5">
            <div className="h-5 w-36 rounded-md bg-[#f4f4f2]" />
            <div className="h-8 w-56 rounded-md bg-[#e8e7e3]" />
          </div>
          <div className="h-11 w-36 rounded-[10px] bg-[#e8e7e3]" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="h-24 rounded-[14px] bg-[#f4f4f2]" />
          <div className="h-24 rounded-[14px] bg-[#edf8f2]" />
          <div className="h-24 rounded-[14px] bg-[#f4f4f2]" />
          <div className="h-24 rounded-[14px] bg-[#e6f2f5]" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-16 rounded-[12px] bg-[#f4f4f2]" />
          <div className="h-16 rounded-[12px] bg-[#f4f4f2]" />
        </div>
      </div>
    </div>
  );
}
