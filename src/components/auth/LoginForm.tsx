"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
      setErrorMsg("Authentication request failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-6">
      {!supabaseConfigured && (
        <div
          role="status"
          className="mb-4 rounded-[8px] border border-[var(--notice-border)] bg-[var(--notice-bg)] px-3.5 py-2.5 text-[13px] text-[var(--notice-ink)]"
        >
          <p className="font-semibold">Supabase setup required for live sign-in</p>
          <p className="mt-1 leading-relaxed">
            Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="font-mono">.env.local</code>, then apply the migrations in{" "}
            <code className="font-mono">supabase/migrations/</code>.
          </p>
        </div>
      )}

      {/* Auth mode switch: Email + Password OR Magic Link */}
      <div
        role="tablist"
        aria-label="Sign-in method"
        className="grid grid-cols-2 gap-1 rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => {
            setMode("password");
            setErrorMsg(null);
            setStatusMsg(null);
          }}
          className={`min-h-[40px] rounded-[6px] px-3 text-[13px] font-semibold transition-colors cursor-pointer ${
            mode === "password"
              ? "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
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
          className={`min-h-[40px] rounded-[6px] px-3 text-[13px] font-semibold transition-colors cursor-pointer ${
            mode === "magic-link"
              ? "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          Magic link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-[13px] font-semibold text-[var(--ink)]"
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
            className="mt-1.5 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {mode === "password" && (
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-[13px] font-semibold text-[var(--ink)]"
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
                className="text-[12.5px] font-medium text-[var(--accent-ink)] underline-offset-4 hover:underline cursor-pointer"
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
              className="mt-1.5 w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="rounded-[8px] border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-900"
          >
            {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div
            role="status"
            className="rounded-[8px] border border-[var(--positive-border)] bg-[var(--positive-bg)] px-3.5 py-2.5 text-[13px] text-[var(--positive)]"
          >
            {statusMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="pressable inline-flex min-h-[44px] w-full items-center justify-center rounded-[8px] bg-[var(--accent-ink)] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#963103] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {loading
            ? "Working..."
            : mode === "magic-link"
              ? "Send magic link"
              : passwordAction === "signin"
                ? "Sign in to workspace"
                : "Create brand account"}
        </button>
      </form>
    </div>
  );
}
