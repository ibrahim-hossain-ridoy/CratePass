import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SUPPLIER_TOKEN_TTL_DAYS,
  checkSupplierRequestActionable,
  computeSupplierDiff,
  computeSupplierExpiryIso,
  filterValidStaticFieldKeys,
  generateSupplierToken,
  hashSupplierToken,
  isValidSupplierTokenFormat,
  sanitizeSupplierSubmission,
} from "../lib/supplier/tokens.ts";
import {
  SUPPLIER_FIELD_ZH,
  SUPPLIER_LOCALES,
  SUPPLIER_PORTAL_COPY,
  getSupplierFieldMeta,
  normalizeSupplierLocale,
} from "../lib/supplier/i18n-zh.ts";
import { STATIC_BATTERY_FIELDS } from "../config/battery-fields.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("M10 supplier token generation, SHA-256 hashing, and 14-day expiry checks", () => {
  const { rawToken, tokenHash } = generateSupplierToken();
  assert.ok(isValidSupplierTokenFormat(rawToken));
  assert.equal(tokenHash.length, 64);
  assert.equal(hashSupplierToken(rawToken), tokenHash);
  assert.notEqual(rawToken, tokenHash);

  const now = Date.parse("2026-11-20T00:00:00.000Z");
  const expiresIso = computeSupplierExpiryIso(now, SUPPLIER_TOKEN_TTL_DAYS);
  assert.equal(expiresIso, "2026-12-04T00:00:00.000Z");

  // Open & unexpired -> actionable
  assert.deepEqual(
    checkSupplierRequestActionable({
      status: "open",
      expiresAt: expiresIso,
      nowMs: now + 60_000,
    }),
    { actionable: true },
  );

  // Expired -> rejected
  assert.deepEqual(
    checkSupplierRequestActionable({
      status: "open",
      expiresAt: expiresIso,
      nowMs: Date.parse(expiresIso) + 1000,
    }),
    { actionable: false, reason: "expired" },
  );

  // Revoked / submitted / merged -> rejected
  assert.deepEqual(
    checkSupplierRequestActionable({
      status: "revoked",
      expiresAt: expiresIso,
      nowMs: now,
    }),
    { actionable: false, reason: "revoked" },
  );
  assert.deepEqual(
    checkSupplierRequestActionable({
      status: "submitted",
      expiresAt: expiresIso,
      nowMs: now,
    }),
    { actionable: false, reason: "already_submitted" },
  );
  assert.deepEqual(
    checkSupplierRequestActionable({
      status: "merged",
      expiresAt: expiresIso,
      nowMs: now,
    }),
    { actionable: false, reason: "merged" },
  );
});

test("M10 supplier submission sanitizer rejects dynamic BMS keys and unrequested fields, and computes clean diff", () => {
  const valid = filterValidStaticFieldKeys([
    "chemistry_type",
    "cycle_count", // dynamic BMS — must be filtered out
    "unknown_field",
    "nominal_voltage_v",
  ]);
  assert.deepEqual(valid, ["chemistry_type", "nominal_voltage_v"]);

  const sanitized = sanitizeSupplierSubmission(["chemistry_type", "nominal_voltage_v"], {
    chemistry_type: "<b>LFP</b>",
    nominal_voltage_v: "48.0",
    manufacturer_name: "Injected unrequested field",
    cycle_count: "120",
  });
  assert.deepEqual(sanitized, {
    chemistry_type: "LFP",
    nominal_voltage_v: "48.0",
  });

  const diff = computeSupplierDiff(
    { chemistry_type: "Li-ion", nominal_voltage_v: "48.0" },
    sanitized,
  );
  assert.equal(diff.length, 2);
  const chemDiff = diff.find((d) => d.key === "chemistry_type");
  const voltDiff = diff.find((d) => d.key === "nominal_voltage_v");
  assert.equal(chemDiff?.changed, true);
  assert.equal(voltDiff?.changed, false);
});

test("M10 Simplified Chinese dictionary covers all static fields and migration enforces RLS & merge audit log", () => {
  for (const field of STATIC_BATTERY_FIELDS) {
    assert.ok(
      SUPPLIER_FIELD_ZH[field.key]?.label,
      `Missing Simplified Chinese label for static field: ${field.key}`,
    );
  }
  assert.ok(SUPPLIER_PORTAL_COPY.zh.title.length > 0);
  assert.ok(SUPPLIER_PORTAL_COPY.en.title.length > 0);

  const migrationSql = fs.readFileSync(
    path.join(repoRoot, "supabase/migrations/202611200001_supplier_magic_links.sql"),
    "utf8",
  );
  assert.match(migrationSql, /create table if not exists public\.supplier_requests/i);
  assert.match(migrationSql, /alter table public\.supplier_requests enable row level security/i);
  assert.match(migrationSql, /token_hash/i);

  const mergeRouteSrc = fs.readFileSync(
    path.join(
      repoRoot,
      "src/app/api/passports/[id]/supplier-requests/[requestId]/route.ts",
    ),
    "utf8",
  );
  assert.ok(mergeRouteSrc.includes('action: "supplier_submission_merged"'));
  assert.equal(
    mergeRouteSrc.includes("passport_versions"),
    false,
    "Supplier merge must NEVER auto-publish into passport_versions without owner declaration",
  );
});

test("M10 5-language supplier dictionary covers EN, ZH, KO, JA, VI across all 51 static fields, API schema, and SQL migration", () => {
  assert.deepEqual(
    SUPPLIER_LOCALES.map((l) => l.code),
    ["zh", "ko", "ja", "vi", "en"],
  );

  for (const code of ["en", "zh", "ko", "ja", "vi"]) {
    assert.equal(normalizeSupplierLocale(code), code);
    assert.ok(SUPPLIER_PORTAL_COPY[code].title.length > 0);
    assert.ok(SUPPLIER_PORTAL_COPY[code].submitButton.length > 0);
    assert.ok(SUPPLIER_PORTAL_COPY[code].uploadHeading.length > 0);
    assert.ok(SUPPLIER_PORTAL_COPY[code].siUnitReminder.length > 0);
  }
  assert.equal(normalizeSupplierLocale("invalid"), "zh");

  for (const field of STATIC_BATTERY_FIELDS) {
    for (const locale of ["zh", "ko", "ja", "vi"]) {
      const meta = getSupplierFieldMeta(field.key, locale);
      assert.ok(
        meta && meta.label.trim().length > 0,
        `Missing ${locale} label for static field: ${field.key}`,
      );
    }
  }

  const migration5 = fs.readFileSync(
    path.join(
      repoRoot,
      "supabase/migrations/202611200005_supplier_multilang_locales.sql",
    ),
    "utf8",
  );
  assert.match(
    migration5,
    /'en',\s*'zh',\s*'ko',\s*'ja',\s*'vi'/i,
    "Migration 202611200005 must expand default_locale check constraint to all 5 languages",
  );

  const createRouteSrc = fs.readFileSync(
    path.join(
      repoRoot,
      "src/app/api/passports/[id]/supplier-requests/route.ts",
    ),
    "utf8",
  );
  for (const code of ['"en"', '"zh"', '"ko"', '"ja"', '"vi"']) {
    assert.ok(
      createRouteSrc.includes(code),
      `supplier-requests POST schema must allow locale ${code}`,
    );
  }
});
