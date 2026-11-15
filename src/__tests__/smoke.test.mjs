import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Slice 1 DPP concept demo data and safety invariants", () => {
  const passport = JSON.parse(
    readFileSync(resolve("src/data/passport.json"), "utf8"),
  );

  // Brand, product, and persistent demo badge
  assert.equal(passport.meta.brand, "Demo Brand");
  assert.equal(passport.meta.product, "DB-36V Battery Pack");
  assert.equal(passport.meta.badgeText, "Concept demo – fictional data");

  // Zero legal compliance claims
  const serialized = JSON.stringify(passport);
  assert.equal(/100%\s*compliant|certified\s*compliant|legally\s*compliant/i.test(serialized), false);

  // Tab 1 access tier tags and reconciling impact math
  const validTiers = new Set(["Public", "Restricted (authorities/repairers)"]);
  for (const key of ["identity", "integrity", "careRepair", "impact"]) {
    assert.ok(
      validTiers.has(passport.passportData[key].accessTier),
      `Invalid accessTier on ${key}`,
    );
  }
  const carbonPctSum =
    passport.passportData.impact.data.carbonLifecycleBreakdown.reduce(
      (sum, s) => sum + s.sharePct,
      0,
    );
  assert.equal(carbonPctSum, 100);
  const carbonKgSum =
    passport.passportData.impact.data.carbonLifecycleBreakdown.reduce(
      (sum, s) => sum + s.kgCo2e,
      0,
    );
  assert.equal(
    Number(carbonKgSum.toFixed(1)),
    passport.passportData.impact.data.carbonFootprintTotalKg,
  );
  const materialPctSum = passport.passportData.impact.data.materials.reduce(
    (sum, m) => sum + m.massSharePct,
    0,
  );
  assert.equal(materialPctSum, 100);

  // Tab 2 safety boundary: only Fuse and Latch carry user repair steps
  const hotspots = new Map(
    passport.repairView.hotspots.map((spot) => [spot.id, spot]),
  );
  assert.deepEqual([...hotspots.keys()].sort(), [
    "bms-board",
    "cell-pack",
    "fuse",
    "latch",
  ]);
  for (const id of ["fuse", "latch"]) {
    const spot = hotspots.get(id);
    assert.equal(spot.serviceability, "user");
    assert.ok(Array.isArray(spot.repairSteps) && spot.repairSteps.length > 0);
    assert.ok(spot.sparePart?.partNumber);
  }
  for (const id of ["cell-pack", "bms-board"]) {
    const spot = hotspots.get(id);
    assert.equal(spot.serviceability, "authorised-only");
    assert.equal(
      spot.safetyTag,
      "Authorised service only – do not open the pack",
    );
    assert.equal(spot.repairSteps, undefined);
    assert.equal(spot.toolRequired, undefined);
    assert.ok(spot.sparePart?.partNumber);
  }

  // Tab 3 supply stages
  assert.deepEqual(
    passport.supplyJourney.map((s) => s.stage),
    ["Raw Material Origin", "Cell Factory", "Assembly", "EU Warehouse"],
  );

  // Tab 4 demo verification labels
  const demoLabel = "DEMO – no real verification performed";
  for (const field of ["statusValue", "timestampValue", "digestValue"]) {
    assert.ok(
      passport.authenticity[field].includes(demoLabel),
      `${field} missing required demo label`,
    );
    assert.equal(
      /\b(verified|authentic)\b/i.test(passport.authenticity[field]),
      false,
      `${field} must not use bare Verified/Authentic`,
    );
  }

  // Slice 1.5 landing page & /demo route checks
  const demoPage = readFileSync(resolve("src/app/demo/page.tsx"), "utf8");
  assert.ok(demoPage.includes("PassportDataTab"), "/demo must keep the 4-tab passport UI");

  const landingSources = [
    readFileSync(resolve("src/app/page.tsx"), "utf8"),
    readFileSync(resolve("src/components/landing/PassportPreview.tsx"), "utf8"),
    readFileSync(resolve("src/config/site.ts"), "utf8"),
  ]
    .join("\n")
    .replace(/\s+/g, " ");

  assert.equal(
    /\b(compliant|certified|verified)\b/i.test(landingSources),
    false,
    "Landing page must never use compliant, certified, or verified about customer products",
  );
  assert.ok(landingSources.includes("EU Battery Passport from your spec PDF"));
  assert.ok(landingSources.includes("Completeness check"));
  assert.ok(landingSources.includes("Sample output – illustrative"));
  assert.ok(landingSources.includes("Free pilot for the first few brands."));
  assert.ok(landingSources.includes("WORKING_FIELD_LIST_NOTICE"));
  assert.ok(
    landingSources.includes(
      "Not legal advice. We provide technical hosting infrastructure, not compliance certification.",
    ),
  );
});
