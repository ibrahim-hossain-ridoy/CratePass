import type { BillingStatus } from "../../types/database.ts";

export interface CheckoutSessionInput {
  orgId: string;
  orgSlug: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  provider: "paddle";
  mode: "sandbox" | "production";
  transactionId: string;
  checkoutUrl: string;
}

export interface VerifiedSubscriptionSyncEvent {
  eventId: string;
  eventType: string;
  orgId: string;
  customerId: string | null;
  subscriptionId: string | null;
  billingStatus: BillingStatus;
}

export type WebhookParseResult =
  | { kind: "subscription_sync"; event: VerifiedSubscriptionSyncEvent }
  | { kind: "ignored"; eventId: string; eventType: string };

export interface BillingProvider {
  readonly providerId: "paddle";
  createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
  verifyWebhook(
    rawBody: string,
    signatureHeader: string | null,
    nowSeconds?: number,
  ): WebhookParseResult;
  mapSubscriptionStatus(rawStatus: string): BillingStatus;
}
