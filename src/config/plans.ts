export type PlanId = "free" | "pro";
export type BillingInterval = "monthly" | "yearly";

export const PRO_MONTHLY_EUR = 79;

/**
 * Annual Pro plan price in EUR.
 * Default: 790 (2 months free vs monthly). Change to 899 if switching annual discount tier.
 */
export const PRO_YEARLY_EUR = 790;

export interface PlanLimits {
  /** Maximum number of live published passports; null means unlimited. */
  maxPublishedPassports: number | null;
  /** Maximum number of serialized unit QR records across the workspace; null means unlimited. */
  maxSerializedUnits: number | null;
  /** Maximum daily AI PDF extractions per workspace; null means unlimited. */
  dailyPdfExtractions: number | null;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge: string;
  priceMonthlyEur: number;
  priceYearlyEur: number;
  summary: string;
  limits: PlanLimits;
  highlights: readonly string[];
}

export const FREE_PLAN_LIMITS: PlanLimits = {
  maxPublishedPassports: 3,
  maxSerializedUnits: 25,
  dailyPdfExtractions: 5,
};

export const PRO_PLAN_LIMITS: PlanLimits = {
  maxPublishedPassports: null,
  maxSerializedUnits: null,
  dailyPdfExtractions: null,
};

export const PLAN_CATALOG: Readonly<Record<PlanId, PlanDefinition>> = {
  free: {
    id: "free",
    name: "Free",
    badge: "3 Live Products Included",
    priceMonthlyEur: 0,
    priceYearlyEur: 0,
    summary:
      "Test full publishing, live QR pages, completeness checks, and initial unit serialization at zero cost.",
    limits: FREE_PLAN_LIMITS,
    highlights: [
      "Up to 3 live published battery products/passports",
      "Up to 25 serialized unit QR codes across workspace",
      "5 daily AI PDF datasheet completeness checks",
      "Full 71-point Annex XIII schema & public /p/[slug] pages",
      "Downloadable SVG & PNG QR codes + open JSON export",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    badge: "Full Production Scale",
    priceMonthlyEur: PRO_MONTHLY_EUR,
    priceYearlyEur: PRO_YEARLY_EUR,
    summary:
      "Unlimited battery models, bulk GS1 item serialization, 5-language supplier portal, EU Registry JSON-LD, custom domain, and dealer SoH updates.",
    limits: PRO_PLAN_LIMITS,
    highlights: [
      "Unlimited battery models & live published passports",
      "Unlimited bulk CSV serialized units & print-ready A4 QR sheets",
      "Unlimited 5-language (EN / 中文 / 한국어 / 日本語 / Tiếng Việt) Supplier Magic Links",
      "Multi-language public passport switcher + Simple QR Mode",
      "EU Registry JSON-LD & Audit Data Package PDF exports",
      "Custom subdomain branding, Dealer/Repairer SoH Portal & REST API keys",
    ],
  },
};

export interface PlanComparisonRow {
  feature: string;
  free: string;
  pro: string;
}

export const PLAN_COMPARISON_ROWS: readonly PlanComparisonRow[] = [
  {
    feature: "Live published battery passports",
    free: "Up to 3 products",
    pro: "Unlimited",
  },
  {
    feature: "Serialized item-level QR codes (GS1 Digital Link)",
    free: "Up to 25 units total",
    pro: "Unlimited + Bulk CSV",
  },
  {
    feature: "AI PDF datasheet completeness checks",
    free: "5 / day",
    pro: "Unlimited",
  },
  {
    feature: "71-point Annex XIII schema (50 static · 21 dynamic BMS)",
    free: "Included",
    pro: "Included",
  },
  {
    feature: "5-Language Supplier Magic Links (EN / 中文 / 한국어 / 日本語 / Tiếng Việt)",
    free: "Up to 3 products",
    pro: "Unlimited",
  },
  {
    feature: "Multi-language public passport switcher",
    free: "Core EU languages",
    pro: "Full multi-language",
  },
  {
    feature: "EU Registry JSON-LD & Audit Data Package PDF",
    free: "Included for 3 products",
    pro: "Unlimited exports",
  },
  {
    feature: "Simple QR Mode (Article 13(6) non-passport batteries)",
    free: "Counts toward 3 live",
    pro: "Unlimited",
  },
  {
    feature: "Custom subdomain & brand logo/accent",
    free: "Preview only",
    pro: "Unlocked (CNAME)",
  },
  {
    feature: "Dealer / Repairer SoH Portal & REST API keys",
    free: "Preview only",
    pro: "Unlocked",
  },
];

export function getProAnnualSavingsPct(): number {
  const yearlyIfMonthly = PRO_MONTHLY_EUR * 12;
  if (yearlyIfMonthly <= 0 || PRO_YEARLY_EUR >= yearlyIfMonthly) return 0;
  return Math.round(((yearlyIfMonthly - PRO_YEARLY_EUR) / yearlyIfMonthly) * 100);
}
