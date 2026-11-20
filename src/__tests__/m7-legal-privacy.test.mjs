import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test("M7 production legal & pricing pages exist with zero TODO markers, verified operator details, and zero compliance claims", () => {
  const legalRoutes = [
    { path: "src/app/terms/page.tsx", expectedTopic: /Terms of Service/i },
    { path: "src/app/privacy/page.tsx", expectedTopic: /Privacy Policy/i },
    { path: "src/app/refund/page.tsx", expectedTopic: /Refund.*Cancellation/i },
    { path: "src/app/disclaimer/page.tsx", expectedTopic: /Disclaimer/i },
  ];

  for (const route of legalRoutes) {
    const abs = resolve(route.path);
    assert.ok(existsSync(abs), `${route.path} must exist`);
    const content = readFileSync(abs, "utf8");
    assert.ok(
      content.includes("LegalDocumentShell"),
      `${route.path} should render LegalDocumentShell`,
    );
    assert.ok(
      route.expectedTopic.test(content),
      `${route.path} should cover its expected legal topic`,
    );
    assert.equal(
      /\bTODO\b/.test(content),
      false,
      `Literal TODO string must not appear in ${route.path}`,
    );

    const sanitized = content.replace(/not verified by (?:us|cratepass)/gi, "");
    assert.equal(
      /\b(compliant|certified|verified)\b/i.test(sanitized),
      false,
      `Banned compliance/certification claim word found in ${route.path}`,
    );
  }

  const shellContent = readFileSync(
    resolve("src/components/legal/LegalDocumentShell.tsx"),
    "utf8",
  );
  assert.equal(
    /\bTODO\b/.test(shellContent),
    false,
    "LegalDocumentShell must not render literal TODO markers",
  );

  const siteContent = readFileSync(resolve("src/config/site.ts"), "utf8");
  assert.ok(siteContent.includes("MD Ibrahim Hossain Ridoy"));
  assert.ok(siteContent.includes("ibrahim369hossain@gmail.com"));
  assert.ok(siteContent.includes("Dhaka, Bangladesh"));
  assert.ok(siteContent.includes("2026-11-20"));

  const privacyContent = readFileSync(resolve("src/app/privacy/page.tsx"), "utf8");
  for (const needle of [
    /Supabase/i,
    /Vercel/i,
    /Gemini/i,
    /Anthropic/i,
    /Paddle/i,
    /dynamic_bms_logs/i,
    /\/supplier\/\[token\]/i,
    /\/service\/\[slug\]/i,
    /30 days/i,
    /GDPR/i,
    /analytics/i,
  ]) {
    assert.match(privacyContent, needle, `/privacy must disclose ${needle}`);
  }

  const termsContent = readFileSync(resolve("src/app/terms/page.tsx"), "utf8");
  for (const needle of [
    /18\+/,
    /30 days/i,
    /90 days/i,
    /Paddle/i,
    /governingLaw|Bangladesh/i,
    /Notified Body/i,
    /auto-renew/i,
  ]) {
    assert.match(termsContent, needle, `/terms must cover ${needle}`);
  }

  const refundContent = readFileSync(resolve("src/app/refund/page.tsx"), "utf8");
  for (const needle of [/Paddle/i, /Merchant of Record/i, /14-day|14 calendar days/i, /\/app\/billing/]) {
    assert.match(refundContent, needle, `/refund must cover ${needle}`);
  }

  const pricingPagePath = resolve("src/app/pricing/page.tsx");
  assert.ok(existsSync(pricingPagePath), "Public /pricing page must exist");
  const pricingContent = readFileSync(pricingPagePath, "utf8");
  assert.ok(pricingContent.includes("PricingSection"));
  assert.ok(pricingContent.includes("PLAN_COMPARISON_ROWS"));
  assert.ok(pricingContent.includes("PublicFooter"));
});

test("M7 GDPR export route, cascade delete, middleware reserves, and complete public footer links", () => {
  const exportPath = resolve("src/app/api/org/export/route.ts");
  assert.ok(existsSync(exportPath), "/api/org/export/route.ts must exist");
  const exportSrc = readFileSync(exportPath, "utf8");
  assert.ok(exportSrc.includes("getWorkspaceContext"));
  assert.ok(exportSrc.includes("org.exported"));
  assert.ok(exportSrc.includes("attachment; filename="));

  const passportRouteSrc = readFileSync(
    resolve("src/app/api/passports/[id]/route.ts"),
    "utf8",
  );
  assert.ok(passportRouteSrc.includes("export async function DELETE"));
  assert.ok(passportRouteSrc.includes("passport_versions"));

  const footerPath = resolve("src/components/PublicFooter.tsx");
  assert.ok(existsSync(footerPath), "Shared PublicFooter component must exist");
  const footerSrc = readFileSync(footerPath, "utf8");
  for (const href of ["/pricing", "/checker", "/terms", "/privacy", "/refund", "/disclaimer"]) {
    assert.ok(footerSrc.includes(href), `PublicFooter must link to ${href}`);
  }

  // Verify /, /checker, /pricing, and LegalDocumentShell all render PublicFooter
  for (const file of [
    "src/app/page.tsx",
    "src/components/checker/EligibilityChecker.tsx",
    "src/app/pricing/page.tsx",
    "src/components/legal/LegalDocumentShell.tsx",
  ]) {
    const src = readFileSync(resolve(file), "utf8");
    assert.ok(src.includes("PublicFooter"), `${file} must render PublicFooter`);
  }

  const middlewareSrc = readFileSync(resolve("src/middleware.ts"), "utf8");
  assert.ok(middlewareSrc.includes('"/pricing"'), "middleware must reserve /pricing");
  assert.ok(middlewareSrc.includes('"/refund"'), "middleware must reserve /refund");

  const privacyWorkspaceSrc = readFileSync(
    resolve("src/components/workspace/PrivacyWorkspace.tsx"),
    "utf8",
  );
  assert.equal(/\bTODO\b/.test(privacyWorkspaceSrc), false);
});
