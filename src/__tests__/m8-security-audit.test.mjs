import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { isTestBillingSimulationAllowed } from "../lib/billing/index.ts";
import { validateBrandLogoUpload } from "../lib/branding/logo.ts";
import { escapePostgresLikePattern } from "../lib/service/auth.ts";
import { buildEuRegistryJsonLd } from "../lib/export/jsonld.ts";

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
  ]) {
    assert.ok(
      readmeSrc.includes(requiredSection),
      `README.md must document ${requiredSection}`,
    );
  }
  assert.match(
    readmeSrc,
    /not legal advice/i,
    "README.md must document Not legal advice disclaimer",
  );
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

test("Security hardening: test billing simulation fails closed in Vercel/production environments", () => {
  assert.equal(
    isTestBillingSimulationAllowed({
      VERCEL_ENV: "production",
      NODE_ENV: "production",
      BILLING_ENABLED: "false",
      ALLOW_TEST_BILLING_SIMULATION: "true",
    }),
    false,
    "VERCEL_ENV=production must unconditionally block test billing simulation",
  );
  assert.equal(
    isTestBillingSimulationAllowed({
      NODE_ENV: "production",
      BILLING_ENABLED: "false",
    }),
    false,
    "NODE_ENV=production with BILLING_ENABLED=false must fail closed unless explicitly opted in",
  );
  assert.equal(
    isTestBillingSimulationAllowed({
      NODE_ENV: "development",
      BILLING_ENABLED: "true",
      PADDLE_API_KEY: "pdl_live_secret",
    }),
    false,
    "Active Paddle billing must never allow simulation",
  );
  assert.equal(
    isTestBillingSimulationAllowed({
      NODE_ENV: "development",
      BILLING_ENABLED: "false",
    }),
    true,
    "Local dev with BILLING_ENABLED=false keeps Dev Mode toggle working",
  );
});

test("Security hardening: brand logo validation enforces raster magic bytes and rejects active SVG XSS", () => {
  const validPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  assert.equal(
    validateBrandLogoUpload({ bytes: validPng, mimeType: "image/png" }).ext,
    "png",
  );

  // Spoofed PNG containing HTML/JS must fail
  const fakePng = new Uint8Array(Buffer.from("<script>alert(1)</script>", "utf8"));
  assert.throws(
    () => validateBrandLogoUpload({ bytes: fakePng, mimeType: "image/png" }),
    /Invalid PNG/i,
  );

  // Safe SVG passes
  const safeSvg = new Uint8Array(
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24"/></svg>'),
  );
  assert.equal(
    validateBrandLogoUpload({ bytes: safeSvg, mimeType: "image/svg+xml" }).ext,
    "svg",
  );

  // Active XSS SVGs must fail
  for (const evil of [
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)">x</a></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body>hi</body></foreignObject></svg>',
    '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>',
  ]) {
    assert.throws(
      () =>
        validateBrandLogoUpload({
          bytes: new Uint8Array(Buffer.from(evil, "utf8")),
          mimeType: "image/svg+xml",
        }),
      /unsafe markup|rejected/i,
    );
  }
});

test("Security hardening: Postgres ILIKE wildcard escaping & JSON-LD commodityCode allowlist", () => {
  assert.equal(escapePostgresLikePattern("QA-SN_001%\\test"), "QA-SN\\_001\\%\\\\test");

  const docValid = buildEuRegistryJsonLd({
    slug: "test-pack",
    origin: "https://cratepass.app",
    batteryCategory: "LMT",
    versionNumber: 1,
    declaredAt: "2026-11-20T00:00:00Z",
    rawFields: { manufacturer_name: "NordVolt" },
    commodityCode: "8507.60.00",
  });
  assert.equal(docValid["din99100:commodityCode"], "8507.60.00");

  const docInvalid = buildEuRegistryJsonLd({
    slug: "test-pack",
    origin: "https://cratepass.app",
    batteryCategory: "LMT",
    versionNumber: 1,
    declaredAt: "2026-11-20T00:00:00Z",
    rawFields: { manufacturer_name: "NordVolt" },
    commodityCode: "<script>alert(1)</script>",
  });
  assert.equal(docInvalid["din99100:commodityCode"], null);
});

