"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CNAME_TARGET } from "@/lib/branding/domain";
import type {
  ServiceTokenRow,
  WorkspaceApiKeyRow,
  WorkspaceBrandingSettings,
} from "@/lib/branding/workspace-settings";
import { formatShortUtcDate } from "@/lib/workspace/helpers";
import { UpgradeModal } from "./UpgradeModal";

interface BrandingSettingsWorkspaceProps {
  orgName: string;
  role: "owner" | "member";
  isPro: boolean;
  initialBranding: WorkspaceBrandingSettings;
  initialServiceTokens: ServiceTokenRow[];
  initialApiKeys: WorkspaceApiKeyRow[];
}

export function BrandingSettingsWorkspace({
  orgName,
  role,
  isPro,
  initialBranding,
  initialServiceTokens,
  initialApiKeys,
}: BrandingSettingsWorkspaceProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initialBranding.brandLogoUrl,
  );
  const [accentHex, setAccentHex] = useState(initialBranding.brandAccentHex);
  const [customDomain, setCustomDomain] = useState(
    initialBranding.customDomain ?? "",
  );
  const [domainActive, setDomainActive] = useState(
    initialBranding.customDomainActive,
  );
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [checkingDns, setCheckingDns] = useState(false);
  const [brandNotice, setBrandNotice] = useState<string | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);

  // Service PIN tokens state
  const [serviceTokens, setServiceTokens] =
    useState<ServiceTokenRow[]>(initialServiceTokens);
  const [pinLabel, setPinLabel] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [pinRole, setPinRole] = useState<"repairer" | "recycler">("repairer");
  const [creatingPin, setCreatingPin] = useState(false);
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Pro REST API keys state
  const [apiKeys, setApiKeys] = useState<WorkspaceApiKeyRow[]>(initialApiKeys);
  const [apiKeyLabel, setApiKeyLabel] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function handleSaveBranding(checkDns = false) {
    setBrandError(null);
    setBrandNotice(null);

    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }

    if (checkDns) {
      setCheckingDns(true);
    } else {
      setSavingBrand(true);
    }

    try {
      const res = await fetch("/api/settings/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandAccentHex: accentHex,
          customDomain: customDomain.trim() || null,
          checkDns,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        code?: string;
        brandAccentHex?: string;
        customDomain?: string | null;
        customDomainActive?: boolean;
        dnsCheckDetail?: string;
      };
      if (!res.ok) {
        if (res.status === 402 || json.code === "PLAN_LIMIT_REACHED") {
          setUpgradeOpen(true);
        }
        setBrandError(json.error || "Could not save branding settings.");
        return;
      }

      if (json.brandAccentHex) setAccentHex(json.brandAccentHex);
      setCustomDomain(json.customDomain ?? "");
      setDomainActive(Boolean(json.customDomainActive));
      setBrandNotice(
        json.dnsCheckDetail ||
          "Workspace branding and custom domain settings saved.",
      );
    } catch {
      setBrandError("Network error saving branding settings.");
    } finally {
      setSavingBrand(false);
      setCheckingDns(false);
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBrandError(null);
    setBrandNotice(null);

    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setBrandError("Brand logo must be 2 MB or smaller.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/settings/branding", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as {
        error?: string;
        brandLogoUrl?: string;
      };
      if (!res.ok || !json.brandLogoUrl) {
        setBrandError(json.error || "Logo upload failed.");
        return;
      }
      setLogoUrl(json.brandLogoUrl);
      setBrandNotice("Brand logo uploaded and live on published /p/[slug] pages.");
    } catch {
      setBrandError("Network error uploading brand logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCreatePin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServiceError(null);
    setServiceNotice(null);

    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }

    setCreatingPin(true);
    try {
      const res = await fetch("/api/settings/service-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: pinLabel.trim(),
          pin: pinCode.trim(),
          role: pinRole,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        token?: ServiceTokenRow;
      };
      if (!res.ok || !json.token) {
        setServiceError(json.error || "Could not create service access PIN.");
        return;
      }
      setServiceTokens((prev) => [json.token!, ...prev]);
      setPinLabel("");
      setPinCode("");
      setServiceNotice(
        `Issued service PIN for "${json.token.label}". Share it with that service center to log SoH updates at /service/[slug].`,
      );
    } catch {
      setServiceError("Network error creating service PIN.");
    } finally {
      setCreatingPin(false);
    }
  }

  async function handleTogglePin(tokenId: string, nextActive: boolean) {
    try {
      const res = await fetch("/api/settings/service-tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, active: nextActive }),
      });
      if (res.ok) {
        setServiceTokens((prev) =>
          prev.map((t) => (t.id === tokenId ? { ...t, active: nextActive } : t)),
        );
      }
    } catch {
      setServiceError("Could not update PIN status.");
    }
  }

  async function handleCreateApiKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiKeyError(null);
    setRevealedKey(null);
    setCopiedKey(false);

    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }

    setCreatingKey(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: apiKeyLabel.trim() }),
      });
      const json = (await res.json()) as {
        error?: string;
        key?: WorkspaceApiKeyRow;
        rawKey?: string;
      };
      if (!res.ok || !json.key || !json.rawKey) {
        setApiKeyError(json.error || "Could not create API key.");
        return;
      }
      setApiKeys((prev) => [json.key!, ...prev]);
      setRevealedKey(json.rawKey);
      setApiKeyLabel("");
    } catch {
      setApiKeyError("Network error creating API key.");
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevokeApiKey(keyId: string) {
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      if (res.ok) {
        setApiKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, active: false } : k)),
        );
      }
    } catch {
      setApiKeyError("Could not revoke API key.");
    }
  }

  async function handleCopyApiKey() {
    if (!revealedKey || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } catch {
      setCopiedKey(false);
    }
  }

  return (
    <div data-ui className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#101214] px-2.5 py-0.5 text-[12px] font-semibold text-[#7dd3e8]">
              {isPro ? "Pro Unlocked" : "Pro Preview"}
            </span>
            <span className="text-[12.5px] text-[#505660]">Role: {role}</span>
          </div>
          <h1 className="font-display mt-2 text-[24px] font-bold tracking-tight text-[#0f1114] sm:text-[28px]">
            Custom Branding, Subdomain &amp; Dealer SoH Portal
          </h1>
          <p className="mt-1 text-[14px] text-[#505660]">
            Configure your public passport logo, accent color, custom CNAME subdomain,
            workshop SoH update PINs, and Pro ERP/BMS REST API keys.
          </p>
        </div>

        {!isPro && (
          <Link
            href="/app/billing"
            className="pressable inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[#145b6e] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656]"
          >
            Unlock with Pro (€79/mo) →
          </Link>
        )}
      </div>

      {/* Section 1: Custom Branding & Subdomain */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-[18px] font-semibold text-[#0f1114]">
              1. Public Passport Branding &amp; Custom Domain
            </h2>
            {!isPro && (
              <span className="rounded bg-[#fdf6ec] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#7c380b]">
                Pro preview
              </span>
            )}
          </div>

          <div className="space-y-4 rounded-[14px] bg-white p-4 sm:p-5">
            {/* Logo upload */}
            <div>
              <label
                htmlFor="brand-logo-upload"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                Brand logo (PNG, JPEG, WebP, or SVG · max 2 MB)
              </label>
              <input
                id="brand-logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={uploadingLogo || role !== "owner"}
                onChange={handleLogoUpload}
                className="input-apple mt-1.5 block w-full cursor-pointer rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 text-[13.5px] file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-[#145b6e] file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-white"
              />
            </div>

            {/* Accent Color Picker */}
            <div>
              <label
                htmlFor="brand-accent-hex"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                Accent color hex
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Pick brand accent color"
                  value={/^#[0-9a-fA-F]{6}$/.test(accentHex) ? accentHex : "#145b6e"}
                  onChange={(e) => setAccentHex(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-[8px] border border-[#dcdad4] bg-white p-1"
                />
                <input
                  id="brand-accent-hex"
                  type="text"
                  value={accentHex}
                  onChange={(e) => setAccentHex(e.target.value)}
                  placeholder="#145b6e"
                  className="input-apple w-36 rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 font-mono text-[14px]"
                />
              </div>
            </div>

            {/* Custom Subdomain */}
            <div>
              <label
                htmlFor="custom-domain-input"
                className="block text-[13.5px] font-semibold text-[#0f1114]"
              >
                Custom subdomain (CNAME)
              </label>
              <input
                id="custom-domain-input"
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="pass.myebike.eu"
                className="input-apple mt-1.5 w-full rounded-[10px] border border-[#dcdad4] bg-[#f9f9f7] px-3.5 py-2.5 font-mono text-[14px]"
              />
              <div className="mt-3 rounded-[10px] bg-[#f4f4f2] p-3.5 text-[12.5px] text-[#22252a]">
                <p className="font-semibold text-[#0f1114]">
                  DNS CNAME configuration
                </p>
                <p className="mt-1">
                  Point your subdomain via DNS:{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[#145b6e]">
                    {customDomain.trim() || "pass.yourdomain.eu"} CNAME → {CNAME_TARGET}
                  </code>
                </p>
                <p className="mt-1.5">
                  Status:{" "}
                  <span
                    className={`rounded px-2 py-0.5 font-semibold ${
                      domainActive
                        ? "bg-[#edf8f2] text-[#156d49]"
                        : "bg-[#fdf6ec] text-[#7c380b]"
                    }`}
                  >
                    {domainActive ? "DNS active" : "Pending CNAME check"}
                  </span>
                </p>
              </div>
            </div>

            {brandError && (
              <div
                role="alert"
                className="rounded-[10px] border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-900"
              >
                {brandError}
              </div>
            )}

            {brandNotice && (
              <div
                role="status"
                className="rounded-[10px] border border-[#9fd4b9] bg-[#edf8f2] px-3.5 py-2.5 text-[13px] font-medium text-[#156d49]"
              >
                {brandNotice}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={savingBrand || role !== "owner"}
                onClick={() => handleSaveBranding(false)}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center rounded-[10px] bg-[#145b6e] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0e4656] disabled:opacity-50"
              >
                {savingBrand ? "Saving..." : "Save branding settings"}
              </button>
              <button
                type="button"
                disabled={checkingDns || !customDomain.trim() || role !== "owner"}
                onClick={() => handleSaveBranding(true)}
                className="pressable inline-flex min-h-[42px] cursor-pointer items-center rounded-[10px] bg-[#f4f4f2] px-4 py-2 text-[13.5px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3] disabled:opacity-50"
              >
                {checkingDns ? "Checking DNS..." : "Check DNS status"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Masthead Preview */}
        <div className="rounded-[18px] bg-[#101214] p-5 text-[#f4f3ef] sm:p-6 lg:col-span-5">
          <p className="text-[12px] font-semibold text-[#9aa0ab]">
            Live Public Passport Header Preview
          </p>
          <div className="mt-4 rounded-[14px] border border-[#242830] bg-[#171a1e] p-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt="Workspace brand logo preview"
                  className="h-10 w-10 rounded-[8px] bg-white object-contain p-1"
                />
              ) : (
                <div
                  style={{
                    backgroundColor: /^#[0-9a-fA-F]{6}$/.test(accentHex)
                      ? accentHex
                      : "#145b6e",
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-[8px] font-display text-[15px] font-bold text-white"
                >
                  {orgName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-[#c4c8d0]">
                  {orgName} · Digital Battery Passport
                </p>
                <p className="font-display truncate text-[16px] font-semibold text-white">
                  Alpine 36V-504 Pack
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                style={{
                  backgroundColor: /^#[0-9a-fA-F]{6}$/.test(accentHex)
                    ? accentHex
                    : "#145b6e",
                }}
                className="rounded-md px-2.5 py-1 text-[11.5px] font-semibold text-white"
              >
                EN · DE · FR · NL
              </span>
              <code className="truncate text-[11.5px] text-[#3eb8cf]">
                {customDomain.trim()
                  ? `https://${customDomain.trim()}/alpine-36v`
                  : "/p/alpine-36v"}
              </code>
            </div>
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-[#b6bac2]">
            When your CNAME record is active, scanners opening{" "}
            <code className="text-[#7dd3e8]">
              https://{customDomain.trim() || "pass.yourdomain.eu"}/[slug]
            </code>{" "}
            route cleanly to your branded public battery passport.
          </p>
        </div>
      </section>

      {/* Section 2: Dealer / Repairer Service Center PINs (No-IoT BMS Updates) */}
      <section className="rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[18px] font-semibold text-[#0f1114]">
              2. Dealer &amp; Repairer SoH Portal PINs (No-IoT BMS Updates)
            </h2>
            <p className="mt-1 text-[13.5px] text-[#505660]">
              Issue workshop PINs so authorized service centers or recyclers can append
              State of Health (%), cycle counts, internal resistance, and lifecycle
              changes at <code>/service/[slug]</code> without altering immutable static
              snapshots.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreatePin}
          className="mt-4 grid grid-cols-1 gap-3 rounded-[14px] bg-white p-4 sm:grid-cols-12"
        >
          <div className="sm:col-span-5">
            <label
              htmlFor="service-pin-label"
              className="block text-[12.5px] font-semibold text-[#0f1114]"
            >
              Service center label
            </label>
            <input
              id="service-pin-label"
              type="text"
              required
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              placeholder="e.g. Berlin Service Center"
              className="input-apple mt-1 w-full rounded-[9px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 text-[13.5px]"
            />
          </div>
          <div className="sm:col-span-3">
            <label
              htmlFor="service-pin-code"
              className="block text-[12.5px] font-semibold text-[#0f1114]"
            >
              Access PIN (4–16 chars)
            </label>
            <input
              id="service-pin-code"
              type="text"
              required
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="e.g. 482910"
              className="input-apple mt-1 w-full rounded-[9px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 font-mono text-[13.5px]"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="service-pin-role"
              className="block text-[12.5px] font-semibold text-[#0f1114]"
            >
              Role
            </label>
            <select
              id="service-pin-role"
              value={pinRole}
              onChange={(e) =>
                setPinRole(e.target.value === "recycler" ? "recycler" : "repairer")
              }
              className="input-apple mt-1 w-full rounded-[9px] border border-[#dcdad4] bg-[#f9f9f7] px-2.5 py-2 text-[13.5px]"
            >
              <option value="repairer">Repairer</option>
              <option value="recycler">Recycler</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={creatingPin}
              className="pressable inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-[9px] bg-[#145b6e] px-3 text-[13px] font-semibold text-white hover:bg-[#0e4656] disabled:opacity-50"
            >
              {creatingPin ? "Issuing..." : "Issue PIN"}
            </button>
          </div>
        </form>

        {serviceError && (
          <p className="mt-3 rounded-[10px] bg-red-50 px-3.5 py-2 text-[13px] text-red-900">
            {serviceError}
          </p>
        )}
        {serviceNotice && (
          <p className="mt-3 rounded-[10px] bg-[#edf8f2] px-3.5 py-2 text-[13px] font-medium text-[#156d49]">
            {serviceNotice}
          </p>
        )}

        {serviceTokens.length > 0 && (
          <ul className="mt-4 space-y-2">
            {serviceTokens.map((tok) => (
              <li
                key={tok.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-white px-4 py-3 text-[13px]"
              >
                <div>
                  <span className="font-semibold text-[#0f1114]">{tok.label}</span>
                  <span className="ml-2 rounded bg-[#e6f2f5] px-2 py-0.5 text-[11.5px] font-semibold text-[#0b3c49]">
                    {tok.role}
                  </span>
                  <span className="ml-2 text-[12px] text-[#505660]">
                    Issued {formatShortUtcDate(tok.created_at)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePin(tok.id, !tok.active)}
                  className={`cursor-pointer rounded px-2.5 py-1 text-[12px] font-semibold ${
                    tok.active
                      ? "bg-red-50 text-red-800 hover:bg-red-100"
                      : "bg-[#edf8f2] text-[#156d49] hover:bg-[#daf0e4]"
                  }`}
                >
                  {tok.active ? "Deactivate" : "Reactivate"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Section 3: Pro REST API Keys (ERP / Automated BMS Ingestion) */}
      <section className="rounded-[18px] bg-[#f4f4f2] p-5 sm:p-6">
        <h2 className="font-display text-[18px] font-semibold text-[#0f1114]">
          3. Pro REST API Keys (Dynamic BMS Telemetry Automation)
        </h2>
        <p className="mt-1 text-[13.5px] text-[#505660]">
          Push automated dynamic BMS updates from your ERP or fleet cloud via{" "}
          <code>POST /api/v1/passports/[id]/dynamic</code> using{" "}
          <code>Authorization: Bearer cp_live_...</code>.
        </p>

        <form
          onSubmit={handleCreateApiKey}
          className="mt-4 flex flex-col gap-3 rounded-[14px] bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="api-key-label"
              className="block text-[12.5px] font-semibold text-[#0f1114]"
            >
              API key label
            </label>
            <input
              id="api-key-label"
              type="text"
              required
              value={apiKeyLabel}
              onChange={(e) => setApiKeyLabel(e.target.value)}
              placeholder="e.g. ERP Production Sync"
              className="input-apple mt-1 w-full rounded-[9px] border border-[#dcdad4] bg-[#f9f9f7] px-3 py-2 text-[13.5px]"
            />
          </div>
          <button
            type="submit"
            disabled={creatingKey}
            className="pressable inline-flex min-h-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-[#101214] px-4 text-[13px] font-semibold text-white hover:bg-[#232730] disabled:opacity-50"
          >
            {creatingKey ? "Generating..." : "Generate API key"}
          </button>
        </form>

        {apiKeyError && (
          <p className="mt-3 rounded-[10px] bg-red-50 px-3.5 py-2 text-[13px] text-red-900">
            {apiKeyError}
          </p>
        )}

        {revealedKey && (
          <div className="tab-panel-enter mt-4 rounded-[14px] bg-[#101214] p-4 text-[#f4f3ef]">
            <p className="text-[12.5px] font-semibold text-[#7dd3e8]">
              Copy your new Pro API key now (shown once; stored strictly as SHA-256 hash)
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-[9px] bg-[#171a1e] px-3 py-2 text-[12.5px] text-[#3eb8cf]">
                {revealedKey}
              </code>
              <button
                type="button"
                onClick={handleCopyApiKey}
                className="pressable inline-flex min-h-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-[#3eb8cf] px-4 text-[13px] font-semibold text-[#08181d]"
              >
                {copiedKey ? "Copied ✓" : "Copy key"}
              </button>
            </div>
          </div>
        )}

        {apiKeys.length > 0 && (
          <ul className="mt-4 space-y-2">
            {apiKeys.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-white px-4 py-3 text-[13px]"
              >
                <div>
                  <span className="font-semibold text-[#0f1114]">{k.label}</span>
                  <code className="ml-2 rounded bg-[#f4f4f2] px-2 py-0.5 text-[12px] text-[#145b6e]">
                    {k.key_prefix}...
                  </code>
                  <span className="ml-2 text-[12px] text-[#505660]">
                    Created {formatShortUtcDate(k.created_at)}
                  </span>
                </div>
                {k.active ? (
                  <button
                    type="button"
                    onClick={() => handleRevokeApiKey(k.id)}
                    className="cursor-pointer rounded bg-red-50 px-2.5 py-1 text-[12px] font-semibold text-red-800 hover:bg-red-100"
                  >
                    Revoke
                  </button>
                ) : (
                  <span className="rounded bg-[#f4f4f2] px-2 py-0.5 text-[11.5px] font-semibold text-[#505660]">
                    Revoked
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Custom Branding, Dealer Portal & REST API require Pro"
        description="Upgrade to CratePass Pro (€79/mo) to configure your brand logo, custom subdomain CNAME, workshop SoH PINs, and ERP REST API keys."
      />
    </div>
  );
}
