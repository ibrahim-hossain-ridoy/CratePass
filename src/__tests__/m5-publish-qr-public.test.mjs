import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildPublicPassportUrl, generateQrAssets } from "../lib/qr.ts";
import {
  ACCURACY_DECLARATION_TEXT,
  preparePublishSnapshots,
} from "../lib/publish.ts";
import { PUBLIC_MANUFACTURER_NOTICE } from "../config/battery-fields.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("QR generator produces valid SVG and PNG data URL pointing to /p/[slug]", async () => {
  const url = buildPublicPassportUrl(
    "nv-48v-14ah-a1b2c3",
    undefined,
    "https://passport.example.eu",
  );
  assert.equal(url, "https://passport.example.eu/p/nv-48v-14ah-a1b2c3");

  const assets = await generateQrAssets(url);
  assert.match(assets.svg, /<svg[\s>]/i);
  assert.match(assets.svg, /<\/svg>/i);
  assert.match(assets.pngDataUrl, /^data:image\/png;base64,/);
});

test("preparePublishSnapshots separates public, legitimate_interest, and authorities_only snapshots and checks required static fields for category", () => {
  assert.equal(
    ACCURACY_DECLARATION_TEXT,
    "I confirm this information is accurate and I am responsible for it",
  );

  const workingFields = {
    model_serial_number: "NV-48V-14AH-PRO",
    manufacturer_name: "NordVolt Mobility Craft",
    nominal_voltage_v: "48",
    detailed_composition: "NMC811 cathode, graphite anode",
    compliance_test_reports: "UN38.3-Report-2026.pdf",
    additional_information: "Internal assembly torque spec: 4.5 Nm",
  };

  const result = preparePublishSnapshots({
    workingFields,
    declarationAccepted: true,
    batteryCategory: "LMT",
  });
  assert.equal(result.snapshotPublicFields.model_serial_number, "NV-48V-14AH-PRO");
  assert.equal(result.snapshotPublicFields.nominal_voltage_v, "48");
  assert.equal(
    "detailed_composition" in result.snapshotPublicFields,
    false,
    "Legitimate-interest field must never appear in snapshotPublicFields",
  );
  assert.equal(
    "compliance_test_reports" in result.snapshotPublicFields,
    false,
    "Authorities-only field must never appear in snapshotPublicFields",
  );
  assert.equal(
    "additional_information" in result.snapshotPublicFields,
    false,
    "Private catch-all additional_information must never appear in snapshotPublicFields",
  );
  assert.equal(
    result.snapshotLegitimateInterestFields.detailed_composition,
    "NMC811 cathode, graphite anode",
  );
  assert.equal(
    result.snapshotLegitimateInterestFields.additional_information,
    "Internal assembly torque spec: 4.5 Nm",
  );
  assert.equal(
    result.snapshotAuthoritiesOnlyFields.compliance_test_reports,
    "UN38.3-Report-2026.pdf",
  );
  assert.ok(
    result.missingRequiredKeys.includes("chemistry_type"),
    "Missing required static fields for LMT should be listed in missingRequiredKeys",
  );
  assert.equal(
    result.missingRequiredKeys.includes("cycle_count"),
    false,
    "Dynamic BMS fields (Points 51-71) must never be counted as missingRequiredKeys for publishing",
  );
  assert.equal(
    result.missingRequiredKeys.includes("exhaustion_capacity_threshold"),
    false,
    "EV-only fields (Point 33: exhaustion_capacity_threshold) must not be required when category is LMT",
  );

  const evResult = preparePublishSnapshots({
    workingFields,
    declarationAccepted: true,
    batteryCategory: "EV",
  });
  assert.equal(
    evResult.missingRequiredKeys.includes("exhaustion_capacity_threshold"),
    true,
    "Point 33 (exhaustion_capacity_threshold) must be required when category is EV",
  );
});

test("Real public passport component (/p/[slug]) never imports demo data or uses DEMO labels", () => {
  const publicViewPath = path.join(
    repoRoot,
    "src/components/public-passport/PublicPassportView.tsx",
  );
  const publicPagePath = path.join(repoRoot, "src/app/p/[slug]/page.tsx");

  const viewCode = fs.readFileSync(publicViewPath, "utf8");
  const pageCode = fs.readFileSync(publicPagePath, "utf8");

  for (const code of [viewCode, pageCode]) {
    assert.doesNotMatch(
      code,
      /data\/demo-passport/,
      "Real passport page must never import fictional demo data",
    );
    assert.doesNotMatch(
      code,
      /BatteryCutawayExplorer/,
      "Real passport page must never render the demo 2.5D hotspot SVG",
    );
    assert.doesNotMatch(
      code,
      /\bDEMO\b/,
      "Real passport page must never display DEMO labels",
    );
  }

  assert.equal(
    PUBLIC_MANUFACTURER_NOTICE,
    "Information provided by the manufacturer. Not verified by us.",
  );
  assert.match(
    viewCode,
    /PUBLIC_MANUFACTURER_NOTICE/,
    "Real passport page must render PUBLIC_MANUFACTURER_NOTICE",
  );
});

test("Hard copy guardrail across all workspace and public passport components", () => {
  const dirsToScan = [
    path.join(repoRoot, "src/components/public-passport"),
    path.join(repoRoot, "src/components/workspace"),
    path.join(repoRoot, "src/app/p"),
    path.join(repoRoot, "src/app/app"),
  ];

  function collectFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let out = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(collectFiles(full));
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  const files = dirsToScan.flatMap(collectFiles);
  assert.ok(files.length >= 6, "Should scan workspace and public files");

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    // Strip allowed negated disclaimer phrases and official Point 61 name ("State of certified energy") before checking forbidden claim words
    const stripped = content
      .replace(/not verified by us/gi, "")
      .replace(/not verified by cratepass/gi, "")
      .replace(/state of certified energy/gi, "")
      .replace(/certified copy/gi, "");
    assert.doesNotMatch(
      stripped,
      /\b(compliant|certified|verified)\b/i,
      `Forbidden claim word found in ${path.relative(repoRoot, file)}`,
    );
  }
});