test("Security hardening: secret hygiene, owner role gates, RLS across all migrations, and HSTS", () => {
  // 1. No server-only secrets referenced in any 'use client' file
  const allSrcFiles = [
    ...collectSourceFiles("src/app"),
    ...collectSourceFiles("src/components"),
    ...collectSourceFiles("src/lib"),
  ];
  const secretNames = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "GEMINI_API_KEY",
    "ANTHROPIC_API_KEY",
    "PADDLE_API_KEY",
    "PADDLE_WEBHOOK_SECRET",
    "supabase/admin",
  ];
  for (const rel of allSrcFiles) {
    const src = readFileSync(resolve(rel), "utf8");
    if (/^\s*["']use client["']/.test(src)) {
      for (const secret of secretNames) {
        assert.equal(
          src.includes(secret),
          false,
          `Client component ${rel} must never reference ${secret}`,
        );
      }
    }
  }

  // 2. .gitignore ignores .env* except .env.example
  const gitignore = readFileSync(resolve(".gitignore"), "utf8");
  assert.match(gitignore, /^\.env\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);

  // 3. Owner role enforcement on privileged workspace credential endpoints
  for (const route of [
    "src/app/api/settings/api-keys/route.ts",
    "src/app/api/settings/service-tokens/route.ts",
    "src/app/api/settings/branding/route.ts",
  ]) {
    const src = readFileSync(resolve(route), "utf8");
    assert.ok(
      src.includes('ctx.org.role !== "owner"'),
      `${route} must enforce workspace owner role`,
    );
  }

  // 4. Webhook size guard, supplier atomic expiry guard, and DoC sandbox header
  const webhookSrc = readFileSync(resolve("src/app/api/webhooks/paddle/route.ts"), "utf8");
  assert.ok(webhookSrc.includes("MAX_WEBHOOK_BYTES"));
  assert.ok(webhookSrc.includes("isWebhookConfigured()"));

  const supplierSrc = readFileSync(resolve("src/app/api/supplier/[token]/route.ts"), "utf8");
  assert.ok(supplierSrc.includes('.gt("expires_at"'));
  assert.ok(supplierSrc.includes("randomUUID()"));

  const docSrc = readFileSync(resolve("src/app/api/p/[slug]/doc/route.ts"), "utf8");
  assert.ok(docSrc.includes("sandbox"));
  assert.ok(docSrc.includes('record_mode !== "simple_qr"'));

  // 5. All SQL migrations enable RLS on every created table and never use USING (true)
  const migDir = resolve("supabase/migrations");
  const allSql = readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(migDir, f), "utf8"))
    .join("\n");

  const createdTables = [
    ...allSql.matchAll(/CREATE TABLE IF NOT EXISTS\s+public\.([a-z0-9_]+)/gi),
  ].map((m) => m[1]);
  assert.ok(createdTables.length >= 10, "Expected all core + M10-M13 tables in migrations");
  for (const tbl of createdTables) {
    assert.match(
      allSql,
      new RegExp(`ALTER TABLE\\s+public\\.${tbl}\\s+ENABLE ROW LEVEL SECURITY`, "i"),
      `Table public.${tbl} must enable Row Level Security`,
    );
  }
  assert.equal(
    /USING\s*\(\s*true\s*\)/i.test(allSql),
    false,
    "No SQL migration may define an overly permissive USING (true) policy",
  );

  // 6. HSTS header configured
  const nextConfigSrc = readFileSync(resolve("next.config.ts"), "utf8");
  assert.ok(nextConfigSrc.includes("Strict-Transport-Security"));
});
