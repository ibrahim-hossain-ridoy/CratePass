import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  FREE_PLAN_LIMITS,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
  PLAN_CATALOG,
} from "../config/plans.ts";
import {
  checkDailyExtractionEntitlement,
  checkPublishEntitlement,
  checkSerializedUnitsEntitlement,
  hasProFeatureAccess,
  resolveWorkspacePlan,
} from "../lib/entitlements.ts";
import { evaluateBatteryEligibility } from "../lib/checker.ts";
import { OFFICIAL_STATIC_FIELDS } from "../config/battery-fields.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("M9 pricing configuration defines Free (3 live / 25 units / 5 daily PDFs) and Pro (€79/mo, configurable yearly)", () => {
  assert.equal(PRO_MONTHLY_EUR, 79);
  assert.equal(PRO_YEARLY_EUR, 790);
  assert.equal(FREE_PLAN_LIMITS.maxPublishedPassports, 3);
  assert.equal(FREE_PLAN_LIMITS.maxSerializedUnits, 25);
  assert.equal(FREE_PLAN_LIMITS.dailyPdfExtractions, 5);
  assert.equal(PLAN_CATALOG.pro.limits.maxPublishedPassports, null);
  assert.equal(PLAN_CATALOG.pro.limits.maxSerializedUnits, null);
  assert.equal(OFFICIAL_STATIC_FIELDS.length, 50);
});

test("M9 server-side entitlement checks enforce Free 3-product / 25-unit / 5-PDF caps vs Pro unlimited", () => {
  assert.equal(
    resolveWorkspacePlan({ billingStatus: "free", compEnabled: false }),
    "free",
  );
  assert.equal(
    resolveWorkspacePlan({ billingStatus: "active", compEnabled: false }),
    "pro",
  );
  assert.equal(
    resolveWorkspacePlan({ billingStatus: "free", compEnabled: true }),
    "pro",
  );

  // Free live published passport limit (3 max)
  assert.equal(
    checkPublishEntitlement({
      billingStatus: "free",
      compEnabled: false,
      publishedPassportsCount: 2,
      isAlreadyPublished: false,
      action: "publish",
    }).allowed,
    true,
  );
  const blocked4th = checkPublishEntitlement({
    billingStatus: "free",
    compEnabled: false,
    publishedPassportsCount: 3,
    isAlreadyPublished: false,
    action: "publish",
  });
  assert.equal(blocked4th.allowed, false);
  assert.equal(blocked4th.code, "PLAN_LIMIT_REACHED");
  assert.equal(blocked4th.limit, 3);

  // Updating already-published passport or unpublishing on Free is allowed even at 3/3
  assert.equal(
    checkPublishEntitlement({
      billingStatus: "free",
      compEnabled: false,
      publishedPassportsCount: 3,
      isAlreadyPublished: true,
      action: "publish_new_version",
    }).allowed,
    true,
  );
  assert.equal(
    checkPublishEntitlement({
      billingStatus: "free",
      compEnabled: false,
      publishedPassportsCount: 3,
      isAlreadyPublished: true,
      action: "unpublish",
    }).allowed,
    true,
  );

  // Free serialized unit cap (25 max across workspace)
  assert.equal(
    checkSerializedUnitsEntitlement({
      billingStatus: "free",
      compEnabled: false,
      currentUnitsCount: 20,
      incomingUnitsCount: 5,
    }).allowed,
    true,
  );
  const blocked26th = checkSerializedUnitsEntitlement({
    billingStatus: "free",
    compEnabled: false,
    currentUnitsCount: 20,
    incomingUnitsCount: 6,
  });
  assert.equal(blocked26th.allowed, false);
  assert.equal(blocked26th.code, "PLAN_LIMIT_REACHED");
  assert.equal(blocked26th.remaining, 5);

  // Pro allows unlimited serialized units and daily PDF extractions
  assert.equal(
    checkSerializedUnitsEntitlement({
      billingStatus: "active",
      compEnabled: false,
      currentUnitsCount: 1000,
      incomingUnitsCount: 5000,
    }).allowed,
    true,
  );
  assert.equal(
    checkDailyExtractionEntitlement({
      billingStatus: "free",
      compEnabled: false,
      dailyUsed: 5,
    }).allowed,
    false,
  );
  assert.equal(
    checkDailyExtractionEntitlement({
      billingStatus: "active",
      compEnabled: false,
      dailyUsed: 50,
    }).allowed,
    true,
  );
  assert.equal(
    hasProFeatureAccess({ billingStatus: "free", compEnabled: false }),
    false,
  );
  assert.equal(
    hasProFeatureAccess({ billingStatus: "active", compEnabled: false }),
    true,
  );
});

test("M9 public Eligibility & Gap Checker computes accurate 2027 dates, Annex XIII counts, and zero banned compliance words", () => {
  const lmtRes = evaluateBatteryEligibility({
    category: "LMT",
    marketDate: "feb_to_aug_2027",
    turnover: "under_40m",
    datasheetState: "partial_supplier",
  });
  assert.equal(lmtRes.passportMode, "full_passport");
  assert.equal(lmtRes.mappedCategory, "LMT");
  assert.equal(lmtRes.fieldBreakdown.totalPoints, 49);
  assert.equal(lmtRes.fieldBreakdown.publicCount, 30);
  assert.equal(lmtRes.fieldBreakdown.legitimateInterestCount, 18);
  assert.equal(lmtRes.fieldBreakdown.authoritiesOnlyCount, 1);
  assert.ok(
    lmtRes.obligations.some((o) => o.effectiveDate === "18 February 2027"),
  );
  assert.ok(
    lmtRes.obligations.some((o) => o.effectiveDate === "18 August 2027"),
  );

  const simpleQrRes = evaluateBatteryEligibility({
    category: "simple_qr",
    marketDate: "after_aug_2027",
    turnover: "over_150m",
    datasheetState: "none",
  });
  assert.equal(simpleQrRes.passportMode, "simple_qr");
  assert.equal(simpleQrRes.mappedCategory, null);
  assert.ok(
    simpleQrRes.obligations.some(
      (o) => o.id === "due_diligence" && o.status === "mandatory",
    ),
  );

  // Confirm no UI label displays "51 static"
  const uiFilesToCheck = [
    "src/components/landing/HeroPassportStage.tsx",
    "src/components/landing/PipelineScrollScene.tsx",
    "src/components/landing/AudienceIndexSection.tsx",
    "src/components/landing/InkFillSection.tsx",
    "src/components/auth/AuthSplitShell.tsx",
  ];
  for (const rel of uiFilesToCheck) {
    const src = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    assert.equal(
      /51\s*(LMT\s*)?static|value=\{51\}/i.test(src),
      false,
      `Found stale '51 static' label in ${rel}`,
    );
  }

  // Confirm checker copy has zero banned compliance claims
  const checkerComponent = fs.readFileSync(
    path.join(repoRoot, "src/components/checker/EligibilityChecker.tsx"),
    "utf8",
  );
  const stripped = checkerComponent
    .replace(/not verified by cratepass/gi, "")
    .replace(/not verified by us/gi, "");
  assert.equal(
    /\b(compliant|certified|verified)\b/i.test(stripped),
    false,
    "EligibilityChecker must not contain banned compliance/certification claim words",
  );
});
