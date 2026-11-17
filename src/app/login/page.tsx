import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/Icons";
import { LoginForm } from "@/components/auth/LoginForm";
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
      <header className="bg-[#101214] text-white">
        <div className="page-shell flex items-center justify-between py-4">
          <Link href="/" className="flex min-h-[44px] items-center gap-3">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div>
              <span className="font-display block text-[15.5px] font-semibold tracking-tight text-white">
                {siteConfig.siteName}
              </span>
              <span className="block text-[13px] text-[#c4c8d0]">
                Brand workspace sign-in
              </span>
            </div>
          </Link>

          <Link
            href="/demo"
            className="pressable text-[14.5px] font-semibold text-[#e2e5ea] hover:text-white"
          >
            Concept demo (/demo)
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[468px] flex-1 flex-col justify-center px-5 py-12">
        <div className="hero-enter mb-6">
          <h1 className="text-title-page font-semibold text-[#0f1114]">
            Open your brand workspace
          </h1>
          <p className="mt-2 text-[15.5px] leading-relaxed text-[#26292e]">
            Upload a battery spec PDF, inspect completeness status, and publish a
            hosted QR passport page. Your personal workspace is created on first sign-in.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-[260px] rounded-[16px] bg-white p-6" />
          }
        >
          <LoginContent searchParamsPromise={searchParams} />
        </Suspense>

        <p className="mt-6 text-center text-[13.5px] text-[#52565e]">
          Technical hosting infrastructure only — not legal advice or regulatory certification.
        </p>
        <div className="mt-2.5 flex items-center justify-center gap-5 text-[13.5px] text-[#26292e]">
          <Link href="/terms" className="hover:text-[#145b6e] hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-[#145b6e] hover:underline">
            Privacy
          </Link>
          <Link href="/disclaimer" className="hover:text-[#145b6e] hover:underline">
            Disclaimer
          </Link>
        </div>
      </main>
    </div>
  );
}
