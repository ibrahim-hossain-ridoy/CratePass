import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, BrandMark, PdfFileIcon, QrGridIcon } from "@/components/Icons";
import { LoginForm } from "@/components/auth/LoginForm";
import { LandingSmoothScroll } from "@/components/landing/LandingSmoothScroll";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function LoginContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ error?: string }>;
}) {
  const configured = isSupabaseConfigured();
  const params = await searchParamsPromise;

  if (configured) {
    const supabase = await createServerSupabaseClient();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (data?.user) {
      redirect("/app");
    }
  }

  const initialError =
    params.error === "auth_callback_failed"
      ? "Sign-in link expired or invalid. Request a new magic link or sign in with password."
      : undefined;

  return (
    <LoginForm supabaseConfigured={configured} initialError={initialError} />
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-[#e8e7e3] text-[#0f1114]">
      <LandingSmoothScroll />

      {/* Symmetrical Studio Header */}
      <header className="bg-[#e8e7e3]">
        <div className="page-shell flex h-[72px] items-center justify-between gap-4">
          <Link
            href="/"
            className="pressable inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[#0f1114]"
          >
            <BrandMark className="h-8 w-8 shrink-0" />
            <span className="font-display whitespace-nowrap text-[16px] font-semibold tracking-tight text-[#0f1114]">
              {siteConfig.siteName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="pressable inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#145b6e] px-3.5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#0e4656] sm:px-4 sm:text-[15px]"
            >
              <span>See live demo</span>
              <ArrowRightIcon className="btn-arrow h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 lg:py-16">
        <div className="page-shell grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Auth Heading + Form */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden">
              <h1 className="text-display-hero hero-line-inner max-w-[16ch] text-[#0f1114]">
                Open your brand workspace
              </h1>
            </div>

            <p className="hero-fade-rise mt-5 max-w-[46ch] text-[17px] leading-relaxed text-[#22252a]">
              Upload a battery specification PDF, inspect 71-point Annex XIII
              completeness status, and publish a scannable QR passport page. Your
              organization workspace is provisioned automatically on first sign-in.
            </p>

            <div className="mt-8">
              <Suspense
                fallback={<div className="h-[320px] rounded-[20px] bg-white p-8" />}
              >
                <LoginContent searchParamsPromise={searchParams} />
              </Suspense>
            </div>
          </div>

          {/* Right Column: Live Workspace Console Preview + Dedicated Hardware Specimen */}
          <div className="hero-stage-rise space-y-4 lg:col-span-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-[#0f1114]">
                What you manage inside /app
              </h2>
              <span className="text-[14px] font-semibold text-[#145b6e]">
                71-point Annex XIII console
              </span>
            </div>

            {/* Interactive-Style Workspace Console Preview */}
            <div
              data-ui="workspace-preview"
              className="hero-enter-1 overflow-hidden rounded-[20px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6"
            >
              {/* Top Hardware Reference Banner (uses /images/battery-pack-studio.jpg — unique to /login) */}
              <div className="grid grid-cols-1 items-center gap-4 rounded-[14px] bg-[#171a1e] p-3.5 sm:grid-cols-12">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-[#e8e7e3] sm:col-span-5">
                  <Image
                    src="/images/battery-pack-studio.jpg"
                    alt="DB-36V battery pack photographed on neutral studio surface"
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 240px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-7">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#0a2921] px-2 py-0.5 text-[11.5px] font-semibold text-[#6ee7b7]">
                      Published v1
                    </span>
                    <span className="num text-[12.5px] font-semibold text-[#3eb8cf]">
                      /p/db-36v-pack
                    </span>
                  </div>
                  <p className="font-display text-[16px] font-semibold text-white">
                    DB-36V Commuter Battery Pack
                  </p>
                  <p className="text-[13px] text-[#c4c8d0]">
                    {WORKING_FIELD_LIST_NOTICE}
                  </p>
                </div>
              </div>

              {/* 3 Self-Explanatory Workspace Modules */}
              <div className="mt-4 space-y-2.5">
                <div className="hero-enter-2 flex items-center justify-between gap-3 rounded-[12px] bg-[#171a1e] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d2229] text-[#3eb8cf]">
                      <PdfFileIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold text-white">
                        1. OEM Spec PDF or Blank Draft Intake
                      </p>
                      <p className="text-[12.5px] text-[#c4c8d0]">
                        Extracts 51 static fields with source snippets &amp; flags gaps
                      </p>
                    </div>
                  </div>
                  <span className="num shrink-0 rounded-md bg-[#20242a] px-2.5 py-1 text-[12px] font-semibold text-[#34d399]">
                    LMT · EV · Ind
                  </span>
                </div>

                <div className="hero-enter-2 rounded-[12px] bg-[#171a1e] px-4 py-3">
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span className="font-semibold text-white">
                      2. 71-Point Completeness &amp; 3-Tier Access Check
                    </span>
                    <span className="num font-semibold text-[#34d399]">
                      49 / 51 static (96%)
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#101214]">
                    <div className="bar-fill-enter h-full w-[94%] rounded-full bg-[#34d399]" />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-[12px] text-[#c4c8d0]">
                    <span>Public: 30 pts</span>
                    <span>Legitimate interest: 27 pts</span>
                    <span>Authorities only: 14 pts</span>
                  </div>
                </div>

                <div className="hero-enter-3 flex items-center justify-between gap-3 rounded-[12px] bg-[#171a1e] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 text-[#0f1114]">
                      <QrGridIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[14.5px] font-semibold text-white">
                        3. Print-Ready QR Labels &amp; Immutable Snapshots
                      </p>
                      <p className="text-[12.5px] text-[#c4c8d0]">
                        Download SVG/PNG casing stickers &amp; export GDPR JSON
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-[#145b6e] px-2.5 py-1 text-[12px] font-semibold text-white">
                    SVG + PNG
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0d0f12] py-8 text-[14px] text-[#c4c8d0]">
        <div className="page-shell flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-[#e4e6eb]">
            Technical hosting infrastructure only — not legal advice or regulatory
            certification.
          </p>
          <div className="flex flex-wrap items-center gap-6 font-medium text-[#f4f3ef]">
            <Link href="/demo" className="hover:text-[#7ce3f4]">
              Live demo
            </Link>
            <Link href="/terms" className="hover:text-[#7ce3f4]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#7ce3f4]">
              Privacy
            </Link>
            <Link href="/disclaimer" className="hover:text-[#7ce3f4]">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
