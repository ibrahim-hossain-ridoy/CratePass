export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/app";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return "/app";
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return "/app";
  if (/[\r\n]/.test(trimmed)) return "/app";
  return trimmed;
}

export function deriveOrgNameFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "Battery Brand Workspace";
  const domain = email.split("@")[1]?.trim().toLowerCase() ?? "";
  const label = domain.split(".")[0] ?? "";
  if (!label || /^(gmail|yahoo|outlook|hotmail|icloud|proton|example)$/.test(label)) {
    const localPart = email.split("@")[0]?.replace(/[^a-z0-9-]+/gi, " ").trim();
    if (!localPart) return "Battery Brand Workspace";
    return `${toTitleWords(localPart)} Workspace`.slice(0, 80);
  }
  return `${toTitleWords(label.replace(/-/g, " "))} Workspace`.slice(0, 80);
}

function toTitleWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function slugifyPassportName(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || "battery-passport";
}

export function formatShortUtcDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
}
