export const siteConfig = {
  siteName: "Battery Passport Host",
  brandName: "Battery Passport Host",
  formUrl: "/app/new",
  contactEmail: "ibrahim369hossain@gmail.com",
  defaultAnthropicModel: "claude-haiku-5-5",
  higherAccuracyAnthropicModel: "claude-sonnet-5-5",
  dailyExtractionLimitPerOrg: 5,
  userExtractionRateLimit: {
    maxRequests: 5,
    windowSeconds: 60,
  },
  maxUploadBytes: 10 * 1024 * 1024, // 10 MB PDF ceiling
  billingPlan: {
    id: "brand-hosting-monthly",
    name: "Brand Hosting",
    currency: "EUR",
    priceEurMonthly: 49,
    isPlaceholderPricing: true,
    summary:
      "Publish live /p/[slug] QR passports, download SVG/PNG QR labels, and issue versioned updates.",
  },
} as const;

/** Server-safe feature flag reader for M6 billing gates (disabled by default for free pilots). */
export function isBillingEnabled(): boolean {
  if (typeof process !== "undefined" && process.env) {
    return process.env.BILLING_ENABLED === "true";
  }
  return false;
}

/** Resolve Paddle billing environment (defaults safely to sandbox). */
export function getPaddleEnv(): "sandbox" | "production" {
  if (
    typeof process !== "undefined" &&
    process.env?.PADDLE_ENV?.trim().toLowerCase() === "production"
  ) {
    return "production";
  }
  return "sandbox";
}

/** Resolve Anthropic model name from env with safe default (never hardcoded at call sites). */
export function getAnthropicModel(): string {
  const configured =
    typeof process !== "undefined" ? process.env?.ANTHROPIC_MODEL?.trim() : "";
  return configured || siteConfig.defaultAnthropicModel;
}
