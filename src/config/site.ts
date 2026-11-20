export const siteConfig = {
  siteName: "CratePass",
  brandName: "CratePass",
  tagline:
    "Digital Product Passport Hosting — Built for EU Battery Passports (2027) and upcoming ESPR categories.",
  formUrl: "/app/new",
  contactEmail: "ibrahim369hossain@gmail.com",
  legal: {
    operatorName: "MD Ibrahim Hossain Ridoy",
    contactEmail: "ibrahim369hossain@gmail.com",
    registeredAddress:
      "Dhaka, Bangladesh (full billing address provided on Paddle invoices and upon email request)",
    shortLocation: "Dhaka, Bangladesh",
    effectiveDate: "2026-11-20",
    governingLaw: "Bangladesh",
    gdprSummary:
      "B2B data handling aligned to EU GDPR principles; formal EU Art. 27 representative & DPA available on request via ibrahim369hossain@gmail.com",
  },
  defaultAnthropicModel: "claude-haiku-5-5",
  higherAccuracyAnthropicModel: "claude-sonnet-5-5",
  defaultGeminiModel: "gemini-2.5-flash",
  dailyExtractionLimitPerOrg: 5,
  userExtractionRateLimit: {
    maxRequests: 5,
    windowSeconds: 60,
  },
  maxUploadBytes: 10 * 1024 * 1024, // 10 MB PDF ceiling
  billingPlan: {
    id: "cratepass-pro-monthly",
    name: "Pro",
    currency: "EUR",
    priceEurMonthly: 79,
    priceEurYearly: 790,
    isPlaceholderPricing: true,
    summary:
      "Unlimited live battery passports, bulk CSV GS1 serialized QR codes, 5-language supplier magic links, custom domain, and dealer SoH portal.",
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

/** Resolve Google Gemini model name from env with safe default. */
export function getGeminiModel(): string {
  const configured =
    typeof process !== "undefined" ? process.env?.GEMINI_MODEL?.trim() : "";
  return configured || siteConfig.defaultGeminiModel;
}

/** Resolve configured canonical site URL from NEXT_PUBLIC_SITE_URL with safe fallback. */
export function getConfiguredSiteUrl(): string {
  const configured =
    typeof process !== "undefined"
      ? process.env?.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "")
      : "";
  return configured || "https://cratepass.app";
}
