import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test("M7 legal draft pages exist with TODO lawyer review markers and zero compliance claims", () => {
  const routes = [
    { path: "src/app/terms/page.tsx", expectedTopic: /Terms of Service/i },
    { path: "src/app/privacy/page.tsx", expectedTopic: /Privacy|GDPR/i },
    { path: "src/app/disclaimer/page.tsx", expectedTopic: /Disclaimer/i },
  ];

  for (const route of routes) {
    const abs = resolve(route.path);
    assert.ok(existsSync(abs), `${route.path} must exist`);
    const content = readFileSync(abs, "utf8");
    assert.ok(
      content.includes("LegalDocumentShell"),
      `${route.path} should render LegalDocumentShell`,
    );
    assert.ok(
      route.expectedTopic.test(content),
      `${route.path} should cover its expected legal section`,
    );

    const sanitized = content.replace(/not verified by us/gi, "");
    assert.equal(
      /\b(compliant|certified|verified)\b/i.test(sanitized),
      false,
      `Banned compliance/certification claim word found in ${route.path}`,
    );
  }

  const shellPath = resolve("src/components/legal/LegalDocumentShell.tsx");
  assert.ok(existsSync(shellPath), "LegalDocumentShell.tsx must exist");
  const shellContent = readFileSync(shellPath, "utf8");
  assert.ok(
    shellContent.includes("TODO: lawyer review"),
    "Legal pages shell must carry visible TODO: lawyer review marker",
  );

  const privacyContent = readFileSync(resolve("src/app/privacy/page.tsx"), "utf8");
  assert.ok(
    /analytics/i.test(privacyContent) && /GDPR/i.test(privacyContent),
    "/privacy must cover EU GDPR processing and zero analytics tracking by default",
  );
});

test("M7 GDPR export route, draft delete guardrails, and footer legal links", () => {
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
  assert.ok(
    passportRouteSrc.includes("export async function DELETE"),
    "Draft deletion handler must exist on /api/passports/[id]",
  );
  assert.ok(
    passportRouteSrc.includes("passport_versions"),
    "Draft delete must check immutable passport_versions before deleting",
  );

  const homeSrc = readFileSync(resolve("src/app/page.tsx"), "utf8");
  for (const href of ["/terms", "/privacy", "/disclaimer"]) {
    assert.ok(homeSrc.includes(href), `Landing page footer must link to ${href}`);
  }
});
