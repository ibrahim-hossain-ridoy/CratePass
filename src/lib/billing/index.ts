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
  if (!billingEnabled) {
    return {
      canPublish: true,
      badgeLabel: "Pilot mode open",
      headline: "Publishing is enabled free during pilot evaluation",
      detail:
        "BILLING_ENABLED=false in this environment. Organizations can extract, publish live QR pages, and issue versioned updates without an active subscription.",
    };
  }

  if (compEnabled) {
    return {
      canPublish: true,
      badgeLabel: "Comped pilot",
      headline: "Publishing unlocked via organization comp override",
      detail:
        "This organization has comp_enabled=true and bypasses subscription payment gates.",
    };
  }

  if (billingStatus === "active") {
    return {
      canPublish: true,
      badgeLabel: "Active subscription",
      headline: "Brand Hosting subscription is active",
      detail:
        "Your organization can publish passports, generate SVG/PNG QR codes, and publish immutable updates.",
    };
  }

  if (billingStatus === "past_due") {
    return {
      canPublish: false,
      badgeLabel: "Past due",
      headline: "Payment update required to publish new versions",
      detail:
        "Recent renewal failed. Existing draft editing remains available; renew subscription to resume publishing.",
    };
  }

  return {
    canPublish: false,
    badgeLabel: billingStatus === "canceled" ? "Canceled" : "Free draft tier",
    headline: "Active subscription or pilot comp required to publish",
    detail:
      "Extracting spec PDFs and filling fields in draft mode remain open. Activate Brand Hosting or request a pilot comp grant before publishing live /p/[slug] pages.",
  };
}
