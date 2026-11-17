import Link from "next/link";
import { BrandMark } from "@/components/Icons";
import { siteConfig } from "@/config/site";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 bg-[#e8e7e3]">
      <div className="page-shell flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          className="pressable inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[#0f1114]"
        >
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="font-display whitespace-nowrap text-[16px] font-semibold tracking-tight text-[#0f1114]">
            {siteConfig.brandName}
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 whitespace-nowrap text-[15px] font-medium text-[#22252a] lg:flex"
        >
          <a
            href="#workflow"
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#145b6e]"
          >
            Workflow
          </a>
          <a
            href="#audiences"
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#145b6e]"
          >
            Who it is for
          </a>
          <a
            href="#preview"
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#145b6e]"
          >
            Preview
          </a>
          <a
            href="#contact"
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#145b6e]"
          >
            Contact
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/login"
            className="pressable hidden shrink-0 whitespace-nowrap rounded-[10px] bg-[#dcdad4] px-4 py-2 text-[15px] font-semibold text-[#0f1114] transition-colors hover:bg-[#cfccc4] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/demo"
            className="pressable inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] bg-[#145b6e] px-4.5 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-[#0e4656]"
          >
            See live demo
          </Link>
        </div>
      </div>
    </header>
  );
}
