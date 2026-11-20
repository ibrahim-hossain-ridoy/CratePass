import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  deriveOrgNameFromEmail,
  sanitizeNextPath,
} from "@/lib/workspace/helpers";

async function ensureUserPersonalOrg(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const orgNameHint = deriveOrgNameFromEmail(user.email ?? "");
    await supabase.rpc("ensure_personal_org", {
      p_org_name: orgNameHint,
    });
  } catch {
    // Non-fatal: getWorkspaceContext() also invokes ensure_personal_org idempotently on /app
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=supabase_unconfigured`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureUserPersonalOrg(supabase);
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      await ensureUserPersonalOrg(supabase);
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
