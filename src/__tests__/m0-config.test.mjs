import test from "node:test";
import assert from "node:assert/strict";
import { siteConfig, isBillingEnabled } from "../config/site.ts";
import {
  BATTERY_FIELDS,
  OFFICIAL_71_FIELDS,
  STATIC_BATTERY_FIELDS,
  DYNAMIC_BMS_FIELDS,
  WORKING_FIELD_LIST_NOTICE,
  RESTRICTED_TIER_NOTICE,
  DYNAMIC_BMS_NOTICE,
  getRequiredFieldsForCategory,
  getStaticRequiredFieldsForCategory,
} from "../config/battery-fields.ts";

test("siteConfig exposes required housekeeping fields and defaults", () => {
  assert.equal(siteConfig.siteName, "CratePass");
  assert.equal(typeof siteConfig.formUrl, "string");
  assert.equal(typeof siteConfig.contactEmail, "string");
  assert.equal(isBillingEnabled(), false);
  assert.equal(siteConfig.dailyExtractionLimitPerOrg, 5);
  assert.equal(siteConfig.defaultAnthropicModel, "claude-haiku-5-5");
});

test("BATTERY_FIELDS models all 71 official Annex XIII points plus 1 catch-all field", () => {
  assert.equal(
    OFFICIAL_71_FIELDS.length,
    71,
    `Expected 71 official fields, got ${OFFICIAL_71_FIELDS.length}`,
  );
  assert.equal(
    BATTERY_FIELDS.length,
    72,
    `Expected 72 total fields (71 official + additional_information), got ${BATTERY_FIELDS.length}`,
  );
  assert.equal(STATIC_BATTERY_FIELDS.length, 51);
  assert.equal(DYNAMIC_BMS_FIELDS.length, 21);

  const keys = new Set(BATTERY_FIELDS.map((f) => f.key));
  assert.equal(keys.size, BATTERY_FIELDS.length, "All field keys must be unique");
  assert.ok(keys.has("additional_information"));

  const groups = new Set(BATTERY_FIELDS.map((f) => f.group));
  for (const expectedGroup of ["identity", "integrity", "careRepair", "impact"]) {
    assert.ok(groups.has(expectedGroup), `Missing field group: ${expectedGroup}`);
  }

  const tiers = new Set(BATTERY_FIELDS.map((f) => f.tier));
  assert.deepEqual(
    [...tiers].sort(),
    ["authorities_only", "legitimate_interest", "public"],
  );

  // Verify LMT mandatory counts match Commission DBP Data Points v2.0 (49 total: 30 public, 18 legitimate_interest, 1 authorities_only)
  const lmtRequired = getRequiredFieldsForCategory("LMT");
  assert.equal(lmtRequired.length, 49);
  assert.equal(lmtRequired.filter((f) => f.tier === "public").length, 30);
  assert.equal(
    lmtRequired.filter((f) => f.tier === "legitimate_interest").length,
    18,
  );
  assert.equal(
    lmtRequired.filter((f) => f.tier === "authorities_only").length,
    1,
  );
  assert.equal(getStaticRequiredFieldsForCategory("LMT").length, 35);

  const catchAll = BATTERY_FIELDS.find((f) => f.key === "additional_information");
  assert.ok(catchAll);
  assert.equal(catchAll.tier, "legitimate_interest");
  assert.equal(catchAll.source, "static");
  assert.equal(catchAll.maxChars, 2000);
});

test("Hard copy rule: field labels and notice never claim compliance/certification/verification", () => {
  assert.equal(
    WORKING_FIELD_LIST_NOTICE,
    "Working field list. Check against the official regulation.",
  );
  assert.equal(
    RESTRICTED_TIER_NOTICE,
    "Stored privately — external access path pending EU Article 77(9) implementing act.",
  );
  assert.equal(
    DYNAMIC_BMS_NOTICE,
    "Provided by battery BMS, not extracted from PDF",
  );

  const forbidden = /\b(compliant|certified|verified)\b/i;
  for (const field of BATTERY_FIELDS) {
    // Point 61's official EU Annex XIII name is "State of certified energy (SOCE)"
    const sanitizedLabel = field.label.replace(
      /state of certified energy/gi,
      "",
    );
    assert.equal(
      forbidden.test(sanitizedLabel),
      false,
      `Forbidden claim word in field label: ${field.label}`,
    );
  }
});
