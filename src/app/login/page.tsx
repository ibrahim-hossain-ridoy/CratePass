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
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-h-[44px] items-center gap-2.5">
            <BrandMark className="h-8 w-8 shrink-0" />
            <div>
              <span className="block text-[15px] font-semibold tracking-tight">
                {siteConfig.siteName}
              </span>
              <span className="block text-[12px] text-[var(--muted)]">
                Brand workspace sign-in
              </span>
            </div>
          </Link>

          <Link
            href="/demo"
            className="text-[14px] font-medium text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Concept demo (/demo)
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-5">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Open your brand workspace
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">
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
