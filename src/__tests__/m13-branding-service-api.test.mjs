import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("M13 custom domain normalization, CNAME target, and brand accent hex validation", async () => {
  const domainMod = await import("../lib/branding/domain.ts");

  assert.equal(domainMod.CNAME_TARGET, "cname.cratepass.app");
  assert.equal(
    domainMod.normalizeCustomDomain("https://Pass.MyEbike.EU/p/test"),
    "pass.myebike.eu",
  );
  assert.equal(domainMod.normalizeCustomDomain("localhost:3000"), null);
  assert.equal(domainMod.normalizeCustomDomain("not a domain"), null);
  assert.equal(domainMod.normalizeCustomDomain("app.cratepass.app"), null);

  assert.equal(domainMod.validateBrandAccentHex("#145b6e"), "#145b6e");
  assert.equal(domainMod.validateBrandAccentHex("#3EB8CF"), "#3eb8cf");
  assert.equal(domainMod.validateBrandAccentHex("red"), null);
  assert.equal(domainMod.validateBrandAccentHex("#12345"), null);

  assert.equal(domainMod.isPrimaryAppHost("localhost:3000"), true);
  assert.equal(domainMod.isPrimaryAppHost("pass.myebike.eu"), false);
});

test("M13 service PIN hashing/verification, API key hashing, and dynamic BMS payload validation", async () => {
  const serviceMod = await import("../lib/service/auth.ts");

  const workspaceId = "11111111-1111-4111-8111-111111111111";
  const pinHash = serviceMod.hashServicePin(workspaceId, "482910");
  assert.equal(pinHash.length, 64);
  assert.equal(
    serviceMod.verifyServicePin(workspaceId, "482910", pinHash),
    true,
  );
  assert.equal(
    serviceMod.verifyServicePin(workspaceId, "000000", pinHash),
    false,
  );
  // Different workspace with same PIN produces different hash (workspace-salted)
  assert.notEqual(
    pinHash,
    serviceMod.hashServicePin("22222222-2222-4222-8222-222222222222", "482910"),
  );

  const generatedKey = serviceMod.generateWorkspaceApiKey();
  assert.ok(generatedKey.rawKey.startsWith("cp_live_"));
  assert.equal(generatedKey.keyHash.length, 64);
  assert.equal(
    serviceMod.hashWorkspaceApiKey(generatedKey.rawKey),
    generatedKey.keyHash,
  );

  const validLog = serviceMod.DynamicBmsEntrySchema.safeParse({
    stateOfHealthPct: 92.5,
    cycleCount: 145,
    internalResistanceMohm: 42.3,
    lifecycleStatus: "repaired",
    notes: "Replaced external fuse and ran capacity balance test.",
  });
  assert.equal(validLog.success, true);

  const invalidSoH = serviceMod.DynamicBmsEntrySchema.safeParse({
    stateOfHealthPct: 140,
    lifecycleStatus: "original",
  });
  assert.equal(invalidSoH.success, false);
});

test("M13 migration 202611200004 enables RLS on service tables and REST API / service routes never mutate immutable snapshots", () => {
  const sql = fs.readFileSync(
    path.join(
      repoRoot,
      "supabase/migrations/202611200004_service_portal_and_dynamic_logs.sql",
    ),
    "utf8",
  );

  for (const table of [
    "service_access_tokens",
    "dynamic_bms_logs",
    "workspace_api_keys",
  ]) {
    assert.match(
      sql,
      new RegExp(`create table if not exists public\\.${table}`, "i"),
      `Missing table ${table}`,
    );
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      `Missing RLS on ${table}`,
    );
  }

  const serviceRouteSrc = fs.readFileSync(
    path.join(repoRoot, "src/app/api/service/[slug]/route.ts"),
    "utf8",
  );
  assert.ok(serviceRouteSrc.includes("verifyServicePin"));
  assert.ok(serviceRouteSrc.includes("dynamic_bms_logs"));
  assert.equal(
    serviceRouteSrc.includes("passport_versions"),
    false,
    "Service portal must never mutate immutable passport_versions",
  );

  const v1DynamicSrc = fs.readFileSync(
    path.join(repoRoot, "src/app/api/v1/passports/[id]/dynamic/route.ts"),
    "utf8",
  );
  assert.ok(v1DynamicSrc.includes("hashWorkspaceApiKey"));
  assert.ok(v1DynamicSrc.includes("hasProFeatureAccess"));
  assert.ok(v1DynamicSrc.includes("dynamic_bms_logs"));
  assert.equal(
    v1DynamicSrc.includes("passport_versions"),
    false,
    "Dynamic BMS API must never mutate immutable passport_versions",
  );

  const middlewareSrc = fs.readFileSync(
    path.join(repoRoot, "src/middleware.ts"),
    "utf8",
  );
  assert.ok(middlewareSrc.includes("resolve_verified_custom_domain"));
});
