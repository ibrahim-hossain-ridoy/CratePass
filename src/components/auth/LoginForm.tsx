"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/Icons";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type AuthIntent = "signin" | "signup";

interface LoginFormProps {
  supabaseConfigured: boolean;
  initialIntent?: AuthIntent;
  initialError?: string;
}

export function LoginForm({
  supabaseConfigured,
  initialIntent = "signin",
  initialError,
}: LoginFormProps) {
  const router = useRouter();
  const [intent, setIntent] = useState<AuthIntent>(initialIntent);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError ?? null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function switchIntent(next: AuthIntent) {
    setIntent(next);
    setUseMagicLink(false);
    setErrorMsg(null);
    setStatusMsg(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    if (!supabaseConfigured) {
      setErrorMsg(
        "Supabase environment keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Enter a valid work email address.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin = window.location.origin;

      if (intent === "signin" && useMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/app`,
          },
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setStatusMsg(
            `Sign-in link sent to ${cleanEmail}. Check your inbox to open your workspace.`,
          );
        }
        return;
      }

      if (password.length < 8) {
        setErrorMsg("Password must be at least 8 characters.");
        return;
      }

      if (intent === "signup" && password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Check both password fields.");
        return;
      }

      if (intent === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        router.push("/app");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/app`,
          },
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.session) {
          router.push("/app");
          router.refresh();
        } else {
          setStatusMsg(
            `Account created for ${cleanEmail}. Check your email to confirm your address, then sign in.`,
          );
        }
      }
    } catch {
      setErrorMsg(
        "Authentication request failed. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-ui="login-card"
      className="hero-fade-rise rounded-[22px] bg-white p-6 text-[#0f1114] sm:p-8"
    >
      {!supabaseConfigured && (
        <div
          role="status"
          className="mb-5 rounded-[12px] bg-[#fdf6ec] px-4 py-3 text-[14px] text-[#7c380b]"
        >
          <p className="font-semibold">Supabase setup required for live auth</p>
          <p className="mt-1 leading-relaxed">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code>.env.local</code>, then apply the migrations in{" "}
            <code>supabase/migrations/</code>.
          </p>
        </div>
      )}

      {/* Primary Sign in / Sign up Segmented Switcher */}
      <div
        role="tablist"
        aria-label="Account action"
        className="relative grid grid-cols-2 gap-1 rounded-[12px] bg-[#f4f4f2] p-1"
      >
        <span
          aria-hidden="true"
          style={{
            transform: intent === "signin" ? "translateX(0%)" : "translateX(100%)",
          }}
          className="sliding-pill pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-[9px] bg-[#145b6e]"
        />
        <button
          type="button"
          role="tab"
          aria-selected={intent === "signin"}
          onClick={() => switchIntent("signin")}
          className={`pressable relative z-10 min-h-[44px] cursor-pointer rounded-[9px] px-3 text-[14.5px] font-semibold transition-colors ${
            intent === "signin"
              ? "bg-[#145b6e] text-white"
              : "text-[#22252a] hover:text-[#0f1114]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={intent === "signup"}
          onClick={() => switchIntent("signup")}
          className={`pressable relative z-10 min-h-[44px] cursor-pointer rounded-[9px] px-3 text-[14.5px] font-semibold transition-colors ${
            intent === "signup"
              ? "bg-[#145b6e] text-white"
              : "text-[#22252a] hover:text-[#0f1114]"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="auth-email"
            className="block text-[14px] font-semibold text-[#0f1114]"
          >
            Work email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57] focus:bg-white"
          />
        </div>

        {!(intent === "signin" && useMagicLink) && (
          <div className="tab-panel-enter space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-password"
                  className="block text-[14px] font-semibold text-[#0f1114]"
                >
                  {intent === "signup" ? "Create password" : "Password"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="cursor-pointer text-[13.5px] font-semibold text-[#145b6e] underline-offset-4 hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  intent === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57] focus:bg-white"
              />
            </div>

            {intent === "signup" && (
              <div className="tab-panel-enter">
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-[14px] font-semibold text-[#0f1114]"
                >
                  Confirm password
                </label>
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57] focus:bg-white"
                />
              </div>
            )}
          </div>
        )}

        {intent === "signup" && (
          <p className="rounded-[10px] bg-[#f4f4f2] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#4b4f57]">
            Includes Free Plan access: upload OEM spec PDFs, start blank drafts,
            and run 71-point Annex XIII completeness checks.
          </p>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="tab-panel-enter rounded-[10px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-900"
          >
            {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div
            role="status"
            className="tab-panel-enter rounded-[10px] bg-[#edf8f2] px-4 py-3 text-[14px] font-medium text-[#156d49]"
          >
            {statusMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="pressable inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#145b6e] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0e4656] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>
            {loading
              ? "Working..."
              : intent === "signup"
                ? "Create free account"
                : useMagicLink
                  ? "Send sign-in link"
                  : "Sign in to workspace"}
          </span>
          {!loading && <ArrowRightIcon className="btn-arrow h-4 w-4" />}
        </button>

        {intent === "signin" && (
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => {
                setUseMagicLink((prev) => !prev);
                setErrorMsg(null);
                setStatusMsg(null);
              }}
              className="cursor-pointer text-[13.5px] font-semibold text-[#145b6e] underline-offset-4 hover:underline"
            >
              {useMagicLink
                ? "Sign in with email & password instead"
                : "Prefer a passwordless email link? Use magic link"}
            </button>
          </div>
        )}
      </form>

      <div className="mt-6 rounded-[12px] bg-[#f4f4f2] px-4 py-3 text-center text-[13.5px] text-[#4b4f57]">
        {intent === "signin" ? (
          <>
            Don&rsquo;t have an account yet?{" "}
            <Link
              href="/signup"
              onClick={() => switchIntent("signup")}
              className="font-semibold text-[#145b6e] underline-offset-4 hover:underline"
            >
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              onClick={() => switchIntent("signin")}
              className="font-semibold text-[#145b6e] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
