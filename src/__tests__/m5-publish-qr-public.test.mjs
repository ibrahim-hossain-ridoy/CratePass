import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

test("M5 publish snapshot builder, declaration requirement, and billing gate", async () => {
  const publishMod = await import("../lib/publish.ts");

  // Must require manufacturer accuracy declaration
  assert.throws(
    () =>
      publishMod.preparePublishSnapshots({
        workingFields: { battery_model_name: "Alpine 36V" },
        declarationAccepted: false,
      }),
    /declaration/i,
  );

  // Must produce strict public projection without restricted fields
  const snaps = publishMod.preparePublishSnapshots({
    workingFields: {
      battery_model_name: "Alpine 36V",
      nominal_voltage_v: "36",
      bms_firmware_version: "SECRET-BMS-v2",
      dismantling_manual_ref: "RESTRICTED-DOC-9",
    },
    declarationAccepted: true,
  });

  assert.equal(snaps.snapshotAllFields.battery_model_name, "Alpine 36V");
  assert.equal(snaps.snapshotAllFields.bms_firmware_version, "SECRET-BMS-v2");
  assert.equal(snaps.snapshotPublicFields.battery_model_name, "Alpine 36V");
  assert.equal(snaps.snapshotPublicFields.bms_firmware_version, undefined);
  assert.equal(snaps.snapshotPublicFields.dismantling_manual_ref, undefined);

  // Billing feature gate logic
  assert.equal(
    publishMod.canOrgPublish({
      billingEnabled: false,
      billingStatus: "free",
      compEnabled: false,
    }),
    true,
  );
  assert.equal(
    publishMod.canOrgPublish({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: true,
    }),
    true,
  );
  assert.equal(
    publishMod.canOrgPublish({
      billingEnabled: true,
      billingStatus: "active",
      compEnabled: false,
    }),
    true,
  );
  assert.equal(
    publishMod.canOrgPublish({
      billingEnabled: true,
      billingStatus: "free",
      compEnabled: false,
    }),
    false,
  );
});

test("M5 QR generator and /p/[slug] non-demo strict boundaries", async () => {
  const qrMod = await import("../lib/qr.ts");
  const assets = await qrMod.generateQrAssets("https://passport.example/p/alpine-36v");
  assert.ok(assets.svg.includes("<svg"));
  assert.ok(assets.pngDataUrl.startsWith("data:image/png;base64,"));

  const viewPath = resolve("src/components/public-passport/PublicPassportView.tsx");
  assert.ok(existsSync(viewPath), "PublicPassportView.tsx must exist");
  const viewSource = readFileSync(viewPath, "utf8");

  assert.ok(viewSource.includes("Provenance & recycling"));
  assert.ok(viewSource.includes("PUBLIC_MANUFACTURER_NOTICE"));
  assert.ok(viewSource.includes("WORKING_FIELD_LIST_NOTICE"));

  // Must NEVER reuse demo fictional content or 2.5D hotspots
  for (const forbidden of [
    "passport.json",
    "RepairViewTab",
    "AuthenticityTab",
    "SupplyJourneyTab",
    "battery-cutaway-25d",
    "hotspot",
    "DEMO",
  ]) {
    assert.equal(
      viewSource.includes(forbidden),
      false,
      `PublicPassportView must never reference ${forbidden}`,
    );
  }
});

test("M5 copy guardrails across workspace, auth, and public passport routes", () => {
  const roots = [
    "src/components/auth",
    "src/components/workspace",
    "src/components/public-passport",
    "src/app/app",
    "src/app/login",
    "src/app/p",
    "src/lib/publish.ts",
    "src/config/battery-fields.ts",
  ];

  const files = [];
  const walk = (target) => {
    const abs = resolve(target);
    if (!existsSync(abs)) return;
    if (statSync(abs).isDirectory()) {
      for (const entry of readdirSync(abs)) {
        walk(join(target, entry));
      }
    } else if (/\.(ts|tsx)$/.test(abs)) {
      files.push(abs);
    }
  };

  for (const root of roots) walk(root);
  assert.ok(files.length >= 10, "Expected at least 10 product UI/config files");

  for (const file of files) {
    const sanitized = readFileSync(file, "utf8").replace(
      /not verified by us/gi,
      "",
    );
    assert.equal(
      /\b(compliant|certified|verified)\b/i.test(sanitized),
      false,
      `Forbidden compliance/verification claim word found in ${file}`,
    );
  }
});
