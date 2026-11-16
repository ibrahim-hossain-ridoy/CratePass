import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  projectPublicPassportFields,
  projectTieredPassportSnapshots,
  getVisiblePassportTabs,
} from "../lib/passport-projection.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("M2 SQL migration defines all required tables, RLS policies, and public-only projection RPC", () => {
  const migrationsDir = path.join(repoRoot, "supabase/migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  assert.ok(migrationFiles.length >= 2, "Migration SQL files must exist");

  const sql = migrationFiles
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"))
    .join("\n");
  const requiredTables = [
    "organizations",
    "members",
    "products",
    "passports",
    "passport_versions",
    "uploads",
    "audit_log",
  ];
  for (const table of requiredTables) {
    assert.match(
      sql,
      new RegExp(`create table if not exists public\\.${table}`, "i"),
      `Missing table definition: ${table}`,
    );
    assert.match(
      sql,
      new RegExp(
        `alter table public\\.${table} enable row level security`,
        "i",
      ),
      `Missing RLS enablement for table: ${table}`,
    );
  }

  assert.match(
    sql,
    /create or replace function public\.get_published_passport/i,
    "Must define get_published_passport RPC for public-tier projection",
  );

  const tierMigrationPath = path.join(
    migrationsDir,
    "202611160003_three_tier_and_category.sql",
  );
  assert.ok(
    fs.existsSync(tierMigrationPath),
    "3-tier migration SQL file must exist",
  );
  const tierSql = fs.readFileSync(tierMigrationPath, "utf8");
  assert.match(tierSql, /snapshot_legitimate_interest_fields/i);
  assert.match(tierSql, /snapshot_authorities_only_fields/i);
  assert.doesNotMatch(
    tierSql.slice(tierSql.indexOf("get_published_passport")),
    /snapshot_legitimate_interest_fields|snapshot_authorities_only_fields/i,
    "Updated get_published_passport RPC must never return legitimate_interest or authorities_only fields",
  );
});

test("projectPublicPassportFields and projectTieredPassportSnapshots separate public, legitimate_interest, authorities_only, and additional_information", () => {
  const rawFields = {
    model_serial_number: "LMT-48V-14AH-DEMO",
    nominal_voltage_v: "48",
    detailed_composition: "NMC811 cathode, graphite anode, LiPF6 electrolyte",
    part_numbers_components: "BMS-991-A, CELL-21700-X",
    compliance_test_reports: "TR-2026-UN383-99812.pdf",
    additional_information: "<b>Custom thermal pad note</b> from datasheet",
    unknown_injected_field: "malicious payload",
  };

  const projectedPublic = projectPublicPassportFields(rawFields);
  assert.equal(projectedPublic.model_serial_number, "LMT-48V-14AH-DEMO");
  assert.equal(projectedPublic.nominal_voltage_v, "48");
  assert.equal(
    "detailed_composition" in projectedPublic,
    false,
    "Legitimate-interest field (Point 46) must be stripped from public projection",
  );
  assert.equal(
    "part_numbers_components" in projectedPublic,
    false,
    "Legitimate-interest field (Point 47) must be stripped from public projection",
  );
  assert.equal(
    "compliance_test_reports" in projectedPublic,
    false,
    "Authorities-only field (Point 50) must be stripped from public projection",
  );
  assert.equal(
    "additional_information" in projectedPublic,
    false,
    "Private catch-all additional_information must never appear in public projection",
  );
  assert.equal(
    "unknown_injected_field" in projectedPublic,
    false,
    "Unknown fields must be stripped from public projection",
  );

  const tiered = projectTieredPassportSnapshots(rawFields);
  assert.equal(
    tiered.snapshotPublicFields.model_serial_number,
    "LMT-48V-14AH-DEMO",
  );
  assert.equal(
    tiered.snapshotLegitimateInterestFields.detailed_composition,
    "NMC811 cathode, graphite anode, LiPF6 electrolyte",
  );
  assert.equal(
    tiered.snapshotLegitimateInterestFields.additional_information,
    "Custom thermal pad note from datasheet",
    "HTML tags must be stripped from additional_information",
  );
  assert.equal(
    tiered.snapshotAuthoritiesOnlyFields.compliance_test_reports,
    "TR-2026-UN383-99812.pdf",
  );
});

test("getVisiblePassportTabs hides tabs that have no public fields", () => {
  const minimalPublic = {
    model_serial_number: "LMT-48V-14AH-DEMO",
    manufacturer_name: "NordVolt Mobility Craft",
  };
  const tabsMinimal = getVisiblePassportTabs(minimalPublic);
  assert.deepEqual(tabsMinimal, ["passport", "provenance"]);

  const withRepairAndSupply = {
    ...minimalPublic,
    extinguishing_agent: "ABC dry powder or copious water",
    place_of_manufacture: "pack_assembly: DE; cell_production: PL",
  };
  const tabsAll = getVisiblePassportTabs(withRepairAndSupply);
  assert.deepEqual(tabsAll, ["passport", "repair", "supply", "provenance"]);
});

test("SUPABASE_SERVICE_ROLE_KEY is never referenced in client components", () => {
  const srcDir = path.join(repoRoot, "src");

  function walkFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__") continue;
        files = files.concat(walkFiles(fullPath));
      } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allSourceFiles = walkFiles(srcDir);
  for (const filePath of allSourceFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const isClientComponent = /^["']use client["'];/m.test(content);
    const isPublicEnvFile = filePath.endsWith("env.public.ts");

    if (isClientComponent || isPublicEnvFile) {
      assert.equal(
        content.includes("SUPABASE_SERVICE_ROLE_KEY"),
        false,
        `SUPABASE_SERVICE_ROLE_KEY must never appear in client/public module: ${path.relative(repoRoot, filePath)}`,
      );
      assert.equal(
        content.includes("lib/supabase/admin"),
        false,
        `Admin client must never be imported in client/public module: ${path.relative(repoRoot, filePath)}`,
      );
    }
  }
});
