import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BATTERY_FIELDS, OFFICIAL_71_FIELDS } from "../config/battery-fields.ts";
import {
  buildEuRegistryJsonLd,
  computeCanonicalSnapshotSha256,
} from "../lib/export/jsonld.ts";
import { buildAuditDataPackagePdf } from "../lib/export/audit-package-pdf.ts";
import {
  PUBLIC_PASSPORT_LOCALES,
  PUBLIC_PASSPORT_UI,
  getLocalizedFieldLabel,
  getTranslatedFieldKeyCount,
} from "../i18n/passport-public.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("M12 EU Registry JSON-LD projection strictly emits public-only fields and deterministic SHA-256 hash", () => {
  // Populate EVERY single one of the 72 fields including legitimate_interest, authorities_only, and additional_information
  const rawAll = Object.fromEntries(
    BATTERY_FIELDS.map((f) => [f.key, `secret-or-public-${f.key}`]),
  );

  const doc = buildEuRegistryJsonLd({
    slug: "alpine-36v-pack",
    origin: "https://cratepass.eu",
    batteryCategory: "LMT",
    recordMode: "full_passport",
    versionNumber: 2,
    declaredAt: "2026-11-20T12:00:00.000Z",
    rawFields: rawAll,
    commodityCode: "85076000",
  });

  assert.equal(doc["@type"], "din99100:BatteryPassport");
  assert.equal(doc["@id"], "https://cratepass.eu/p/alpine-36v-pack");
  assert.equal(doc["din99100:commodityCode"], "85076000");
  assert.equal(doc["din99100:passportVersion"], 2);
  assert.equal(doc["din99100:accessTier"], "public");
  assert.match(doc["din99100:snapshotIntegritySha256"], /^[0-9a-f]{64}$/);

  const attrs = doc["annexXIII:publicAttributes"];
  // Zero leakage of legitimate_interest, authorities_only, or additional_information
  for (const restrictedKey of [
    "detailed_composition",
    "spare_parts_info",
    "dismantling_information",
    "safety_measures",
    "compliance_test_reports",
    "cycle_count",
    "remaining_capacity_ah",
    "additional_information",
  ]) {
    assert.equal(
      restrictedKey in attrs,
      false,
      `Restricted field '${restrictedKey}' MUST NEVER leak into EU Registry JSON-LD`,
    );
  }

  for (const key of Object.keys(attrs)) {
    const def = BATTERY_FIELDS.find((f) => f.key === key);
    assert.equal(def?.tier, "public", `Non-public field '${key}' leaked into JSON-LD`);
  }

  // Canonical hash is order-independent
  const hashA = computeCanonicalSnapshotSha256({ b: "2", a: "1" });
  const hashB = computeCanonicalSnapshotSha256({ a: "1", b: "2" });
  assert.equal(hashA, hashB);
});

test("M12 Audit Data Package PDF generates valid PDF with 50 static / 21 dynamic breakdown and mandatory non-verification footer", () => {
  const pdfBytes = buildAuditDataPackagePdf({
    orgName: "NordVolt Mobility GmbH",
    productName: "Alpine 36V-504 Pack",
    modelCode: "NV-36V-504",
    slug: "alpine-36v-pack",
    publicUrl: "https://cratepass.eu/p/alpine-36v-pack",
    batteryCategory: "LMT",
    recordMode: "full_passport",
    status: "published",
    workingFields: {
      manufacturer_name: "NordVolt Mobility GmbH",
      nominal_voltage_v: "36",
      capacity_ah: "14",
      chemistry_type: "Li-ion NMC 811",
    },
    versions: [
      {
        versionNumber: 1,
        declaredAt: "2026-11-20T10:00:00.000Z",
        sha256: "a".repeat(64),
      },
    ],
  });

  const text = Buffer.from(pdfBytes).toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.includes("%%EOF"));
  assert.ok(text.includes("50 static | 21 dynamic BMS"));
  assert.ok(
    text.includes(
      "Prepared by economic operator using CratePass technical hosting; not verified by CratePass.",
    ),
  );
});

test("M12 Multi-language public passport dictionary translates all 71 Annex XIII points across 7 EU languages", () => {
  assert.deepEqual(
    PUBLIC_PASSPORT_LOCALES.map((l) => l.code),
    ["en", "de", "fr", "nl", "es", "it", "pl"],
  );
  assert.equal(getTranslatedFieldKeyCount(), 71);

  for (const locale of PUBLIC_PASSPORT_LOCALES) {
    assert.ok(PUBLIC_PASSPORT_UI[locale.code].passportSubtitle.length > 0);
    assert.ok(PUBLIC_PASSPORT_UI[locale.code].recyclingHeading.length > 0);
    for (const field of OFFICIAL_71_FIELDS) {
      const translated = getLocalizedFieldLabel(field.key, locale.code);
      assert.ok(
        translated && translated.length > 0,
        `Missing ${locale.code} translation for Annex XIII field ${field.key}`,
      );
    }
  }
});

test("M12 Simple QR mode migration, JSON-LD route, and Simple QR endpoint exist with strict security boundaries", () => {
  const migrationSql = fs.readFileSync(
    path.join(
      repoRoot,
      "supabase/migrations/202611200003_simple_qr_and_branding.sql",
    ),
    "utf8",
  );
  assert.match(migrationSql, /record_mode/i);
  assert.match(migrationSql, /simple_qr/i);
  assert.match(migrationSql, /brand_logo_url/i);
  assert.match(migrationSql, /custom_domain_verified/i);
  assert.doesNotMatch(
    migrationSql.slice(migrationSql.indexOf("get_published_passport")),
    /snapshot_legitimate_interest_fields|snapshot_authorities_only_fields/i,
    "Updated public RPCs must never select restricted field snapshots",
  );

  const jsonLdRoute = fs.readFileSync(
    path.join(repoRoot, "src/app/p/[slug]/passport.jsonld/route.ts"),
    "utf8",
  );
  assert.ok(jsonLdRoute.includes("buildEuRegistryJsonLd"));
  assert.ok(jsonLdRoute.includes('rpc("get_published_passport"'));
  assert.ok(jsonLdRoute.includes("application/ld+json"));

  const simpleQrRoute = fs.readFileSync(
    path.join(repoRoot, "src/app/api/passports/simple-qr/route.ts"),
    "utf8",
  );
  assert.ok(simpleQrRoute.includes('record_mode: "simple_qr"'));
  assert.ok(simpleQrRoute.includes("validatePdfUpload"));
});
