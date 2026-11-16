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
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      <header className="border-b border-[#1E2C3A] bg-[#0B1016] text-white">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-h-[44px] items-center gap-2.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div>
              <span className="block text-[15px] font-bold tracking-tight text-white">
                {siteConfig.siteName}
              </span>
              <span className="block font-mono text-[11.5px] text-[#94A3B8]">
                BRAND WORKSPACE SIGN-IN
              </span>
            </div>
          </Link>

          <Link
            href="/demo"
            className="text-[14px] font-semibold text-[#CBD5E1] hover:text-white"
          >
            Concept demo (/demo)
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[456px] flex-1 flex-col justify-center px-4 py-10">
        <div className="hero-enter mb-6">
          <p className="font-mono text-[12px] font-bold uppercase tracking-wider text-[var(--accent)]">
            + BRAND WORKSPACE
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-[28px]">
            Open your brand workspace
          </h1>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--muted)]">
            Upload a battery spec PDF, inspect completeness status, and publish a
            hosted QR passport page. Your personal workspace is created on first sign-in.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-[260px] rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6" />
          }
        >
          <LoginContent searchParamsPromise={searchParams} />
        </Suspense>

        <p className="mt-5 text-center text-[12.5px] text-[var(--muted)]">
          Technical hosting infrastructure only — not legal advice or regulatory certification.
        </p>
        <div className="mt-2 flex items-center justify-center gap-4 text-[12.5px] text-[var(--muted)]">
          <Link href="/terms" className="hover:text-[var(--ink)] hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-[var(--ink)] hover:underline">
            Privacy
          </Link>
          <Link href="/disclaimer" className="hover:text-[var(--ink)] hover:underline">
            Disclaimer
          </Link>
        </div>
      </main>
    </div>
  );
}
