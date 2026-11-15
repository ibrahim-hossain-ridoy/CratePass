export const siteConfig = {
  siteName: "Battery Passport Host",
  brandName: "Battery Passport Host",
  // Replace placeholder values below before deploying to production:
  formUrl: "https://example.com/spec-form", // taste-skill-ignore
  contactEmail: "hello@example.com", // taste-skill-ignore
  defaultAnthropicModel: "claude-haiku-5-5",
  higherAccuracyAnthropicModel: "claude-sonnet-5-5",
  dailyExtractionLimitPerOrg: 5,
  userExtractionRateLimit: {
    maxRequests: 5,
    windowSeconds: 60,
  },
  maxUploadBytes: 10 * 1024 * 1024, // 10 MB PDF ceiling
} as const;

/** Server-safe feature flag reader for M6 billing gates (disabled by default for free pilots). */
export function isBillingEnabled(): boolean {
  if (typeof process !== "undefined" && process.env) {
    return process.env.BILLING_ENABLED === "true";
  }
  return false;
}

/** Resolve Anthropic model name from env with safe default (never hardcoded at call sites). */
export function getAnthropicModel(): string {
  const configured =
    typeof process !== "undefined" ? process.env?.ANTHROPIC_MODEL?.trim() : "";
  return configured || siteConfig.defaultAnthropicModel;
}
