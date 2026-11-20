import { createServerSupabaseClient } from "../supabase/server.ts";

export interface WorkspaceBrandingSettings {
  brandLogoUrl: string | null;
  brandAccentHex: string;
  customDomain: string | null;
  customDomainActive: boolean;
}

export interface ServiceTokenRow {
  id: string;
  label: string;
  role: "repairer" | "recycler";
  active: boolean;
  created_at: string;
}

export interface WorkspaceApiKeyRow {
  id: string;
  label: string;
  key_prefix: string;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export async function loadWorkspaceBrandingAndServiceSettings(orgId: string): Promise<{
  branding: WorkspaceBrandingSettings;
  serviceTokens: ServiceTokenRow[];
  apiKeys: WorkspaceApiKeyRow[];
}> {
  const supabase = await createServerSupabaseClient();
  const defaults: WorkspaceBrandingSettings = {
    brandLogoUrl: null,
    brandAccentHex: "#145b6e",
    customDomain: null,
    customDomainActive: false,
  };

  if (!supabase) {
    return { branding: defaults, serviceTokens: [], apiKeys: [] };
  }

  const [orgRes, tokensRes, keysRes] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "brand_logo_url, brand_accent_hex, custom_domain, custom_domain_verified",
      )
      .eq("id", orgId)
      .single(),
    supabase
      .from("service_access_tokens")
      .select("id, label, role, active, created_at")
      .eq("workspace_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("workspace_api_keys")
      .select("id, label, key_prefix, active, last_used_at, created_at")
      .eq("workspace_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  const branding: WorkspaceBrandingSettings = orgRes.error || !orgRes.data
    ? defaults
    : {
        brandLogoUrl: orgRes.data.brand_logo_url
          ? String(orgRes.data.brand_logo_url)
          : null,
        brandAccentHex: orgRes.data.brand_accent_hex
          ? String(orgRes.data.brand_accent_hex)
          : "#145b6e",
        customDomain: orgRes.data.custom_domain
          ? String(orgRes.data.custom_domain)
          : null,
        customDomainActive: Boolean(orgRes.data.custom_domain_verified),
      };

  const serviceTokens: ServiceTokenRow[] = tokensRes.error
    ? []
    : (tokensRes.data ?? []).map((t) => ({
        id: String(t.id),
        label: String(t.label),
        role: t.role === "recycler" ? "recycler" : "repairer",
        active: Boolean(t.active),
        created_at: String(t.created_at),
      }));

  const apiKeys: WorkspaceApiKeyRow[] = keysRes.error
    ? []
    : (keysRes.data ?? []).map((k) => ({
        id: String(k.id),
        label: String(k.label),
        key_prefix: String(k.key_prefix),
        active: Boolean(k.active),
        last_used_at: k.last_used_at ? String(k.last_used_at) : null,
        created_at: String(k.created_at),
      }));

  return { branding, serviceTokens, apiKeys };
}
