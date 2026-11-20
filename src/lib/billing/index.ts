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
 * Strictly gated local/dev-mode billing simulation flag.
 * NEVER active on Vercel production (`VERCEL_ENV === "production"`).
 * Disabled in `NODE_ENV === "production"` unless `ALLOW_TEST_BILLING_SIMULATION === "true"`
 * and live Paddle billing is not active.
 * Enabled locally (`NODE_ENV !== "production"`) when `BILLING_ENABLED !== "true"` or `PADDLE_API_KEY` is blank.
 */
export function isTestBillingSimulationAllowed(
  env: Record<string, string | undefined> = typeof process !== "undefined"
    ? process.env
    : {},
): boolean {
  if (!env) return false;
  if (env.VERCEL_ENV === "production") return false;
  const billingEnabled = env.BILLING_ENABLED === "true";
  const hasPaddleKey = Boolean(env.PADDLE_API_KEY?.trim());
  if (billingEnabled && hasPaddleKey) return false;
  if (env.NODE_ENV === "production") {
    return env.ALLOW_TEST_BILLING_SIMULATION === "true";
  }
  return true;
}

export interface BillingDisplayState {
  canPublish: boolean;
  plan: "free" | "pro";
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
      plan: "pro",
      badgeLabel: "Pro Active",
      headline: "Your CratePass Pro plan is active",
      detail:
        "Unlimited live passports, unlimited bulk CSV serialized QR codes, 5-language supplier magic links, custom branding, and dealer SoH updates are unlocked.",
    };
  }

  if (compEnabled) {
    return {
      canPublish: true,
      plan: "pro",
      badgeLabel: "Pro (Pilot Grant)",
      headline: "Pro workspace unlocked via pilot access",
      detail:
        "Your workspace includes unlimited live battery passports, serialized unit QR sheets, supplier magic links, and API access.",
    };
  }

  if (billingStatus === "past_due") {
    return {
      canPublish: true,
      plan: "free",
      badgeLabel: "Free (Payment Past Due)",
      headline: "Payment update needed to restore Pro limits",
      detail:
        "Free plan limits apply (up to 3 live published passports and 25 serialized unit QR codes). Update your billing plan to restore unlimited Pro access.",
    };
  }

  return {
    canPublish: true,
    plan: "free",
    badgeLabel: !billingEnabled
      ? "Free Plan (Dev Mode)"
      : billingStatus === "canceled"
        ? "Free Plan (Canceled)"
        : "Free Plan",
    headline: "Free Plan — up to 3 live battery passports included",
    detail:
      "Publish up to 3 live products, generate up to 25 serialized unit QR codes, and run 5 daily AI PDF checks. Upgrade to Pro (€79/mo) for unlimited scale.",
  };
}
