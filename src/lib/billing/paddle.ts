import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { BillingStatus } from "../../types/database.ts";
import type {
  BillingProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  WebhookParseResult,
} from "./types.ts";

const REPLAY_WINDOW_SECONDS = 300;

const SUPPORTED_SUBSCRIPTION_EVENTS = new Set([
  "subscription.activated",
  "subscription.created",
  "subscription.updated",
  "subscription.resumed",
  "subscription.past_due",
  "subscription.paused",
  "subscription.canceled",
]);

const PaddleEventEnvelopeSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.string().min(1),
  data: z.unknown(),
});

const PaddleSubscriptionDataSchema = z.object({
  id: z.string().min(1),
  customer_id: z.string().min(1).optional().nullable(),
  status: z.string().min(1),
  custom_data: z
    .object({
      org_id: z.string().uuid(),
    })
    .passthrough(),
});

export class PaddleConfigError extends Error {
  readonly code = "PADDLE_NOT_CONFIGURED";
  constructor(message: string) {
    super(message);
    this.name = "PaddleConfigError";
  }
}

export class PaddleSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaddleSignatureError";
  }
}

export interface PaddleProviderConfig {
  apiKey: string;
  webhookSecret: string;
  priceId: string;
  yearlyPriceId?: string;
  env: "sandbox" | "production";
}

export function getPaddleApiBaseUrl(env: "sandbox" | "production"): string {
  return env === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

/**
 * Verifies Paddle Billing v2 `Paddle-Signature: ts=<unix>;h1=<hex_hmac_sha256>`
 * against the exact unmodified raw request body and a 5-minute replay window.
 */
export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!signatureHeader || !webhookSecret || !rawBody) {
    return false;
  }

  let timestamp: number | null = null;
  const candidateDigests: string[] = [];

  for (const part of signatureHeader.split(/[;,]/)) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();

    if (key === "ts") {
      if (!/^\d+$/.test(val)) return false;
      timestamp = Number.parseInt(val, 10);
    } else if (key === "h1" && /^[0-9a-f]{64}$/i.test(val)) {
      candidateDigests.push(val.toLowerCase());
    }
  }

  if (timestamp === null || candidateDigests.length === 0) {
    return false;
  }

  if (Math.abs(nowSeconds - timestamp) > REPLAY_WINDOW_SECONDS) {
    return false;
  }

  const expectedHex = createHmac("sha256", webhookSecret)
    .update(`${timestamp}:${rawBody}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expectedHex, "hex");

  return candidateDigests.some((candidate) => {
    const candidateBuf = Buffer.from(candidate, "hex");
    return (
      candidateBuf.length === expectedBuf.length &&
      timingSafeEqual(candidateBuf, expectedBuf)
    );
  });
}

export class PaddleBillingProvider implements BillingProvider {
  readonly providerId = "paddle" as const;
  private readonly config: PaddleProviderConfig;

  constructor(config?: Partial<PaddleProviderConfig>) {
    const envRaw =
      config?.env ??
      (process.env.PADDLE_ENV?.trim().toLowerCase() === "production"
        ? "production"
        : "sandbox");

    this.config = {
      apiKey: (config?.apiKey ?? process.env.PADDLE_API_KEY ?? "").trim(),
      webhookSecret: (
        config?.webhookSecret ??
        process.env.PADDLE_WEBHOOK_SECRET ??
        ""
      ).trim(),
      priceId: (
        config?.priceId ??
        process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ??
        ""
      ).trim(),
      yearlyPriceId: (
        config?.yearlyPriceId ??
        process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_YEARLY ??
        ""
      ).trim(),
      env: envRaw,
    };
  }

  isCheckoutConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.priceId);
  }

  isWebhookConfigured(): boolean {
    return Boolean(this.config.webhookSecret);
  }

  mapSubscriptionStatus(rawStatus: string): BillingStatus {
    switch (rawStatus.toLowerCase()) {
      case "active":
      case "trialing":
        return "active";
      case "past_due":
        return "past_due";
      case "paused":
      case "canceled":
        return "canceled";
      default:
        return "free";
    }
  }

  verifyWebhook(
    rawBody: string,
    signatureHeader: string | null,
    nowSeconds?: number,
  ): WebhookParseResult {
    if (!this.config.webhookSecret) {
      throw new PaddleConfigError("PADDLE_WEBHOOK_SECRET is not configured.");
    }

    const ok = verifyPaddleSignature(
      rawBody,
      signatureHeader,
      this.config.webhookSecret,
      nowSeconds,
    );
    if (!ok) {
      throw new PaddleSignatureError("Invalid or expired Paddle webhook signature.");
    }

    const json = JSON.parse(rawBody) as unknown;
    const envelope = PaddleEventEnvelopeSchema.parse(json);

    if (!SUPPORTED_SUBSCRIPTION_EVENTS.has(envelope.event_type)) {
      return {
        kind: "ignored",
        eventId: envelope.event_id,
        eventType: envelope.event_type,
      };
    }

    const data = PaddleSubscriptionDataSchema.parse(envelope.data);
    return {
      kind: "subscription_sync",
      event: {
        eventId: envelope.event_id,
        eventType: envelope.event_type,
        orgId: data.custom_data.org_id,
        customerId: data.customer_id ?? null,
        subscriptionId: data.id,
        billingStatus: this.mapSubscriptionStatus(data.status),
      },
    };
  }

  async createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    if (!this.isCheckoutConfigured()) {
      throw new PaddleConfigError(
        "Paddle Sandbox checkout is not configured yet (set PADDLE_API_KEY and NEXT_PUBLIC_PADDLE_PRICE_ID).",
      );
    }

    const selectedPriceId =
      input.interval === "yearly" && this.config.yearlyPriceId
        ? this.config.yearlyPriceId
        : this.config.priceId;

    const response = await fetch(
      `${getPaddleApiBaseUrl(this.config.env)}/transactions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ price_id: selectedPriceId, quantity: 1 }],
          custom_data: {
            org_id: input.orgId,
            org_slug: input.orgSlug,
            billing_interval: input.interval ?? "monthly",
          },
          checkout: {
            url: input.successUrl,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Paddle API responded with HTTP ${response.status}.`);
    }

    const body = (await response.json()) as {
      data?: { id?: string; checkout?: { url?: string | null } | null };
    };
    const transactionId = body.data?.id;
    const checkoutUrl = body.data?.checkout?.url;

    if (!transactionId || !checkoutUrl) {
      throw new Error("Paddle checkout response omitted transaction or checkout URL.");
    }

    return {
      provider: "paddle",
      mode: this.config.env,
      transactionId,
      checkoutUrl,
    };
  }
}
