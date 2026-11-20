export const CNAME_TARGET = "cname.cratepass.app";

const FQDN_PATTERN =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const RESERVED_SUFFIXES = [
  "cratepass.app",
  "localhost",
  "local",
  "internal",
  "invalid",
];

/**
 * Normalize and validate a customer custom subdomain (e.g. "pass.myebike.eu").
 * Strips protocol, paths, ports, and trailing dot; rejects reserved domains and invalid hostnames.
 */
export function normalizeCustomDomain(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  let candidate = raw.trim().toLowerCase();
  candidate = candidate.replace(/^https?:\/\//, "");
  candidate = candidate.split("/")[0] ?? "";
  candidate = candidate.split(":")[0] ?? "";
  candidate = candidate.replace(/\.+$/, "");

  if (!candidate || candidate.length > 253) return null;
  if (!FQDN_PATTERN.test(candidate)) return null;

  for (const reserved of RESERVED_SUFFIXES) {
    if (candidate === reserved || candidate.endsWith(`.${reserved}`)) {
      return null;
    }
  }

  return candidate;
}

/** Validate a 6-digit #RRGGBB hex brand accent color. */
export function validateBrandAccentHex(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

/**
 * Determine whether an incoming Host header belongs to the primary CratePass app host
 * (and therefore should NOT trigger custom customer subdomain lookup in middleware).
 */
export function isPrimaryAppHost(
  hostHeader: string | null | undefined,
  configuredSiteUrl?: string,
): boolean {
  if (!hostHeader) return true;
  const host = hostHeader.trim().toLowerCase().split(":")[0] ?? "";
  if (
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".vercel.app") ||
    host === "cratepass.app" ||
    host.endsWith(".cratepass.app")
  ) {
    return true;
  }

  const siteUrl =
    configuredSiteUrl ??
    (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SITE_URL : "");
  if (siteUrl) {
    try {
      const configuredHost = new URL(siteUrl).hostname.toLowerCase();
      if (host === configuredHost) return true;
    } catch {
      // Ignore malformed configured site URL
    }
  }

  return false;
}
