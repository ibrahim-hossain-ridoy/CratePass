"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/Icons";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthMode = "password" | "magic-link";
type PasswordAction = "signin" | "signup";

interface LoginFormProps {
  supabaseConfigured: boolean;
  initialError?: string;
}

export function LoginForm({
  supabaseConfigured,
  initialError,
}: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("password");
  const [passwordAction, setPasswordAction] = useState<PasswordAction>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError ?? null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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

      if (mode === "magic-link") {
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

      if (passwordAction === "signin") {
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
            `Account created for ${cleanEmail}. Check your email to confirm your address before signing in.`,
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
      className="hero-fade-rise rounded-[20px] bg-white p-6 text-[#0f1114] sm:p-8"
    >
      {!supabaseConfigured && (
        <div
          role="status"
          className="mb-5 rounded-[12px] bg-[#fdf6ec] px-4 py-3 text-[14px] text-[#7c380b]"
        >
          <p className="font-semibold">Supabase setup required for live sign-in</p>
          <p className="mt-1 leading-relaxed">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code>.env.local</code>, then apply the migrations in{" "}
            <code>supabase/migrations/</code>.
          </p>
        </div>
      )}

      {/* Segmented Auth Mode Switcher with GPU Sliding Pill */}
      <div
        role="tablist"
        aria-label="Sign-in method"
        className="relative grid grid-cols-2 gap-1 rounded-[12px] bg-[#f4f4f2] p-1"
      >
        <span
          aria-hidden="true"
          style={{
            transform: mode === "password" ? "translateX(0%)" : "translateX(100%)",
          }}
          className="sliding-pill pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-[9px] bg-[#145b6e]"
        />
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => {
            setMode("password");
            setErrorMsg(null);
            setStatusMsg(null);
          }}
          className={`pressable relative z-10 min-h-[44px] cursor-pointer rounded-[9px] px-3 text-[14px] font-semibold transition-colors ${
            mode === "password"
              ? "bg-[#145b6e] text-white"
              : "text-[#22252a] hover:text-[#0f1114]"
          }`}
        >
          Email &amp; password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "magic-link"}
          onClick={() => {
            setMode("magic-link");
            setErrorMsg(null);
            setStatusMsg(null);
          }}
          className={`pressable relative z-10 min-h-[44px] cursor-pointer rounded-[9px] px-3 text-[14px] font-semibold transition-colors ${
            mode === "magic-link"
              ? "bg-[#145b6e] text-white"
              : "text-[#22252a] hover:text-[#0f1114]"
          }`}
        >
          Magic link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-[14px] font-semibold text-[#0f1114]"
          >
            Work email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="engineer@brand-example.eu"
            className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57] focus:bg-white"
          />
        </div>

        {mode === "password" && (
          <div className="tab-panel-enter">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-[14px] font-semibold text-[#0f1114]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() =>
                  setPasswordAction((prev) =>
                    prev === "signin" ? "signup" : "signin",
                  )
                }
                className="cursor-pointer text-[14px] font-semibold text-[#145b6e] underline-offset-4 hover:underline"
              >
                {passwordAction === "signin"
                  ? "Need an account? Sign up"
                  : "Already registered? Sign in"}
              </button>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete={
                passwordAction === "signin" ? "current-password" : "new-password"
              }
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-4 py-3 text-[15px] text-[#0f1114] placeholder:text-[#4b4f57] focus:bg-white"
            />
          </div>
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
              : mode === "magic-link"
                ? "Send magic link"
                : passwordAction === "signin"
                  ? "Sign in to workspace"
                  : "Create brand account"}
          </span>
          {!loading && <ArrowRightIcon className="btn-arrow h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
