import { PaddleBillingProvider } from "./paddle.ts";
import type { BillingStatus } from "../../types/database.ts";

export {
  PaddleBillingProvider,
  PaddleConfigError,
  PaddleSignatureError,
  verifyPaddleSignature,
} from "./paddle.ts";
export type {
  BillingProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  VerifiedSubscriptionSyncEvent,
  WebhookParseResult,
} from "./types.ts";

export function getBillingProvider(): PaddleBillingProvider {
  return new PaddleBillingProvider();
}

/**
 * Strictly gated local/test-only billing simulation flag.
 * Enabled ONLY when PADDLE_API_KEY is NOT set AND (NODE_ENV !== "production"
 * OR ALLOW_TEST_BILLING_SIMULATION === "true"). Never active in real production
 * once Paddle keys are configured.
 */
export function isTestBillingSimulationAllowed(): boolean {
  if (typeof process === "undefined" || !process.env) return false;
  const hasPaddleKey = Boolean(process.env.PADDLE_API_KEY?.trim());
  if (hasPaddleKey) return false;
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_TEST_BILLING_SIMULATION === "true"
  );
}

export interface BillingDisplayState {
  canPublish: boolean;
  badgeLabel: string;
  headline: string;
  detail: string;
}

export function describeOrgBillingState({
  billingEnabled,
  billingStatus,
  compEnabled,
}: {
  billingEnabled: boolean;
  billingStatus: BillingStatus;
  compEnabled: boolean;
}): BillingDisplayState {
  if (billingStatus === "active") {
    return {
      canPublish: true,
      badgeLabel: "Brand Hosting Active",
      headline: "Your Brand Hosting plan is active",
      detail:
        "You can publish live /p/[slug] QR passports, download print-ready SVG and PNG QR labels, and issue versioned updates.",
    };
  }

  if (compEnabled) {
    return {
      canPublish: true,
      badgeLabel: "Pilot Grant Active",
      headline: "Publishing unlocked through pilot access",
      detail:
        "Your workspace includes full publishing access for live /p/[slug] QR passports, SVG/PNG downloads, and versioned updates.",
    };
  }

  if (!billingEnabled) {
    return {
      canPublish: true,
      badgeLabel: "Free Pilot Open",
      headline: "Publishing is currently open during free pilot",
      detail:
        "Upload OEM spec PDFs, run 71-point completeness checks, and publish live QR passports while pilot evaluation is open.",
    };
  }

  if (billingStatus === "past_due") {
    return {
      canPublish: false,
      badgeLabel: "Payment Past Due",
      headline: "Payment update needed to publish new versions",
      detail:
        "Your recent renewal could not be processed. Draft editing remains open; update your plan to resume publishing.",
    };
  }

  return {
    canPublish: false,
    badgeLabel: billingStatus === "canceled" ? "Plan Canceled" : "Free Plan",
    headline: "Upgrade to Brand Hosting to publish live QR passports",
    detail:
      "Your Free Plan includes PDF uploads, blank drafts, and 71-point completeness checks. Upgrade to Brand Hosting (€49/month) to publish live /p/[slug] pages and download QR labels.",
  };
}
