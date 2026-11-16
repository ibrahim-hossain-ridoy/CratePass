import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  BLANK_DRAFT_AUDIT_ACTION,
  buildBlankDraftPayload,
} from "../lib/workspace/blank-draft.ts";
import { STATIC_BATTERY_FIELDS } from "../config/battery-fields.ts";
import { canOrgPublish, preparePublishSnapshots } from "../lib/publish.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("buildBlankDraftPayload initializes all static fields as missing, defaults to LMT, and uses zero LLM tokens or extraction cap", () => {
  const payload = buildBlankDraftPayload({});
  assert.equal(payload.batteryCategory, "LMT");
  assert.equal(payload.auditAction, "blank_draft_created");
  assert.equal(payload.consumesExtractionCap, false);
  assert.equal(payload.createsUploadRecord, false);
  assert.equal(payload.extraction.usage.inputTokens, 0);
  assert.equal(payload.extraction.usage.outputTokens, 0);
  assert.equal(payload.extraction.summary.found, 0);
  assert.equal(payload.extraction.summary.uncertain, 0);
  assert.equal(
    payload.extraction.summary.missing,
    STATIC_BATTERY_FIELDS.length,
  );
  assert.equal(
    Object.keys(payload.extraction.fields).length,
    STATIC_BATTERY_FIELDS.length,
  );

  for (const field of STATIC_BATTERY_FIELDS) {
    assert.equal(payload.extraction.fields[field.key].status, "missing");
    assert.equal(payload.extraction.fields[field.key].value, "");
  }

  const customPayload = buildBlankDraftPayload({
    batteryCategory: "EV",
    productName: "NordVolt Traction 800V",
    modelCode: "NV-EV-800V",
  });
  assert.equal(customPayload.batteryCategory, "EV");
  assert.equal(customPayload.productName, "NordVolt Traction 800V");
  assert.equal(customPayload.modelCode, "NV-EV-800V");
  assert.equal(customPayload.workingFields.battery_category, "EV");
  assert.equal(
    customPayload.workingFields.model_serial_number,
    "NV-EV-800V",
  );
});

test("Blank draft API route and UI make zero LLM calls, skip uploads table, and log blank_draft_created", () => {
  const routePath = path.join(
    repoRoot,
    "src/app/api/passports/blank/route.ts",
  );
  assert.ok(fs.existsSync(routePath), "Blank draft API route must exist");
  const routeCode = fs.readFileSync(routePath, "utf8");

  assert.equal(BLANK_DRAFT_AUDIT_ACTION, "blank_draft_created");
  assert.match(routeCode, /BLANK_DRAFT_AUDIT_ACTION/);
  assert.doesNotMatch(
    routeCode,
    /extractBatteryFieldsFromText/,
    "Blank draft route must never invoke LLM extraction",
  );
  assert.doesNotMatch(
    routeCode,
    /\.from\(["']uploads["']\)/,
    "Blank draft route must never insert into uploads (preserving daily extraction cap)",
  );

  const flowPath = path.join(
    repoRoot,
    "src/components/workspace/NewPassportFlow.tsx",
  );
  const flowCode = fs.readFileSync(flowPath, "utf8");
  assert.match(
    flowCode,
    /No PDF\? Start blank passport draft/,
    "NewPassportFlow must render 'No PDF? Start blank passport draft' secondary action",
  );
  assert.match(flowCode, /\/api\/passports\/blank/);
});

test("Blank draft uses the exact same downstream publish accuracy declaration and billing gate as PDF drafts", () => {
  const draft = buildBlankDraftPayload({
    batteryCategory: "LMT",
    productName: "Manual Entry Pack",
    modelCode: "LMT-MANUAL-01",
  });

  // Require accuracy declaration checkbox before publishing
  assert.throws(() => {
    preparePublishSnapshots({
      workingFields: draft.workingFields,
      declarationAccepted: false,
      batteryCategory: draft.batteryCategory,
    });
  }, /Accuracy declaration required/i);

  // Same billing gate enforcement
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: false,
    }),
    false,
  );
  assert.equal(
    canOrgPublish({
      billingEnabled: true,
      billingStatus: "active",
      compEnabled: false,
    }),
    true,
  );

  // Populating fields manually on the blank draft produces valid 3-tier snapshots
  const manualFields = {
    ...draft.workingFields,
    manufacturer_name: "NordVolt Mobility Craft",
    nominal_voltage_v: "48",
    detailed_composition: "LFP cathode, graphite anode",
    compliance_test_reports: "TR-MANUAL-2026.pdf",
  };
  const snapshots = preparePublishSnapshots({
    workingFields: manualFields,
    declarationAccepted: true,
    batteryCategory: draft.batteryCategory,
  });
  assert.equal(
    snapshots.snapshotPublicFields.manufacturer_name,
    "NordVolt Mobility Craft",
  );
  assert.equal(
    "detailed_composition" in snapshots.snapshotPublicFields,
    false,
  );
  assert.equal(
    snapshots.snapshotLegitimateInterestFields.detailed_composition,
    "LFP cathode, graphite anode",
  );
  assert.equal(
    snapshots.snapshotAuthoritiesOnlyFields.compliance_test_reports,
    "TR-MANUAL-2026.pdf",
  );
});
