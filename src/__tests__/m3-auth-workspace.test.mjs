import test from "node:test";
import assert from "node:assert/strict";

test("M3 redirect sanitization, org naming, and slug rules", async () => {
  const helpers = await import("../lib/workspace/helpers.ts");

  assert.equal(helpers.sanitizeNextPath("/app"), "/app");
  assert.equal(helpers.sanitizeNextPath("/app/new?step=1"), "/app/new?step=1");
  assert.equal(helpers.sanitizeNextPath("https://evil.com"), "/app");
  assert.equal(helpers.sanitizeNextPath("//evil.com/phish"), "/app");
  assert.equal(helpers.sanitizeNextPath("/\\evil.com"), "/app");
  assert.equal(helpers.sanitizeNextPath(null), "/app");
  assert.equal(helpers.sanitizeNextPath("javascript:alert(1)"), "/app");

  assert.equal(
    helpers.deriveOrgNameFromEmail("alex@nordbike-energy.example"),
    "Nordbike Energy Workspace",
  );
  assert.equal(helpers.deriveOrgNameFromEmail("invalid"), "Battery Brand Workspace");

  assert.equal(
    helpers.slugifyPassportName("TrailPack 36V / 500Wh!!"),
    "trailpack-36v-500wh",
  );
  assert.equal(helpers.slugifyPassportName("   ---   "), "battery-passport");
});
