import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("M6 Paddle HMAC verification handles valid signatures, tampering, bad secrets, and replay window", async () => {
  const paddleMod = await import("../lib/billing/paddle.ts");
  const secret = "pdl_ntfset_test_secret_123456";
  const rawBody = JSON.stringify({
    event_id: "evt_01h123456",
    event_type: "subscription.activated",
    data: {
      id: "sub_01h123",
      customer_id: "ctm_01h123",
      status: "active",
      custom_data: {
        org_id: "11111111-1111-4111-8111-111111111111",
      },
    },
  });

  const nowSeconds = 1_760_000_000;
  const freshTs = nowSeconds - 30;
  const sigHex = createHmac("sha256", secret)
    .update(`${freshTs}:${rawBody}`)
    .digest("hex");

  assert.equal(
    paddleMod.verifyPaddleSignature(
      rawBody,
      `ts=${freshTs};h1=${sigHex}`,
      secret,
      nowSeconds,
    ),
    true,
  );

  // Tampered body must fail
  assert.equal(
    paddleMod.verifyPaddleSignature(
      rawBody.replace("sub_01h123", "sub_999999"),
      `ts=${freshTs};h1=${sigHex}`,
      secret,
      nowSeconds,
    ),
    false,
  );

  // Expired timestamp (>300s) must fail
  const staleTs = nowSeconds - 600;
  const staleSig = createHmac("sha256", secret)
    .update(`${staleTs}:${rawBody}`)
    .digest("hex");
  assert.equal(
    paddleMod.verifyPaddleSignature(
      rawBody,
      `ts=${staleTs};h1=${staleSig}`,
      secret,
      nowSeconds,
    ),
    false,
  );

  // Missing header / wrong secret must fail
  assert.equal(
    paddleMod.verifyPaddleSignature(rawBody, null, secret, nowSeconds),
    false,
  );
  assert.equal(
    paddleMod.verifyPaddleSignature(
      rawBody,
      `ts=${freshTs};h1=${sigHex}`,
      "wrong_secret",
      nowSeconds,
    ),
    false,
  );
});

test("M6 PaddleBillingProvider parses lifecycle events, validates org UUID, and handles billing display state", async () => {
  const paddleMod = await import("../lib/billing/paddle.ts");
  const billingMod = await import("../lib/billing/index.ts");

  const provider = new paddleMod.PaddleBillingProvider({
    apiKey: "",
    webhookSecret: "whsec_test_abc",
    priceId: "",
    env: "sandbox",
  });

  const nowSeconds = Math.floor(Date.now() / 1000);
  const makeSigned = (payload) => {
    const raw = JSON.stringify(payload);
    const ts = nowSeconds - 5;
    const h1 = createHmac("sha256", "whsec_test_abc")
      .update(`${ts}:${raw}`)
      .digest("hex");
    return { raw, sig: `ts=${ts};h1=${h1}` };
  };

  const activeCase = makeSigned({
    event_id: "evt_active_1",
    event_type: "subscription.activated",
    data: {
      id: "sub_abc",
      customer_id: "ctm_abc",
      status: "active",
      custom_data: { org_id: "22222222-2222-4222-8222-222222222222" },
    },
  });
  const parsedActive = provider.verifyWebhook(activeCase.raw, activeCase.sig);
  assert.equal(parsedActive.kind, "subscription_sync");
  assert.equal(parsedActive.event.billingStatus, "active");
  assert.equal(parsedActive.event.orgId, "22222222-2222-4222-8222-222222222222");

  const canceledCase = makeSigned({
    event_id: "evt_cancel_1",
    event_type: "subscription.canceled",
    data: {
      id: "sub_abc",
      customer_id: "ctm_abc",
      status: "canceled",
      custom_data: { org_id: "22222222-2222-4222-8222-222222222222" },
    },
  });
  const parsedCanceled = provider.verifyWebhook(canceledCase.raw, canceledCase.sig);
  assert.equal(parsedCanceled.kind, "subscription_sync");
  assert.equal(parsedCanceled.event.billingStatus, "canceled");

  // Non-UUID org_id must be rejected safely
  const badOrgCase = makeSigned({
    event_id: "evt_bad_org",
    event_type: "subscription.activated",
    data: {
      id: "sub_bad",
      status: "active",
      custom_data: { org_id: "not-a-uuid" },
    },
  });
  assert.throws(() => provider.verifyWebhook(badOrgCase.raw, badOrgCase.sig));

  // Display/gate helper honors comp_enabled and BILLING_ENABLED=false
  assert.equal(
    billingMod.describeOrgBillingState({
      billingEnabled: false,
      billingStatus: "free",
      compEnabled: false,
    }).canPublish,
    true,
  );
  assert.equal(
    billingMod.describeOrgBillingState({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: true,
    }).canPublish,
    true,
  );
  assert.equal(
    billingMod.describeOrgBillingState({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: false,
    }).canPublish,
    false,
  );
});

test("M6 placeholder EUR pricing and webhook raw body security boundaries", () => {
  const siteSrc = readFileSync(resolve("src/config/site.ts"), "utf8");
  assert.ok(siteSrc.includes("currency: \"EUR\""), "Expected EUR currency config");
  assert.ok(siteSrc.includes("isPlaceholderPricing: true"));

  const webhookRoute = readFileSync(
    resolve("src/app/api/webhooks/paddle/route.ts"),
    "utf8",
  );
  assert.ok(
    webhookRoute.includes("await request.text()"),
    "Webhook must read raw body text before JSON parsing for HMAC verification",
  );
  assert.ok(webhookRoute.includes("createAdminSupabaseClient"));
});
