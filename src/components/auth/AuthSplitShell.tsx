import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowRightIcon,
  BrandMark,
  PdfFileIcon,
  QrGridIcon,
} from "@/components/Icons";
import { LoginForm, type AuthIntent } from "@/components/auth/LoginForm";
import { LandingSmoothScroll } from "@/components/landing/LandingSmoothScroll";
import { WORKING_FIELD_LIST_NOTICE } from "@/config/battery-fields";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface AuthSplitShellProps {
  intent: AuthIntent;
  searchParamsPromise: Promise<{ error?: string }>;
}

async function AuthFormLoader({
  intent,
  searchParamsPromise,
}: AuthSplitShellProps) {
  await connection();
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
    <LoginForm
      supabaseConfigured={configured}
      initialIntent={intent}
      initialError={initialError}
    />
  );
}

export function AuthSplitShell({
  intent,
  searchParamsPromise,
}: AuthSplitShellProps) {
  const isSignUp = intent === "signup";

  return (
    <div className="flex min-h-svh flex-col bg-[#e8e7e3] text-[#0f1114]">
      <LandingSmoothScroll />

      {/* Symmetrical Studio Auth Header with Direct Sign in + Sign up Actions */}
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

          <div className="flex items-center gap-2.5">
            <Link
              href="/demo"
              className="hidden whitespace-nowrap px-3 py-2 text-[14.5px] font-medium text-[#22252a] transition-colors hover:text-[#145b6e] sm:inline-flex"
            >
              Live demo
            </Link>
            <Link
              href="/login"
              className={`pressable inline-flex items-center justify-center whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[14px] font-semibold transition-colors sm:px-4 sm:text-[15px] ${
                !isSignUp
                  ? "bg-[#145b6e] text-white hover:bg-[#0e4656]"
                  : "bg-[#dcdad4] text-[#0f1114] hover:bg-[#cfccc4]"
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={`pressable inline-flex items-center justify-center whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[14px] font-semibold transition-colors sm:px-4 sm:text-[15px] ${
                isSignUp
                  ? "bg-[#145b6e] text-white hover:bg-[#0e4656]"
                  : "bg-[#dcdad4] text-[#0f1114] hover:bg-[#cfccc4]"
              }`}
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 lg:py-16">
        <div className="page-shell grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Auth Heading + Card */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden">
              <h1 className="text-display-hero hero-line-inner max-w-[16ch] text-[#0f1114]">
                {isSignUp
                  ? "Create your brand workspace"
                  : "Sign in to your workspace"}
              </h1>
            </div>

            <p className="hero-fade-rise mt-5 max-w-[46ch] text-[17px] leading-relaxed text-[#22252a]">
              {isSignUp
                ? "Start free in seconds. Upload an OEM battery specification PDF or create a blank draft, run a 71-point Annex XIII completeness check, and prepare scannable QR passports."
                : "Welcome back. Manage your battery drafts, inspect 71-point Annex XIII completeness status, and download print-ready SVG or PNG casing QR labels."}
            </p>

            <div className="mt-8">
              <Suspense
                fallback={
                  <div className="h-[360px] rounded-[22px] bg-white p-8" />
                }
              >
                <AuthFormLoader
                  intent={intent}
                  searchParamsPromise={searchParamsPromise}
                />
              </Suspense>
            </div>
          </div>

          {/* Right Column: Obsidian Product & Workspace Stage */}
          <div className="hero-stage-rise space-y-4 lg:col-span-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-[#0f1114]">
                {isSignUp
                  ? "Included in your free workspace"
                  : "What you manage inside /app"}
              </h2>
              <span className="text-[14px] font-semibold text-[#145b6e]">
                71-point Annex XIII console
              </span>
            </div>

            <div
              data-ui="workspace-preview"
              className="hero-enter-1 overflow-hidden rounded-[22px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6"
            >
              {/* Top Studio Visual */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[14px] bg-[#171a1e]">
                <Image
                  src={
                    isSignUp
                      ? "/images/hero-passport-ecosystem.jpg"
                      : "/images/battery-pack-studio.jpg"
                  }
                  alt={
                    isSignUp
                      ? "Battery specification sheets, cutaway lithium pack with laser-etched QR code, and mobile Digital Product Passport"
                      : "DB-36V battery pack photographed on neutral studio surface"
                  }
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#101214]/90 px-3.5 py-2 text-[13px] text-white">
                  <span className="font-semibold">
                    {isSignUp
                      ? "Free Plan · Zero vendor lock-in"
                      : "DB-36V Commuter Pack · Published v1"}
                  </span>
                  <span className="font-semibold text-[#3eb8cf]">
                    {isSignUp ? "Open JSON export" : "/p/db-36v-pack"}
                  </span>
                </div>
              </div>

              {/* 3 Workspace Capability Rows */}
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
                      <p className="text-[13px] text-[#c4c8d0]">
                        Extracts 50 static fields with source snippets &amp; flags gaps
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
                      50 static · 21 dynamic BMS (71 pts)
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#101214]">
                    <div className="bar-fill-enter h-full w-[94%] rounded-full bg-[#34d399]" />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-[12.5px] text-[#c4c8d0]">
                    <span>Public: 45 pts</span>
                    <span>Legitimate interest: 25 pts</span>
                    <span>Authorities only: 1 pt</span>
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
                      <p className="text-[13px] text-[#c4c8d0]">
                        {WORKING_FIELD_LIST_NOTICE}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/demo"
                    className="pressable inline-flex shrink-0 items-center gap-1 rounded-md bg-[#145b6e] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#1a748b]"
                  >
                    <span>Demo</span>
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
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
            <Link href="/pricing" className="hover:text-[#7ce3f4]">
              Pricing
            </Link>
            <Link href="/demo" className="hover:text-[#7ce3f4]">
              Live demo
            </Link>
            <Link href="/terms" className="hover:text-[#7ce3f4]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#7ce3f4]">
              Privacy
            </Link>
            <Link href="/refund" className="hover:text-[#7ce3f4]">
              Refund Policy
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
