import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  UNITS_CSV_TEMPLATE,
  buildUnitPublicUrl,
  parseSerializedUnitsCsv,
} from "../lib/serialization/csv.ts";
import { buildQrLabelSheetPdf } from "../lib/export/pdf-builder.ts";
import { createZipArchive } from "../lib/export/zip.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("M11 CSV serialization parser validates format, GTIN-14, ISO dates, and catches duplicates", () => {
  const sample = [
    "serial_number,gtin,batch_lot,manufacturing_date",
    "SN-2026-0001,04012345678901,BATCH-A,2026-11-01",
    "SN-2026-0002,,BATCH-A,2026-11-02",
    "SN-2026-0001,04012345678901,BATCH-A,2026-11-01", // duplicate in CSV
    "SN-2026-0003,12345,BATCH-A,2026-11-03", // invalid GTIN
    "SN-2026-0004,04012345678901,BATCH-A,2026-13-40", // invalid date
    "EXISTING-01,04012345678901,BATCH-A,2026-11-05", // duplicate against DB
  ].join("\n");

  const parsed = parseSerializedUnitsCsv(sample, ["existing-01"]);
  assert.equal(parsed.validRows.length, 2);
  assert.deepEqual(parsed.validRows[0], {
    serial_number: "SN-2026-0001",
    gtin: "04012345678901",
    batch_lot: "BATCH-A",
    manufacturing_date: "2026-11-01",
  });
  assert.equal(parsed.validRows[1].gtin, null);
  assert.equal(parsed.duplicateSerials.length, 2);
  assert.equal(parsed.errors.length, 4);

  // Built-in template parses cleanly with zero errors
  const templateRes = parseSerializedUnitsCsv(UNITS_CSV_TEMPLATE);
  assert.equal(templateRes.errors.length, 0);
  assert.equal(templateRes.validRows.length, 2);
});

test("M11 GS1 Digital Link URL builder routes GTIN units to /01/[gtin]/21/[serial] and non-GTIN units to /p/[slug]/u/[serial]", () => {
  assert.equal(
    buildUnitPublicUrl({
      origin: "https://cratepass.eu/",
      slug: "alpine-36v",
      serialNumber: "SN-001",
      gtin: "04012345678901",
    }),
    "https://cratepass.eu/01/04012345678901/21/SN-001",
  );
  assert.equal(
    buildUnitPublicUrl({
      origin: "https://cratepass.eu",
      slug: "alpine-36v",
      serialNumber: "SN-002",
      gtin: null,
    }),
    "https://cratepass.eu/p/alpine-36v/u/SN-002",
  );
});

test("M11 A4 QR Label Sheet PDF and ZIP exporters generate valid binary payloads and migration enforces RLS", () => {
  const pdfBytes = buildQrLabelSheetPdf({
    modelName: "Alpine 36V-504 Pack",
    slug: "alpine-36v",
    labels: [
      {
        serialNumber: "SN-2026-001",
        modelName: "Alpine 36V-504 Pack",
        gtin: "04012345678901",
        batchLot: "LOT-2026-Q4",
        url: "https://cratepass.eu/01/04012345678901/21/SN-2026-001",
      },
      {
        serialNumber: "SN-2026-002",
        modelName: "Alpine 36V-504 Pack",
        url: "https://cratepass.eu/p/alpine-36v/u/SN-2026-002",
      },
    ],
  });
  const pdfHeader = Buffer.from(pdfBytes.subarray(0, 8)).toString("latin1");
  const pdfTail = Buffer.from(pdfBytes.subarray(-16)).toString("latin1");
  assert.ok(pdfHeader.startsWith("%PDF-1.4"), "Expected valid PDF 1.4 header");
  assert.ok(pdfTail.includes("%%EOF"), "Expected valid PDF EOF trailer");

  const zipBytes = createZipArchive([
    { name: "svg/SN-001.svg", data: "<svg></svg>" },
    { name: "manifest.csv", data: "serial_number\nSN-001\n" },
  ]);
  // PK\x03\x04 local file header signature
  assert.equal(zipBytes[0], 0x50);
  assert.equal(zipBytes[1], 0x4b);
  assert.equal(zipBytes[2], 0x03);
  assert.equal(zipBytes[3], 0x04);

  const migrationSql = fs.readFileSync(
    path.join(
      repoRoot,
      "supabase/migrations/202611200002_passport_units_serialization.sql",
    ),
    "utf8",
  );
  assert.match(migrationSql, /create table if not exists public\.passport_units/i);
  assert.match(migrationSql, /alter table public\.passport_units enable row level security/i);
  assert.match(migrationSql, /get_published_passport_unit/i);
  assert.match(migrationSql, /get_published_passport_by_gs1/i);
  assert.doesNotMatch(
    migrationSql,
    /snapshot_legitimate_interest_fields|snapshot_authorities_only_fields/i,
    "Public unit RPCs must never select restricted field snapshots",
  );
});
