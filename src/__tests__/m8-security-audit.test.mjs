import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

function collectSourceFiles(dir) {
  const results = [];
  for (const entry of readdirSync(resolve(dir))) {
    const rel = join(dir, entry);
    const abs = resolve(rel);
    if (statSync(abs).isDirectory()) {
      results.push(...collectSourceFiles(rel));
    } else if (/\.(ts|tsx|mjs)$/.test(entry)) {
      results.push(rel);
    }
  }
  return results;
}

test("M8 security headers configured in next.config.ts and README documentation complete", () => {
  const nextConfigSrc = readFileSync(resolve("next.config.ts"), "utf8");
  for (const requiredHeader of [
    "X-Content-Type-Options",
    "nosniff",
    "X-Frame-Options",
    "DENY",
    "Referrer-Policy",
    "Permissions-Policy",
    "Content-Security-Policy",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ]) {
    assert.ok(
      nextConfigSrc.includes(requiredHeader),
      `next.config.ts must include security header token: ${requiredHeader}`,
    );
  }

  const readmePath = resolve("README.md");
  assert.ok(existsSync(readmePath), "README.md must exist");
  const readmeSrc = readFileSync(readmePath, "utf8");
  for (const requiredSection of [
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_MODEL",
    "claude-haiku-5-5",
    "claude-sonnet-5-5",
    "BILLING_ENABLED",
    "src/config/battery-fields.ts",
    "supabase/migrations",
    "Not legal advice",
  ]) {
    assert.ok(
      readmeSrc.includes(requiredSection),
      `README.md must document ${requiredSection}`,
    );
  }
});

test("M8 API memory-DoS guard, checkout rate limiting, and zero dangerous sinks", () => {
  const extractSrc = readFileSync(
    resolve("src/app/api/passports/extract/route.ts"),
    "utf8",
  );
  const sizeCheckIdx = extractSrc.indexOf("fileEntry.size > siteConfig.maxUploadBytes");
  const arrayBufferIdx = extractSrc.indexOf("fileEntry.arrayBuffer()");
  assert.ok(sizeCheckIdx > 0, "extract route must check fileEntry.size before buffering");
  assert.ok(
    sizeCheckIdx < arrayBufferIdx,
    "extract route must enforce size limit BEFORE arrayBuffer() allocation",
  );

  const checkoutSrc = readFileSync(
    resolve("src/app/api/billing/checkout/route.ts"),
    "utf8",
  );
  assert.ok(
    checkoutSrc.includes("enforceRateLimit"),
    "checkout route must enforce per-user rate limit",
  );

  // Zero dangerous sinks, debug console.log calls, or third-party tracking scripts in src/app & src/components & src/lib
  const appFiles = [
    ...collectSourceFiles("src/app"),
    ...collectSourceFiles("src/components"),
    ...collectSourceFiles("src/lib"),
  ];
  for (const rel of appFiles) {
    const src = readFileSync(resolve(rel), "utf8");
    for (const forbidden of [
      "dangerouslySetInnerHTML",
      "console.log(",
      "eval(",
      "new Function(",
      "innerHTML",
      "gtag(",
      "posthog",
      "mixpanel",
    ]) {
      assert.equal(
        src.includes(forbidden),
        false,
        `Forbidden sink/tracker '${forbidden}' found in ${rel}`,
      );
    }
  }
});
