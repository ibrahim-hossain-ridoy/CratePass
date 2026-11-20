import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BATTERY_FIELDS,
  DYNAMIC_BMS_FIELDS,
  OFFICIAL_71_FIELDS,
  STATIC_BATTERY_FIELDS,
} from "../config/battery-fields.ts";
import {
  DYNAMIC_BMS_KEYS,
  STATIC_EXTRACTION_KEYS,
  StaticExtractionFieldsSchema,
} from "../lib/extractor/schema.ts";
import {
  projectPublicPassportFields,
  projectTieredPassportSnapshots,
} from "../lib/passport-projection.ts";
import { canOrgPublish, preparePublishSnapshots } from "../lib/publish.ts";

test("M10 Free (3 live passports) vs. Pro plan gating enforces cap and unlocks active/comp orgs", () => {
  // Free plan allows publishing up to 3 live passports, then blocks the 4th
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: false,
      publishedPassportsCount: 0,
      isAlreadyPublished: false,
    }),
    true,
  );
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: false,
      publishedPassportsCount: 3,
      isAlreadyPublished: false,
    }),
    false,
  );
  // Updating an already-live passport on Free stays allowed even at 3/3 live
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: false,
      publishedPassportsCount: 3,
      isAlreadyPublished: true,
      action: "publish_new_version",
    }),
    true,
  );
  // Past due & canceled revert to Free cap (blocked at 3/3)
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "past_due",
      compEnabled: false,
      publishedPassportsCount: 3,
      isAlreadyPublished: false,
    }),
    false,
  );
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "canceled",
      compEnabled: false,
      publishedPassportsCount: 3,
      isAlreadyPublished: false,
    }),
    false,
  );
  // Pro active subscription can publish unlimited passports
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "active",
      compEnabled: false,
      publishedPassportsCount: 25,
      isAlreadyPublished: false,
    }),
    true,
  );
  // Comped pilot org can publish unlimited passports
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: true,
      publishedPassportsCount: 25,
      isAlreadyPublished: false,
    }),
    true,
  );

  // Server-side publish route enforces entitlement & billing gate BEFORE unpublish and publish actions
  const publishRouteSrc = readFileSync(
    resolve("src/app/api/passports/[id]/publish/route.ts"),
    "utf8",
  );
  const billingGateIndex = publishRouteSrc.indexOf("checkPublishEntitlement(");
  const unpublishIndex = publishRouteSrc.indexOf('parsed.data.action === "unpublish"');
  assert.ok(billingGateIndex > 0, "Publish route must call checkPublishEntitlement()");
  assert.ok(
    billingGateIndex < unpublishIndex,
    "Entitlement gate must execute before unpublish/publish handlers",
  );
});

test("M10 DELETE /api/passports/[id] verifies ownership, cleans spec-pdfs storage, and logs passport_deleted", () => {
  const routeSrc = readFileSync(
    resolve("src/app/api/passports/[id]/route.ts"),
    "utf8",
  );
  assert.ok(routeSrc.includes("export async function DELETE"));
  assert.ok(routeSrc.includes("getWorkspaceContext()"));
  assert.ok(routeSrc.includes('.eq("org_id", ctx.org.orgId)'));
  assert.ok(routeSrc.includes('storage.from("spec-pdfs").remove('));
  assert.ok(routeSrc.includes('action: "passport_deleted"'));
});

test("M10 Full 71-point Annex XIII schema & public projection audit", () => {
  // 1. All 71 official points (1..71) exist contiguously with zero gaps or duplicates
  assert.equal(OFFICIAL_71_FIELDS.length, 71);
  const pointNumbers = OFFICIAL_71_FIELDS.map((f) => f.pointNumber).sort(
    (a, b) => a - b,
  );
  for (let i = 1; i <= 71; i += 1) {
    assert.equal(
      pointNumbers[i - 1],
      i,
      `Expected contiguous Annex XIII point #${i}`,
    );
  }

  // 2. Static (1..50 + additional_information = 51) vs Dynamic BMS (51..71 = 21)
  assert.equal(STATIC_BATTERY_FIELDS.length, 51);
  assert.equal(DYNAMIC_BMS_FIELDS.length, 21);
  assert.equal(BATTERY_FIELDS.length, 72);

  for (const field of DYNAMIC_BMS_FIELDS) {
    assert.ok(
      field.pointNumber >= 51 && field.pointNumber <= 71,
      `Dynamic BMS field ${field.key} must be in points 51..71`,
    );
    assert.equal(
      STATIC_EXTRACTION_KEYS.has(field.key),
      false,
      `Dynamic BMS key ${field.key} must never appear in StaticExtractionFieldsSchema`,
    );
    // Confirm strict Zod schema rejects dynamic BMS keys
    const rejected = StaticExtractionFieldsSchema.safeParse({
      [field.key]: { status: "found", value: "95%", sourceSnippet: "SoH 95%" },
    });
    assert.equal(rejected.success, false);
  }
  assert.equal(DYNAMIC_BMS_KEYS.size, 21);

  // 3. Dynamic BMS keys never block publishing
  const snapshots = preparePublishSnapshots({
    workingFields: {
      battery_category: "LMT",
      manufacturer_name: "NordBike Energy",
    },
    declarationAccepted: true,
    batteryCategory: "LMT",
  });
  for (const missingKey of snapshots.missingRequiredKeys) {
    assert.equal(
      DYNAMIC_BMS_KEYS.has(missingKey),
      false,
      `Dynamic BMS key ${missingKey} must never block publishing`,
    );
  }

  // 4. Public projection strictly omits legitimate_interest, authorities_only, and additional_information
  const fullMap = Object.fromEntries(
    BATTERY_FIELDS.map((f) => [f.key, `val-${f.key}`]),
  );
  const publicOnly = projectPublicPassportFields(fullMap);
  const tiered = projectTieredPassportSnapshots(fullMap);
  assert.equal("additional_information" in publicOnly, false);
  for (const key of Object.keys(publicOnly)) {
    const def = BATTERY_FIELDS.find((f) => f.key === key);
    assert.equal(def?.tier, "public", `Non-public key leaked: ${key}`);
  }
  assert.equal(
    "additional_information" in tiered.snapshotLegitimateInterestFields,
    true,
  );

  // 5. Public /p/[slug] route uses get_published_passport RPC and never leaks restricted fields
  const publicPageSrc = readFileSync(
    resolve("src/app/p/[slug]/page.tsx"),
    "utf8",
  );
  assert.ok(publicPageSrc.includes('rpc("get_published_passport"'));
  assert.ok(publicPageSrc.includes("projectPublicPassportFields("));
  assert.equal(publicPageSrc.includes("snapshot_all_fields"), false);
  assert.equal(publicPageSrc.includes("snapshot_authorities_only_fields"), false);
  assert.equal(
    publicPageSrc.includes("snapshot_legitimate_interest_fields"),
    false,
  );
});
