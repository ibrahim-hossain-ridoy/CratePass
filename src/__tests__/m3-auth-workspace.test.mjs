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

test("M3 pre-submit email validation blocks dummy/disposable addresses and catches domain typos", async () => {
  const { validateAuthEmail } = await import("../lib/auth/email-validation.ts");

  // Valid real work & personal emails pass
  const okWork = validateAuthEmail("  Elena.Meyer@NordBike.de ");
  assert.equal(okWork.ok, true);
  assert.equal(okWork.normalizedEmail, "elena.meyer@nordbike.de");

  const okGmail = validateAuthEmail("ibrahim369hossain@gmail.com");
  assert.equal(okGmail.ok, true);

  // Blocked dummy / disposable domains
  for (const blocked of [
    "user@example.com",
    "user@example.org",
    "user@test.com",
    "user@mailinator.com",
    "user@tempmail.com",
    "user@guerrillamail.com",
    "user@yopmail.com",
    "user@10minutemail.com",
  ]) {
    const res = validateAuthEmail(blocked);
    assert.equal(res.ok, false, `Expected ${blocked} to be blocked`);
    assert.equal(res.kind, "blocked");
    assert.equal(res.message, "Please enter a real work email address.");
  }

  // Blocked dummy local parts (including exapmle@gmail.com)
  for (const dummy of [
    "exapmle@gmail.com",
    "test@gmail.com",
    "fake@company.de",
    "asdf@company.de",
    "qwerty@company.de",
    "aaa@company.de",
  ]) {
    const res = validateAuthEmail(dummy);
    assert.equal(res.ok, false, `Expected ${dummy} to be blocked`);
    assert.equal(res.kind, "blocked");
    assert.equal(res.message, "Please enter a real work email address.");
  }

  // Common domain typos produce 1-click suggestion
  for (const [typo, fixed] of [
    ["alex@gmial.com", "alex@gmail.com"],
    ["alex@gmal.com", "alex@gmail.com"],
    ["alex@gamil.com", "alex@gmail.com"],
    ["alex@gnail.com", "alex@gmail.com"],
    ["alex@yaho.com", "alex@yahoo.com"],
    ["alex@hotmal.com", "alex@hotmail.com"],
    ["alex@outlok.com", "alex@outlook.com"],
  ]) {
    const res = validateAuthEmail(typo);
    assert.equal(res.ok, false, `Expected typo detection for ${typo}`);
    assert.equal(res.kind, "typo");
    assert.equal(res.suggestedEmail, fixed);
  }
});
