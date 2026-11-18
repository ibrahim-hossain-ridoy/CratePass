import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, BrandMark } from "@/components/Icons";
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

          {/* Right Column: Edge-Aligned Studio Hardware & Workspace Stage */}
          <div className="hero-stage-rise space-y-4 lg:col-span-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-[#0f1114]">
                Inside your engineering workspace
              </h2>
              <span className="text-[14px] font-semibold text-[#145b6e]">
                /app console
              </span>
            </div>

            {/* 2x2 Cohesive Site-Representative Studio Grid — flush with column margins */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="hero-shutter-frame hero-enter-1 relative aspect-[16/10] overflow-hidden rounded-[16px] bg-[#101214]">
                <Image
                  src="/images/spec-datasheet-studio.jpg"
                  alt="Engineering specification datasheets and caliper on a limestone studio desk"
                  fill
                  priority
                  sizes="(max-width: 1024px) 48vw, 320px"
                  className="hero-shutter-img object-cover"
                />
                <div
                  aria-hidden="true"
                  className="qr-laser-line pointer-events-none absolute inset-x-4 top-0 h-[2px] rounded-full bg-[#145b6e]/70"
                />
              </div>
              <div className="hero-enter-2 relative aspect-[16/10] overflow-hidden rounded-[16px] bg-[#101214]">
                <Image
                  src="/images/ebike-studio-europe.jpg"
                  alt="Minimalist European commuter electric bicycle in a stone courtyard"
                  fill
                  sizes="(max-width: 1024px) 48vw, 320px"
                  className="hero-shutter-img object-cover"
                />
              </div>
              <div className="hero-enter-2 relative aspect-[16/10] overflow-hidden rounded-[16px] bg-[#101214]">
                <Image
                  src="/images/qr-mobile-scan-studio.jpg"
                  alt="Smartphone scanning a laser-etched QR code plate to open the mobile Digital Product Passport"
                  fill
                  sizes="(max-width: 1024px) 48vw, 320px"
                  className="hero-shutter-img object-cover"
                />
              </div>
              <div className="hero-enter-3 relative aspect-[16/10] overflow-hidden rounded-[16px] bg-[#101214]">
                <Image
                  src="/images/casing-qr-macro.jpg"
                  alt="Anodized aluminum casing with laser-etched QR code plate"
                  fill
                  sizes="(max-width: 1024px) 48vw, 320px"
                  className="hero-shutter-img object-cover"
                />
              </div>
            </div>

            {/* Post-Login Capabilities Summary */}
            <div className="hero-enter-3 rounded-[18px] bg-[#101214] p-5 text-[#f4f3ef]">
              <p className="text-[14px] text-[#c4c8d0]">
                {WORKING_FIELD_LIST_NOTICE}
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                  <dt className="text-[14px] text-[#c4c8d0]">1. Spec intake</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold text-white">
                    PDF or blank draft
                  </dd>
                </div>
                <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                  <dt className="text-[14px] text-[#c4c8d0]">2. Schema check</dt>
                  <dd className="num mt-0.5 text-[15px] font-semibold text-[#34d399]">
                    71 Annex XIII points
                  </dd>
                </div>
                <div className="rounded-[12px] bg-[#171a1e] p-3.5">
                  <dt className="text-[14px] text-[#c4c8d0]">3. QR hosting</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold text-[#3eb8cf]">
                    SVG + PNG + v1/v2
                  </dd>
                </div>
              </dl>
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
