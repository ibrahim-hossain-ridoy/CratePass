import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("M0 config, env template, gitignore, and battery working field list invariants", async () => {
  const gitignore = readFileSync(resolve(".gitignore"), "utf8");
  assert.ok(gitignore.includes(".env*"), ".gitignore must ignore .env*");
  assert.ok(gitignore.includes("!.env.example"), ".gitignore must explicitly track .env.example");

  const envExample = readFileSync(resolve(".env.example"), "utf8");
  assert.ok(envExample.includes("SUPABASE_SERVICE_ROLE_KEY="));
  assert.ok(envExample.includes("ANTHROPIC_MODEL=claude-haiku-5-5"));
  assert.ok(envExample.includes("claude-sonnet-5-5"));
  assert.ok(envExample.includes("BILLING_ENABLED=false"));

  const siteModule = await import("../config/site.ts");
  assert.equal(siteModule.siteConfig.siteName, "Battery Passport Host");
  assert.equal(siteModule.isBillingEnabled(), false);
  assert.equal(siteModule.siteConfig.dailyExtractionLimitPerOrg, 5);
  assert.equal(siteModule.siteConfig.defaultAnthropicModel, "claude-haiku-5-5");

  const fieldsModule = await import("../config/battery-fields.ts");
  assert.equal(
    fieldsModule.WORKING_FIELD_LIST_NOTICE,
    "Working field list. Check against the official regulation.",
  );
  const fields = fieldsModule.BATTERY_FIELDS;
  assert.ok(fields.length >= 28 && fields.length <= 36, `Expected ~30 fields, got ${fields.length}`);

  const seenKeys = new Set();
  const groups = new Set();
  const subSections = new Set();
  const tiers = new Set();
  for (const field of fields) {
    assert.ok(!seenKeys.has(field.key), `Duplicate key: ${field.key}`);
    seenKeys.add(field.key);
    assert.ok(field.label.length > 2);
    assert.equal(/\b(compliant|certified|verified)\b/i.test(field.label), false, `Banned compliance word in ${field.key}`);
    groups.add(field.group);
    subSections.add(field.subSection);
    tiers.add(field.tier);
  }

  assert.deepEqual([...groups].sort(), ["careRepair", "identity", "impact", "integrity"]);
  assert.deepEqual([...subSections].sort(), ["general", "recycling", "repair", "supply"]);
  assert.deepEqual([...tiers].sort(), ["public", "restricted"]);
});
