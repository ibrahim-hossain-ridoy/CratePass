import { createServerSupabaseClient } from "../supabase/server.ts";
import { isSupabaseConfigured } from "../supabase/env.ts";
import { deriveOrgNameFromEmail } from "./helpers.ts";
import type { BillingStatus, OrgSummary } from "../../types/database.ts";

export type WorkspaceContext =
  | { state: "unconfigured" }
  | { state: "unauthenticated" }
  | { state: "error"; message: string; userEmail?: string }
  | {
      state: "ready";
      user: { id: string; email: string };
      org: OrgSummary;
    };

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  if (!isSupabaseConfigured()) {
    return { state: "unconfigured" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { state: "unconfigured" };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { state: "unauthenticated" };
  }

  const email = user.email ?? "";
  const orgNameHint = deriveOrgNameFromEmail(email);

  const { data, error: orgError } = await supabase.rpc("ensure_personal_org", {
    p_org_name: orgNameHint,
  });

  if (orgError) {
    return {
      state: "error",
      userEmail: email,
      message:
        "Could not load workspace organization. Confirm Supabase SQL migrations have been applied.",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.org_id) {
    return {
      state: "error",
      userEmail: email,
      message: "Workspace membership could not be initialized.",
    };
  }

  return {
    state: "ready",
    user: { id: user.id, email },
    org: {
      orgId: String(row.org_id),
      orgName: String(row.org_name),
      orgSlug: String(row.org_slug),
      role: row.role === "member" ? "member" : "owner",
      billingStatus: (row.billing_status as BillingStatus) || "free",
      compEnabled: Boolean(row.comp_enabled),
    },
  };
}
