import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function walkFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

test("M2 Supabase SQL schema, RLS boundaries, public projection, and service-key isolation", async () => {
  const migrationsDir = resolve("supabase/migrations");
  assert.ok(existsSync(migrationsDir), "supabase/migrations directory must exist");

  const sqlFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  assert.ok(sqlFiles.length >= 2, "Expected at least 2 SQL migration files");

  const combinedSql = sqlFiles
    .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
    .join("\n");

  const requiredTables = [
    "organizations",
    "members",
    "products",
    "passports",
    "passport_versions",
    "uploads",
    "audit_log",
    "rate_limits",
  ];

  for (const table of requiredTables) {
    const rlsRegex = new RegExp(
      `alter\\s+table\\s+(?:public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`,
      "i",
    );
    assert.ok(rlsRegex.test(combinedSql), `RLS must be enabled on table ${table}`);
  }

  // Immutable append-only protections
  assert.ok(/prevent_row_mutation/i.test(combinedSql), "Mutation prevention trigger missing");
  assert.ok(/on\s+public\.passport_versions/i.test(combinedSql));
  assert.ok(/on\s+public\.audit_log/i.test(combinedSql));

  // Public RPC must only read published status and public snapshot
  assert.ok(/function\s+public\.get_published_passport/i.test(combinedSql));
  assert.ok(/status\s*=\s*'published'/i.test(combinedSql));
  assert.equal(
    /get_published_passport[\s\S]*?snapshot_all_fields/i.test(combinedSql),
    false,
    "get_published_passport must never expose snapshot_all_fields",
  );

  // Private bucket spec-pdfs
  assert.ok(/'spec-pdfs'/.test(combinedSql), "Private storage bucket spec-pdfs missing");
  assert.ok(/10485760/.test(combinedSql), "10 MB limit missing in storage bucket definition");

  // Projection strips restricted and unknown fields
  const projection = await import("../lib/passport-projection.ts");
  const sampleAll = {
    battery_model_name: "NordCell 36V",
    nominal_voltage_v: "36",
    bms_firmware_version: "FW-SECRET-9.2",
    internal_test_report_ref: "UN38.3-INTERNAL-ONLY",
    dismantling_manual_ref: "WORKSHOP-SECRET-DOC",
    injected_unknown_key: "should-be-dropped",
  };
  const publicOnly = projection.projectPublicPassportFields(sampleAll);
  assert.equal(publicOnly.battery_model_name, "NordCell 36V");
  assert.equal(publicOnly.nominal_voltage_v, "36");
  assert.equal(publicOnly.bms_firmware_version, undefined);
  assert.equal(publicOnly.internal_test_report_ref, undefined);
  assert.equal(publicOnly.dismantling_manual_ref, undefined);
  assert.equal(publicOnly.injected_unknown_key, undefined);

  // Conditional public tabs: hide Repair and Supply when empty; never show fictional demo tabs
  assert.deepEqual(projection.getVisiblePassportTabs({ battery_model_name: "NordCell 36V" }), [
    "passport",
    "provenance",
  ]);
  assert.deepEqual(
    projection.getVisiblePassportTabs({
      battery_model_name: "NordCell 36V",
      safe_charging_window: "Charge 0-40C",
    }),
    ["passport", "repair", "provenance"],
  );
  assert.deepEqual(
    projection.getVisiblePassportTabs({
      battery_model_name: "NordCell 36V",
      supply_eu_warehouse: "Rotterdam Hub NL",
    }),
    ["passport", "supply", "provenance"],
  );

  // Required Change D: no client component imports admin client or references SUPABASE_SERVICE_ROLE_KEY
  for (const filePath of walkFiles(resolve("src"))) {
    const content = readFileSync(filePath, "utf8");
    const isClientComponent = /^\s*["']use client["'];?/m.test(content);
    if (isClientComponent) {
      assert.equal(
        content.includes("SUPABASE_SERVICE_ROLE_KEY"),
        false,
        `Client component ${filePath} must never reference SUPABASE_SERVICE_ROLE_KEY`,
      );
      assert.equal(
        /supabase\/admin/.test(content),
        false,
        `Client component ${filePath} must never import supabase/admin`,
      );
    }
  }
});

test("M2 normalizeSupabaseUrl strips accidental REST path suffixes and rejects placeholders", async () => {
  const envMod = await import("../lib/supabase/env.ts");
  assert.equal(
    envMod.normalizeSupabaseUrl("https://fcnytdipvxwzfqswdytu.supabase.co/rest/v1/"),
    "https://fcnytdipvxwzfqswdytu.supabase.co",
  );
  assert.equal(
    envMod.normalizeSupabaseUrl("https://myproj.supabase.co/"),
    "https://myproj.supabase.co",
  );
  assert.equal(
    envMod.normalizeSupabaseUrl("https://your-project-ref.supabase.co"),
    null,
  );
  assert.equal(envMod.normalizeSupabaseUrl("not-a-url"), null);
});
