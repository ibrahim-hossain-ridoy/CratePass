"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/Icons";
import { validateAuthEmail } from "@/lib/auth/email-validation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type AuthIntent = "signin" | "signup";

interface LoginFormProps {
  supabaseConfigured: boolean;
  initialIntent?: AuthIntent;
  initialError?: string;
}

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.29v-3.1H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l3.99 3.1c.95-2.84 3.6-4.95 6.72-4.95Z"
      />
    </svg>
  );
}

export function LoginForm({
  supabaseConfigured,
  initialIntent = "signin",
  initialError,
}: LoginFormProps) {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [intent, setIntent] = useState<AuthIntent>(initialIntent);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError ?? null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function switchIntent(next: AuthIntent) {
    setIntent(next);
    setUseMagicLink(false);
    setTypoSuggestion(null);
    setErrorMsg(null);
    setStatusMsg(null);
  }

  function handleResetForWrongEmail() {
    setStatusMsg(null);
    setErrorMsg(null);
    setTypoSuggestion(null);
    setPassword("");
    setConfirmPassword("");
    window.requestAnimationFrame(() => {
      emailInputRef.current?.focus();
      emailInputRef.current?.select();
    });
  }

  function handleEmailBlur() {
    if (!email.trim()) {
      setTypoSuggestion(null);
      return;
    }
    const check = validateAuthEmail(email);
    if (!check.ok && check.kind === "typo") {
      setTypoSuggestion(check.suggestedEmail);
    } else {
      setTypoSuggestion(null);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMsg(null);
    setStatusMsg(null);
    setTypoSuggestion(null);

    if (!supabaseConfigured) {
      setErrorMsg(
        "Supabase environment keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    setGoogleLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setErrorMsg("Could not start Google sign-in. Try again.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setTypoSuggestion(null);

    if (!supabaseConfigured) {
      setErrorMsg(
        "Supabase environment keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    // Pre-submit email validation & typo guard (protects Supabase email quota)
    const emailCheck = validateAuthEmail(email);
    if (!emailCheck.ok) {
      if (emailCheck.kind === "typo") {
        setTypoSuggestion(emailCheck.suggestedEmail);
      } else {
        setErrorMsg(emailCheck.message);
      }
      return;
    }

    const cleanEmail = emailCheck.normalizedEmail;

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
            `Account created — check your email (${cleanEmail}) to confirm your address before signing in.`,
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

      {/* Continue with Google OAuth */}
      <div className="mt-5">
        <button
          type="button"
          disabled={googleLoading || loading}
          onClick={handleGoogleSignIn}
          className="pressable inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border border-[#dcdad4] bg-white px-4 py-2.5 text-[14.5px] font-semibold text-[#0f1114] transition-colors hover:bg-[#f4f4f2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleMark />
          <span>
            {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
          </span>
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-[12.5px] font-medium text-[#505660]">
        <span className="h-[1px] flex-1 bg-[#e4e3dd]" />
        <span>or continue with work email</span>
        <span className="h-[1px] flex-1 bg-[#e4e3dd]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="auth-email"
            className="block text-[14px] font-semibold text-[#0f1114]"
          >
            Work email
          </label>
          <input
            ref={emailInputRef}
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (typoSuggestion) setTypoSuggestion(null);
              if (errorMsg) setErrorMsg(null);
            }}
            onBlur={handleEmailBlur}
            placeholder="name@company.com"
            className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57] focus:bg-white"
          />

          {typoSuggestion && (
            <div
              role="alert"
              className="tab-panel-enter mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#fdf6ec] px-3.5 py-2.5 text-[13.5px] text-[#7c380b]"
            >
              <span>
                Did you mean{" "}
                <strong className="font-semibold text-[#0f1114]">
                  {typoSuggestion}
                </strong>
                ?
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail(typoSuggestion);
                  setTypoSuggestion(null);
                  setErrorMsg(null);
                }}
                className="pressable cursor-pointer rounded-[8px] bg-[#145b6e] px-3 py-1 text-[13px] font-semibold text-white hover:bg-[#0e4656]"
              >
                Fix
              </button>
            </div>
          )}
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
            className="tab-panel-enter space-y-2.5 rounded-[12px] bg-[#edf8f2] px-4 py-3.5 text-[14px] text-[#156d49]"
          >
            <p className="font-medium leading-relaxed">{statusMsg}</p>
            <button
              type="button"
              onClick={handleResetForWrongEmail}
              className="cursor-pointer text-[13px] font-semibold text-[#0b3c49] underline underline-offset-4 hover:text-[#145b6e]"
            >
              Entered the wrong email? Try again
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
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
